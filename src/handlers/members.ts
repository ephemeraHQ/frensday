import "dotenv/config";
import { HandlerContext } from "@xmtp/message-kit";
import { clearChatHistory } from "../lib/utils.js";
import { addToGroup, removeFromGroup, sendBroadcast } from "../lib/utils.js";
import {
  updateRecordById,
  getRecordByField,
  getRecords,
} from "../lib/lowdb.js";

import { SkillResponse } from "@xmtp/message-kit";

const groupId = process.env.GROUP_ID as string;
export async function handleMembers(
  context: HandlerContext
): Promise<SkillResponse | undefined> {
  const {
    message: {
      content: { skill, params },
      sender,
    },
    client,
    group,
    v2client,
  } = context;

  let isAdmin = (await group?.isAdmin(sender.address)) && group?.id === groupId;

  if (skill == "reset") {
    const response3 = await context.executeSkill("/unsubscribe");
    if (response3?.message) context.send(response3.message);
    const response4 = await context.executeSkill(
      `/removepoap ${sender.address}`
    );
    if (response4?.message) await context.send(response4.message);
    const response6 = await removeFromGroup(
      groupId,
      client,
      v2client,
      sender.address
    );
    if (response6?.message) context.send(response6.message);
    const response = await clearChatHistory(sender.address);
    if (response?.message) context.send(response.message);
  } else if (skill == "unsubscribe") {
    const subscriber = await getRecordByField(
      "subscribers",
      "address",
      sender.address
    );
    if (subscriber) {
      await updateRecordById("subscribers", subscriber.id, {
        status: "unsubscribed",
      });
    }
    return {
      code: 200,
      message: "You have been unsubscribed from updates.",
    };
  } else if (skill == "subscribe") {
    const subscriber = await getRecordByField(
      "subscribers",
      "address",
      sender.address
    );
    if (subscriber) {
      await updateRecordById("subscribers", subscriber?.id, {
        status: "subscribed",
      });

      return {
        code: 200,
        message: "You have been subscribed to updates.",
      };
    } else {
      return {
        code: 400,
        message: "You are already subscribed to updates.",
      };
    }
  } else if (skill == "add") {
    const subscriberExists = await getRecordByField(
      "subscribers",
      "address",
      sender.address
    );
    if (!subscriberExists) sender.address.toLowerCase();

    return await addToGroup(groupId, client, v2client, sender.address);
  } else if (skill == "exists") {
    const subscriber = await getRecordByField(
      "subscribers",
      "address",
      sender.address
    );
    console.log("Subscriber", subscriber);
    if (subscriber?.status === "subscribed") {
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
  } else if (skill == "status") {
    if (!isAdmin) {
      return {
        code: 400,
        message: "You are not allowed to send messages",
      };
    }
    const poapTable = await getRecords("poaps");
    const claimed = poapTable.filter((poap) => poap.address);
    const subscribers = await getRecords("subscribers");
    const onboarded = subscribers.filter((subscriber) => subscriber.address);
    const subscribed = onboarded.filter(
      (subscriber) => subscriber.status === "subscribed"
    );
    let message = `This is how frENSday is going:\n ${claimed.length} POAPs claimed out of ${poapTable.length}\n ${onboarded.length} users onboarded\n ${subscribed.length} users subscribed`;

    return {
      code: 200,
      message,
    };
  } else if (skill == "send") {
    if (!isAdmin) {
      return {
        code: 400,
        message: "You are not allowed to send messages",
      };
    }
    const { message } = params;
    console.log("Message", message);
    if (message.length < 100) {
      console.log("Message is too short", message.length);
      return {
        code: 400,
        message: "Message must be longer than 100 characters",
      };
    }
    return await sendBroadcast(message, context);
  } else {
    return {
      code: 400,
      message: "Invalid command",
    };
  }
}
