import { HandlerContext } from "@xmtp/message-kit";
import { RedisClientType } from "@redis/client";
import { getRedisClient } from "../lib/redis.js";

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
    return;
  } else if (command == "subscribe") {
    await redisClient.set(sender.address, "subscribed");
    inMemoryCacheStep.set(sender.address, 0);
  }
}
