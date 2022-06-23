import * as cdk from "@aws-cdk/core";
import * as ses from "@aws-cdk/aws-ses";
import * as actions from "@aws-cdk/aws-ses-actions";
import * as sns from "@aws-cdk/aws-sns";
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import * as apiGateway from "@aws-cdk/aws-apigateway";
import * as subscriptions from "@aws-cdk/aws-sns-subscriptions";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

export class BandcampFeedInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const topic = new sns.Topic(this, "EmailTopic");
    const table = new ddb.Table(this, "Releases", {
      partitionKey: { name: "userId", type: ddb.AttributeType.NUMBER },
      sortKey: { name: "createdAt", type: ddb.AttributeType.NUMBER },
    });

    const emailTopicMessageHandler = new lambda.NodejsFunction(
      this,
      "ProcessEmailTopicMessage",
      {
        entry: path.resolve("src/lambda/processEmailTopicMessage.ts"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          RELEASE_TABLE_NAME: table.tableName,
        },
      }
    );

    const getReleasesHandler = new lambda.NodejsFunction(
      this,
      "GetReleasesHandler",
      {
        entry: path.resolve("src/lambda/getReleases.ts"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          RELEASE_TABLE_NAME: table.tableName,
        },
      }
    );

    topic.addSubscription(
      new subscriptions.LambdaSubscription(emailTopicMessageHandler)
    );
    table.grantReadWriteData(emailTopicMessageHandler);
    table.grantReadWriteData(getReleasesHandler);

    new ses.ReceiptRuleSet(this, "RuleSet", {
      rules: [
        {
          recipients: ["bandcampfeed.com"],
          actions: [
            new actions.Sns({
              topic,
            }),
          ],
        },
      ],
    });

    new apiGateway.LambdaRestApi(this, "ReleaseApi", {
      handler: getReleasesHandler,
    });

    const bucket = new s3.Bucket(this, "HostingBucket", {
      bucketName: process.env.HOSTING_BUCKET_NAME,
      websiteIndexDocument: "index.html", // 1
      blockPublicAccess: new s3.BlockPublicAccess({
        restrictPublicBuckets: false,
      }), // 2
    });

    const bucketPolicy = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      resources: [`${bucket.bucketArn}/*`],
      principals: [new iam.AnyPrincipal()],
    });

    bucket.addToResourcePolicy(bucketPolicy);
  }
}
