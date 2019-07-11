import fs = require("fs");
import cdk = require("@aws-cdk/core");
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import apigw = require("@aws-cdk/aws-apigateway");
import batch = require("@aws-cdk/aws-batch");
import ec2 = require("@aws-cdk/aws-ec2");
import s3 = require("@aws-cdk/aws-s3");
import dynamodb = require("@aws-cdk/aws-dynamodb");
import events = require("@aws-cdk/aws-events");
import targets = require("@aws-cdk/aws-events-targets");
import { DockerImageAsset } from "@aws-cdk/aws-ecr-assets";
import { Config } from "./types";

export class KuhnuriStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const conf = props.env as Config;
    const stack = this;

    const vpc = new ec2.Vpc(stack, "NewVPC", {
      cidr: "10.0.0.0/16",
      natGateways: 1
    });

    // ECR
    // ===

    const workers = conf.workers.map((worker, i) => {
      let asset;
      if (worker.plugins && worker.plugins.length !== 0) {
        const lines = [`FROM ${conf.baseImage}`].concat(
          worker.plugins.map(plugin => `RUN dita --install ${plugin}`)
        );
        const dir = `build/docker/${i}`;
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (err) {
          if (err !== "EEXIST") {
            throw err;
          }
        }
        fs.writeFileSync(`${dir}/Dockerfile`, lines.join("\n"));
        asset = new DockerImageAsset(stack, `DitaOtImage_${i}`, {
          directory: dir
        });
      }
      return {
        ...worker,
        asset
      };
    });

    // Batch
    // =====

    const batchExecutionRole = new iam.Role(stack, "BatchExecutionRole", {
      assumedBy: new iam.ServicePrincipal("batch.amazonaws.com")
    });
    batchExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSBatchServiceRole"
      )
    );
    batchExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSBatchFullAccess")
    );
    batchExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2ContainerServiceforEC2Role"
      )
    );
    workers.forEach(worker => {
      if (worker.asset) {
        worker.asset.repository.grantPull(batchExecutionRole);
      }
    });

    const batchInstanceRole = new iam.Role(stack, "BatchInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com")
    });

    batchInstanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2ContainerServiceforEC2Role"
      )
    );

    const batchInstanceProfile = new iam.CfnInstanceProfile(
      stack,
      "BatchInstanceProfile",
      {
        roles: [batchInstanceRole.roleName]
      }
    );

    const batchJobRole = new iam.Role(stack, "BatchJobRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    });
    batchJobRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSBatchServiceRole"
      )
    );
    batchJobRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );
    batchJobRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2ContainerServiceforEC2Role"
      )
    );

    const securityGroup = new ec2.SecurityGroup(stack, "BatchSecurityGroup", {
      vpc
    });

    const computeEnvironment = new batch.CfnComputeEnvironment(
      stack,
      "DitaOtComputeEnvironment",
      {
        serviceRole: batchExecutionRole.roleArn,
        type: "MANAGED",
        computeResources: {
          // bidPercentage: Integer
          desiredvCpus: 1,
          // ec2KeyPair: String
          // imageId: String
          instanceRole: batchInstanceProfile.ref,
          instanceTypes: ["optimal"],
          // launchTemplate:
          //   LaunchTemplateSpecification
          maxvCpus: 2,
          minvCpus: 0,
          // placementGroup: String
          securityGroupIds: [securityGroup.securityGroupId],
          // spotIamFleetRole: String
          subnets: vpc.privateSubnets.map(subnet => subnet.subnetId),
          // tags: Json
          type: "EC2"
          // type: "SPOT"
        }
      }
    );

    const spotIamFleetRole = new iam.Role(stack, "AmazonEC2SpotFleetRole", {
      assumedBy: new iam.ServicePrincipal("spotfleet.amazonaws.com")
    });
    spotIamFleetRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2SpotFleetTaggingRole"
      )
    );
    const ec2SpotRole = new iam.CfnServiceLinkedRole(
      stack,
      "AWSServiceRoleForEC2Spot",
      {
        awsServiceName: "spot.amazonaws.com"
      }
    );
    const ec2SpotFleetRole = new iam.CfnServiceLinkedRole(
      stack,
      "AWSServiceRoleForEC2SpotFleet",
      {
        awsServiceName: "spotfleet.amazonaws.com"
      }
    );

    const computeEnvironmentSpot = new batch.CfnComputeEnvironment(
      stack,
      "DitaOtComputeEnvironmentSpot",
      {
        serviceRole: batchExecutionRole.roleArn,
        type: "MANAGED",
        computeResources: {
          // bidPercentage: Integer
          desiredvCpus: 1,
          // ec2KeyPair: String
          // imageId: String
          instanceRole: batchInstanceProfile.ref,
          instanceTypes: ["optimal"],
          // launchTemplate:
          //   LaunchTemplateSpecification
          maxvCpus: 2,
          minvCpus: 0,
          // placementGroup: String
          securityGroupIds: [securityGroup.securityGroupId],
          spotIamFleetRole: spotIamFleetRole.roleArn,
          subnets: vpc.privateSubnets.map(subnet => subnet.subnetId),
          // tags: Json
          type: "SPOT"
        }
      }
    );

    const jobDefinitions = workers.map((worker, i) => {
      const image = worker.asset ? worker.asset.imageUri : conf.baseImage;
      const jobDefinition = new batch.CfnJobDefinition(
        stack,
        `DitaOtJobDefinition_${i}`,
        {
          type: "container",
          // jobDefinitionName: "DitaOtJobDefinition",
          // parameters: {},
          containerProperties: {
            command: ["dita"],
            environment: [
              {
                name: "AWS_DEFAULT_REGION",
                value: conf.region
              }
            ],
            image,
            // instanceType : String,
            jobRoleArn: batchJobRole.roleArn,
            memory: 1024,
            // mountPoints : [ MountPoints, ... ],
            // privileged : Boolean,
            readonlyRootFilesystem: false,
            // resourceRequirements : [ ResourceRequirement, ... ],
            // ulimits : [ Ulimit, ... ],
            // user : String,
            vcpus: 1
            // volumes : [ Volumes, ... ]
          }
        }
      );
      return { jobDefinition, transtypes: worker.transtypes };
    });

    const queue = new batch.CfnJobQueue(stack, "DitaOtJobQueue", {
      computeEnvironmentOrder: [
        {
          computeEnvironment: computeEnvironment.ref,
          order: 0
        }
      ],
      priority: 0
    });

    const queueSpot = new batch.CfnJobQueue(stack, "DitaOtJobQueueSpot", {
      computeEnvironmentOrder: [
        {
          computeEnvironment: computeEnvironmentSpot.ref,
          order: 0
        }
      ],
      priority: 0
    });

    const batchEvent = new events.Rule(stack, "BatchEvent", {
      enabled: true,
      eventPattern: {
        source: ["aws.batch"]
      }
    });

    // S3
    // ==

    const bucketTemp = new s3.Bucket(stack, "BucketTemp", {
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(1)
        }
      ]
    });
    bucketTemp.grantReadWrite(batchInstanceRole);

    const bucketOutput = new s3.Bucket(stack, "BucketOutput", {});
    bucketOutput.grantReadWrite(batchInstanceRole);

    // DynamoDB
    // ========

    const jobTable = new dynamodb.Table(stack, "Job", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      }
    });

    // Lambda
    // ======

    // Create

    const createLambdaRole = new iam.Role(stack, "CreateJobRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });
    createLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    createLambdaRole.attachInlinePolicy(
      new iam.Policy(stack, "CreateJobPolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["batch:SubmitJob"],
            resources: jobDefinitions
              .map(jobDefinition => jobDefinition.jobDefinition.ref)
              .concat(queue.ref)
              .concat(queueSpot.ref)
          })
        ]
      })
    );
    jobTable.grantWriteData(createLambdaRole);

    const createLambda = new lambda.Function(stack, "CreateJobHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("dist"),
      handler: "create.handler",
      role: createLambdaRole
    });
    createLambda.addEnvironment("JOB_QUEUE", queueSpot.ref);
    jobDefinitions.forEach(jobDefinition => {
      jobDefinition.transtypes.forEach(transtype => {
        createLambda.addEnvironment(
          `JOB_DEFINITION_${transtype}`,
          jobDefinition.jobDefinition.ref
        );
      });
    });
    createLambda.addEnvironment("TABLE_NAME", jobTable.tableName);
    createLambda.addEnvironment("S3_TEMP_BUCKET", bucketTemp.bucketName);
    createLambda.addEnvironment("S3_OUTPUT_BUCKET", bucketOutput.bucketName);
    createLambda.addEnvironment(
      "TRANSTYPE_TO_TASK",
      JSON.stringify(conf.transtypes)
    );

    // Upload

    const uploadLambdaRole = new iam.Role(stack, "UploadJobRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });
    uploadLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    // uploadLambdaRole.attachInlinePolicy(
    //   new iam.Policy(stack, "UploadJobPolicy", {
    //     statements: [
    //       new iam.PolicyStatement({
    //         actions: ["batch:SubmitJob"],
    //         resources: jobDefinitions
    //           .map(jobDefinition => jobDefinition.jobDefinition.ref)
    //           .concat(queue.ref)
    //       })
    //     ]
    //   })
    // );
    // jobTable.grantWriteData(uploadLambdaRole);
    bucketTemp.grantPut(uploadLambdaRole);

    const uploadLambda = new lambda.Function(stack, "UploadJobHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("dist"),
      handler: "upload.handler",
      role: uploadLambdaRole
    });
    // uploadLambda.addEnvironment("JOB_QUEUE", queue.ref);
    // jobDefinitions.forEach(jobDefinition => {
    //   jobDefinition.transtypes.forEach(transtype => {
    //     uploadLambda.addEnvironment(
    //       `JOB_DEFINITION_${transtype}`,
    //       jobDefinition.jobDefinition.ref
    //     );
    //   });
    // });
    // uploadLambda.addEnvironment("TABLE_NAME", jobTable.tableName);
    uploadLambda.addEnvironment("S3_TEMP_BUCKET", bucketTemp.bucketName);
    // uploadLambda.addEnvironment("S3_OUTPUT_BUCKET", bucketOutput.bucketName);

    // Read

    const queryLambdaRole = new iam.Role(stack, "QueryJobRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });
    queryLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    jobTable.grantReadData(queryLambdaRole);

    const queryLambda = new lambda.Function(stack, "QueryJobHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("dist"),
      handler: "query.handler",
      role: queryLambdaRole
    });
    queryLambda.addEnvironment("TABLE_NAME", jobTable.tableName);

    // Event

    const eventLambdaRole = new iam.Role(stack, "EventJobRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });
    eventLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    jobTable.grantWriteData(eventLambdaRole);

    const eventLambda = new lambda.Function(stack, "EventJobHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("dist"),
      handler: "events.handler",
      role: eventLambdaRole
    });
    eventLambda.addEnvironment("TABLE_NAME", jobTable.tableName);
    batchEvent.addTarget(new targets.LambdaFunction(eventLambda));

    // API Gateway
    // ===========

    const rest = new apigw.LambdaRestApi(stack, "Endpoint", {
      handler: createLambda,
      proxy: false
    });

    const api = rest.root.addResource("api");
    const v1 = api.addResource("v1");
    const job = v1.addResource("job");
    job.addMethod("POST", new apigw.LambdaIntegration(createLambda));
    const query = job.addResource("{id}");
    query.addMethod("GET", new apigw.LambdaIntegration(queryLambda));
    const upload = v1.addResource("upload");
    upload.addMethod("GET", new apigw.LambdaIntegration(uploadLambda));
    // GET         /api/v1/jobs               controllers.v1.ListController.list(state: Option[string])
  }
}
