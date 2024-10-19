import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";

export async function handleSubscribe(context: HandlerContext) {
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
  } = context;
  await db.read();
  if (command == "unsubscribe") {
    const subscribers = db.data.subscribers;
    const subscriber = subscribers.find((s) => s.address === sender.address);
    if (subscriber) {
      subscriber.status = "unsubscribed";
    }
    await db.write();
    return {
      code: 200,
      message: "You have been unsubscribed from updates.",
    };
  } else if (command == "subscribe") {
    const subscribers = db?.data?.subscribers;
    if (!subscribers) {
      db.data.subscribers = [];
    }
    const subscriber = subscribers?.find((s) => s.address === sender.address);
    if (!subscriber) {
      db.data.subscribers.push({
        address: sender.address,
        status: "subscribed",
      });
      await db.write();

      return {
        code: 200,
        message: "📣 You have been subscribed to updates.",
      };
    }
    return {
      code: 400,
      message: "Error subscribing to updates.",
    };
  } else if (command == "exists") {
    const subscribers = db.data.subscribers;
    const subscriber = subscribers?.find((s) => s.address === params.address);
    if (subscriber) {
      return {
        code: 200,
        message: "Address was onboarded",
      };
    } else {
      return {
        code: 400,
        message: "Address was not onboarded",
      };
    }
  }
}
