import "dotenv/config";
import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";
import { clearChatHistory, getAllowedAddresses } from "../lib/utils.js";
import { addToGroup, sendBroadcast } from "../lib/utils.js";

import { SkillResponse } from "@xmtp/message-kit";

const groupId = process.env.GROUP_ID as string;
export async function handleMembers(
  context: HandlerContext
): Promise<SkillResponse | undefined> {
  const {
    message: {
      content: { command, params },
      sender,
    },
    group,
    client,
    members,
    v2client,
  } = context;

  await db.read();

  if (command == "reset") {
    const response = await clearChatHistory();
    if (response?.message) context.send(response.message);
    const response3 = await context.executeSkill("/unsubscribe");
    if (response3?.message) context.send(response3.message);
    const response4 = await context.executeSkill(
      `/removepoap ${sender.address}`
    );
    if (response4?.message) context.send(response4.message);

    return {
      code: 200,
      message: "Chat history and group removed",
    };
  } else if (command == "unsubscribe") {
    const subscribers = db?.data?.subscribers;
    const subscriber = subscribers?.find((s) => s.address === sender.address);
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
      db?.data?.subscribers?.push({
        address: sender.address,
        status: "subscribed",
      });
      await db.write();

      return {
        code: 200,
        message: "📣 You have been subscribed to updates.",
      };
    } else if (subscriber.status === "subscribed") {
      return {
        code: 400,
        message: "You are already subscribed to updates.",
      };
    }
    return {
      code: 400,
      message: "Error subscribing to updates.",
    };
  } else if (command == "add") {
    const subscriberExists = db?.data?.subscribers?.find(
      (s) => s.address === sender.address
    );
    if (!subscriberExists) sender.address.toLowerCase();

    return await addToGroup(groupId, client, v2client, sender.address);
  } else if (command == "exists") {
    const subscribers = db?.data?.subscribers;
    const subscriber = subscribers?.find((s) => s.address === sender.address);
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
  } else if (command == "status") {
    if (!getAllowedAddresses().includes(sender.address.toLowerCase())) {
      return {
        code: 400,
        message: "You are not allowed to send messages",
      };
    }
    const poapTable = db?.data?.poaps;
    const claimed = poapTable.filter((poap) => poap.address);
    const subscribers = db?.data?.subscribers;
    const onboarded = subscribers.filter((subscriber) => subscriber.address);
    const subscribed = onboarded.filter(
      (subscriber) => subscriber.status === "subscribed"
    );
    let message = `This is how frENSday is going:\n ${claimed.length} POAPs claimed out of ${poapTable.length}\n ${onboarded.length} users onboarded\n ${subscribed.length} users subscribed`;

    return {
      code: 200,
      message,
    };
  } else if (command == "send") {
    const { message } = params;
    return await sendBroadcast(message, context, sender.address);
  } else {
    return {
      code: 400,
      message: "Invalid command",
    };
  }
}
