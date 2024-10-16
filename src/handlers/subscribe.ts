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
  if (command == "stop") {
    inMemoryCacheStep.set(sender.address, 0);
    await redisClient.del(sender.address);
    await subscribeToNotion(sender.address, false);

    return {
      code: 200,
      message: "You have been unsubscribed from updates.",
    };
  } else if (command == "subscribe") {
    inMemoryCacheStep.set(sender.address, 0);
    await redisClient.set(sender.address, "subscribed");
    await subscribeToNotion(sender.address, true);
    return {
      code: 200,
      message: "You have been subscribed to updates.",
    };
  }
}
