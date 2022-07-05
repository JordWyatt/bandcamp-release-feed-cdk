import { DynamoDB } from "aws-sdk";
import { Context, APIGatewayEvent } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

exports.handler = async (event: APIGatewayEvent, context: Context) => {
  // TODO: Implement user sessions / auth
  const userId = 1234;

  if (!process.env.RELEASE_TABLE_NAME) {
    throw Error("RELEASE_TABLE_NAME undefined");
  }

  const documentClient = new DynamoDB.DocumentClient();
  const method = event.httpMethod;
  let responseCode = 200;
  let responseBody = {};

  if (method === "POST") {
    const params: DocumentClient.QueryInput = {
      TableName: process.env.RELEASE_TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false,
      Limit: 20,
    };

    const body = event.body ? JSON.parse(event.body) : {};

    if (body.startKey) {
      params.ExclusiveStartKey = {
        userId: body.startKey.userId,
        createdAt: body.startKey.createdAt,
      };
    }

    const results = await documentClient.query(params).promise();

    responseBody = {
      items: results.Items || [],
      lastEvaluatedKey: results.LastEvaluatedKey,
    };
  } else {
    responseCode = 405;
    responseBody = { error: `Method ${method} not allowed` };
  }

  let response = {
    statusCode: responseCode,
    body: JSON.stringify(responseBody),
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET",
    },
  };

  return response;
};
