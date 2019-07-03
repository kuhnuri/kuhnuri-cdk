import fs = require("fs");
import cdk = require("@aws-cdk/core");
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import apigw = require("@aws-cdk/aws-apigateway");
import batch = require("@aws-cdk/aws-batch");
import ec2 = require("@aws-cdk/aws-ec2");
import s3 = require("@aws-cdk/aws-s3");
import ecr = require("@aws-cdk/aws-ecr");
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { DockerImageAsset } from "@aws-cdk/aws-ecr-assets";
import conf from "../config";

export class KuhnuriStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stack = this;

    const vpc = new ec2.Vpc(stack, "NewVPC", {
      cidr: "10.0.0.0/16",
      natGateways: 1

    // Lambda
    // ======

    const createJobRole = new iam.Role(stack, "CreateJobRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    const createJob = new lambda.Function(stack, "CreateJobHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("lambda"),
      handler: "hello.handler",
      role: createJobRole
    });

    new apigw.LambdaRestApi(stack, "Endpoint", {
      handler: createJob
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
        asset = new DockerImageAsset(this, `DitaOtImage_${i}`, {
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

    const securityGroup = new ec2.SecurityGroup(stack, "BatchSecurityGroup", {
      vpc
    });

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

    const computeEnvironment = new batch.CfnComputeEnvironment(
      this,
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

    const jobDefinitions = workers.map((worker, i) => {
      const image = worker.asset ? worker.asset.imageUri : conf.baseImage;
      const jobDefinition = new batch.CfnJobDefinition(
        stack,
        `DitaOtJobDefinition_${i}`,
        {
        type: "container",
        // jobDefinitionName: "DitaOtJobDefinition",
        parameters: {
          // "transtype": ""
        },
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
      return jobDefinition;
      });
    createJobRole.attachInlinePolicy(
      new iam.Policy(stack, "CreateJobPolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["batch:SubmitJob"],
            resources: jobDefinitions.map(jobDefinition => jobDefinition.ref)
          })
        ]
      })
    );

    const queue = new batch.CfnJobQueue(stack, "DitaOtJobQueue", {
      computeEnvironmentOrder: [
        {
          computeEnvironment: computeEnvironment.ref,
          order: 0
        }
      ],
      priority: 0
    });

    const bucketTemp = new s3.Bucket(stack, "bucketTemp", {});
    bucketTemp.grantReadWrite(batchInstanceRole);
  }
}
