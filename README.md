# AWS based DITA-OT

The _AWS based DITA-OT_ is a set of configurations to deploy DITA-OT and other conversion tools to be ran using AWS products.

## Prerequisites

To build and deploy, the following tools and accounts are required:

- [AWS CLI][aws cli]
- [Node.js][nodejs]
- [AWS Account][aws account] and [IAM User][iam] with _Programmatic access_ type and `AdministratorAccess` policy. See [AWS documentation][iam user] for creating an IAM user.

## Building

```bash
npm install
```

## Deployment

The first time you deploy an AWS CDK app for an AWS user, you’ll need to [bootstrap CDK][bootstrap]:

```bash
npm run bootstrap
```

Deploy AWS based DITA-OT:

```bash
npm run deploy
```

## Donating

Support this project and others by [@jelovirt](https://github.com/jelovirt) via [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=jarno%40elovirta%2ecom&lc=FI&item_name=Support%20Open%20Source%20work&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted).

## License

AWS Batch based DITA-OT is licensed for use under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).

[aws account]: https://aws.amazon.com/account/
[aws cli]: https://aws.amazon.com/cli/
[nodejs]: https://nodejs.org/en/
[iam]: https://aws.amazon.com/iam/
[iam user]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html
[bootstrap]: https://docs.aws.amazon.com/cdk/latest/guide/tools.html#tools_bootstrap
