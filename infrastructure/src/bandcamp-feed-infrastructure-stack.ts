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
import { IFunction } from "@aws-cdk/aws-lambda";
import { RedirectProtocol } from "@aws-cdk/aws-s3";

export class BandcampFeedInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = this.setupSnsTopic();
    const releaseTable = this.setupReleaseTable();
    const emailTopicMessageHandler =
      this.setupEmailTopicMessageLambda(releaseTable);
    const getReleasesHandler = this.setupGetReleasesLambda(releaseTable);

    this.setupSesReceiptRuleSet(topic);
    this.setupApiGateway(getReleasesHandler);
    this.setupS3Buckets();

    topic.addSubscription(
      new subscriptions.LambdaSubscription(emailTopicMessageHandler)
    );
    releaseTable.grantReadWriteData(emailTopicMessageHandler);
    releaseTable.grantReadWriteData(getReleasesHandler);
  }

  setupSnsTopic() {
    return new sns.Topic(this, "EmailTopic");
  }

  setupEmailTopicMessageLambda(releaseTable: ddb.Table) {
    const emailTopicMessageHandler = new lambda.NodejsFunction(
      this,
      "ProcessEmailTopicMessage",
      {
        entry: path.resolve("src/lambda/processEmailTopicMessage.ts"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          RELEASE_TABLE_NAME: releaseTable.tableName,
        },
      }
    );

    return emailTopicMessageHandler;
  }

  setupReleaseTable() {
    const table = new ddb.Table(this, "Releases", {
      partitionKey: { name: "userId", type: ddb.AttributeType.NUMBER },
      sortKey: { name: "createdAt", type: ddb.AttributeType.NUMBER },
    });

    return table;
  }

  setupGetReleasesLambda(releaseTable: ddb.Table) {
    const getReleasesHandler = new lambda.NodejsFunction(
      this,
      "GetReleasesHandler",
      {
        entry: path.resolve("src/lambda/getReleases.ts"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          RELEASE_TABLE_NAME: releaseTable.tableName,
        },
      }
    );

    return getReleasesHandler;
  }

  setupSesReceiptRuleSet(topic: sns.Topic) {
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
  }

  setupApiGateway(handler: IFunction) {
    return new apiGateway.LambdaRestApi(this, "ReleaseApi", {
      handler,
    });
  }

  setupS3Buckets() {
    const hostingBucket = new s3.Bucket(this, "HostingBucket", {
      bucketName: process.env.HOSTING_BUCKET_NAME,
      websiteIndexDocument: "index.html",
      blockPublicAccess: new s3.BlockPublicAccess({
        restrictPublicBuckets: false,
      }),
    });

    const bucketPolicy = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      resources: [`${hostingBucket.bucketArn}/*`],
      principals: [new iam.AnyPrincipal()],
    });

    hostingBucket.addToResourcePolicy(bucketPolicy);

    if (process.env.REDIRECT_BUCKET_NAME) {
      new s3.Bucket(this, "RedirectBucket", {
        bucketName: process.env.REDIRECT_BUCKET_NAME,
        websiteRedirect: {
          hostName: process.env.HOSTING_BUCKET_NAME as string,
          protocol: RedirectProtocol.HTTP,
        },
      });
    }
  }
}
