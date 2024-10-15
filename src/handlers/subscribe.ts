import { HandlerContext } from "@xmtp/message-kit";
import { RedisClientType } from "@redis/client";
import { getRedisClient } from "../lib/redis.js";
import { subscribeToNotion } from "../lib/notion.js";
//Tracks conversation steps
const inMemoryCacheStep = new Map<string, number>();
const redisClient: RedisClientType = await getRedisClient();

export async function handleSubscribe(context: HandlerContext) {
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
  } = context;
  console.log("command", command);
  if (command == "stop") {
    inMemoryCacheStep.set(sender.address, 0);
    await redisClient.del(sender.address);
    context.send("You have been unsubscribed from updates.");

    subscribeToNotion(sender.address, false);
    return;
  } else if (command == "subscribe") {
    await redisClient.set(sender.address, "subscribed");
    subscribeToNotion(sender.address, true);
    inMemoryCacheStep.set(sender.address, 0);
    context.send("You have been subscribed to updates.");
  }
}
