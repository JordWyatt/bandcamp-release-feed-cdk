import { DynamoDB } from "aws-sdk";
import * as cheerio from "cheerio";
import axios from "axios";
import {
  Context,
  SNSEvent,
} from "aws-lambda";

exports.handler = async (event: SNSEvent, context: Context) => {
  if (!process.env.RELEASE_TABLE_NAME) {
    throw Error("RELEASE_TABLE_NAME undefined");
  }

  const ddb = new DynamoDB();
  const message = JSON.parse(event.Records[0].Sns.Message);

  const {
    source,
    content,
    mail: {
      commonHeaders: { subject },
    },
  } = message;

  if (!subject.includes("New release from")) {
    console.error("Message subject invalid");
    return;
  }

  // TODO: Implement
  const userId = await getUserId()

  const url = getBandcampUrl(content);
  const releaseDetails = await getReleaseDetails(url);

  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: process.env.RELEASE_TABLE_NAME,
    Item: {
      url: { S: url },
      artist: { S: releaseDetails.artist },
      image: { S: releaseDetails.image },
      label: { S: releaseDetails.label },
      releaseDate: { S: releaseDetails.releaseDate },
      title: { S: releaseDetails.title },
      type: { S: releaseDetails.type },
      streamURL: { S: releaseDetails.streamURL },
      createdAt: { N: Date.now().toString() },
      userId: { N: userId.toString() }
    },
    ReturnConsumedCapacity: "TOTAL",
  };

  await ddb.putItem(params).promise();
};

const getBandcampUrl = (emailContent: string) => {
  console.log("Getting bandcamp URL...");
  const re = /https:\/\/.*\.com\/(track|album)\/[^?]*/;
  const matches = emailContent.match(re);
  if (!matches || !matches.length) {
    throw Error("No bandcamp URLs found");
  }
  return matches[0].replace(/=?(\r?\n|\r)/g, "");
};

// TODO: Refactor
const getReleaseDetails = async (bandcampUrl: string) => {
  console.log("Getting release details...");
  const { data: response } = await axios.get(bandcampUrl);
  const $ = cheerio.load(response);
  const bandcampJsonNode = $(
    "script[type='application/ld+json']"
  )[0] as cheerio.TagElement;
  const releaseJson = JSON.parse(bandcampJsonNode.children[0].data as string);
  const splitUrl = bandcampUrl.split("/");

  const releaseDetails = {
    url: bandcampUrl,
    artist: releaseJson.byArtist.name,
    image: releaseJson.image,
    label: releaseJson.publisher.name,
    releaseDate: releaseJson.datePublished,
    title: releaseJson.name,
    type: splitUrl[splitUrl.length - 2],
    streamURL: "foobar"
  };

  return releaseDetails;
};

// TODO: Implent
const getUserId = async () => {
  return 1234
}