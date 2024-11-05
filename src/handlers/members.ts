import "dotenv/config";
import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";
import fs from "fs";
import { clearMemory } from "../lib/gpt.js";
import { clearInfoCache } from "../lib/resolver.js";
import { isBot } from "../lib/bots.js";
const groupId = process.env.GROUP_ID as string;
export async function handleMembers(context: HandlerContext) {
  const {
    message: {
      content: { command, params },
      sender,
    },
    group,
    client,
  } = context;

  await db.read();

  if (command == "reset") {
    clearChatHistory();
    context.send("Resetting chat history");
    //remove from group
    const response = await context.skill("/remove");
    if (response && response.message) context.send(response.message);
    const response2 = await context.skill("/unsubscribe");
    if (response2 && response2.message) context.send(response2.message);

    const response3 = await context.skill(`/removepoap ${sender.address}`);
    if (response3 && response3.message) context.send(response3.message);

    return;
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
  } else if (group && command == "id") {
    console.log(group.id);
    return;
  } else if (command == "add") {
    const subscriberExists = db?.data?.subscribers?.find(
      (s) => s.address === sender.address
    );
    if (!subscriberExists) {
      const conversation = await client.conversations.getConversationById(
        groupId
      );
      if (conversation) await conversation.addMembers([sender.address]);

      return {
        code: 200,
        message: "You have been added to the group",
      };
    }
    return {
      code: 400,
      message: "You are already in the group",
    };
  } else if (command == "remove") {
    const subscriberExists = db?.data?.subscribers?.find(
      (s) => s.address === sender.address
    );
    if (subscriberExists) {
      const conversation = await client.conversations.getConversationById(
        groupId
      );

      //Remove from group
      const members = await conversation?.members();
      const member = members?.find((m) =>
        m.accountAddresses.includes(sender.address)
      );
      if (member)
        await conversation?.removeMembers([member.accountAddresses[0]]);

      db.data.subscribers = db?.data?.subscribers?.filter(
        (s) => s.address !== sender.address
      );
      await db.write();

      return {
        code: 200,
        message: "You have been removed to the group",
      };
    }
    return {
      code: 400,
      message: "Your removal request has been denied",
    };
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
    await db.read();
    const poapTable = db?.data?.poaps;
    const claimed = poapTable.filter((poap) => poap.address);
    const subscribers = db?.data?.subscribers;
    const onboarded = subscribers.filter((subscriber) => subscriber.address);
    const subscribed = onboarded.filter(
      (subscriber) => subscriber.status === "subscribed"
    );
    context.send(
      `This is how frENSday is going:\n ${claimed.length} POAPs claimed out of ${poapTable.length}\n ${onboarded.length} users onboarded\n ${subscribed.length} users subscribed`
    );
  } else if (command == "send") {
    const { message } = params;
    let allowedAddresses = [
      "0xa6d9b3de32c76950d47f9867e2a7089f78c2ce8b".toLowerCase(),
      "0x277c0dd35520db4aaddb45d4690ab79353d3368b".toLowerCase(),
      "0x6a03c07f9cb413ce77f398b00c2053bd794eca1a".toLowerCase(),
    ];
    if (allowedAddresses.includes(sender.address.toLowerCase())) {
      let allSubscribers = await getSubscribers();
      if (allSubscribers.length > 0) {
        console.log(allSubscribers.length, allSubscribers);
        await context.send(
          `Sending message to ${allSubscribers.length} subscribers...`
        );
        await context.sendTo(
          message,
          allSubscribers.map((s) => s.address)
        );
        return {
          code: 200,
          message: "Message sent to subscribers",
        };
      } else {
        return {
          code: 400,
          message: "No subscribers found",
        };
      }
    }
    let msg = "You are not allowed to send messages";
    context.send(msg);
    return {
      code: 400,
      message: msg,
    };
  }
}

export async function clearChatHistory(address?: string) {
  clearMemory();
  clearInfoCache();
}

export async function getSubscribers() {
  try {
    let allSubscribers: { address: string; status: string }[] = [];
    await db.read();
    const subscribers = db?.data?.subscribers;
    const extraSubscribers = fs
      .readFileSync("src/data/subscribers.txt", "utf8")
      .split("\n");
    const extraSubscribersJson = extraSubscribers.map((address) => ({
      address: address.toLowerCase(),
      status: "subscribed",
    })) as { address: string; status: string }[];
    allSubscribers = subscribers as any as {
      address: string;
      status: string;
    }[];
    allSubscribers = allSubscribers.concat(extraSubscribersJson);
    //filter bots
    allSubscribers = allSubscribers.filter(
      (subscriber) =>
        !isBot(subscriber.address.toLowerCase(), true) &&
        !isBot(subscriber.address.toLowerCase(), false)
    );
    //filter duplicates
    allSubscribers = allSubscribers.filter(
      (subscriber, index, self) =>
        index ===
        self.findIndex(
          (t) => t.address.toLowerCase() === subscriber.address.toLowerCase()
        )
    );
    return allSubscribers;
  } catch (error) {
    console.log(error);
    return [];
  }
}
