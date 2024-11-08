import "dotenv/config";
import { HandlerContext } from "@xmtp/message-kit";
import { Client } from "@xmtp/node-sdk";
import { db } from "../lib/db.js";
import { Client as V2Client } from "@xmtp/xmtp-js";
import fs from "fs";
import { isOnXMTP } from "../lib/resolver.js";
import { clearMemory } from "../lib/gpt.js";
import { clearInfoCache } from "../lib/resolver.js";
import { isAnyBot } from "../lib/bots.js";
import { xmtpClient } from "@xmtp/message-kit";

const { client: fabriTest } = await xmtpClient({
  privateKey: process.env.KEY_FABRI_TEST,
});
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
    members,
    client,
    v2client,
  } = context;

  await db.read();

  if (command == "reset") {
    const response = await clearChatHistory();
    if (response?.message) context.send(response.message);
    const response2 = await context.executeSkill("/remove");
    if (response2?.message) context.send(response2.message);
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
  } else if (group && command == "id") {
    console.log(group.id);
    return {
      code: 200,
      message: group.id,
    };
  } else if (command == "add") {
    const subscriberExists = db?.data?.subscribers?.find(
      (s) => s.address === sender.address
    );
    if (!subscriberExists) sender.address.toLowerCase();

    return await addToGroup(groupId, client, v2client, sender.address);
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
  } else if (command == "readd") {
    console.log("readd");
    const address = "0xF8cd371Ae43e1A6a9bafBB4FD48707607D24aE43";
    console.log("fabriTest", fabriTest.accountAddress);
    await fabriTest.conversations.sync();
    for (const conversation of await fabriTest.conversations.list()) {
      console.log(conversation.id);
    }
    const conversation = await fabriTest.conversations.getConversationById(
      groupId.toLowerCase()
    );
    console.log("conversation", conversation?.id);
    if (conversation) {
      console.log("adding");
      await conversation?.sync();
      console.log("synced");
      await conversation?.removeMembers([address.toLowerCase()]);
      console.log("removed");
      await conversation?.sync();
      console.log("synced");
      await conversation?.addMembers([address.toLowerCase()]);
      console.log("added");
      await conversation?.sync();
      console.log("synced");
      const members = await conversation?.members();
      if (members) {
        for (const member of members) {
          if (member.accountAddresses[0] === address) {
            console.log("added");
          }
        }
      }
    }
    context.send("done");
  } else {
    return {
      code: 400,
      message: "Invalid command",
    };
  }
}

async function addToGroup(
  groupId: string,
  client: Client,
  v2client: V2Client,
  senderAddress: string
): Promise<{ code: number; message: string }> {
  try {
    let lowerAddress = senderAddress.toLowerCase();
    const { v2, v3 } = await isOnXMTP(client, v2client, lowerAddress);
    console.log("ADD TO GROUP: v2", v2);
    console.log("ADD TO GROUP: v3", v3);
    if (!v3)
      return {
        code: 400,
        message: "You dont seem to have a v3 identity ",
      };
    const conversation = await client.conversations.getConversationById(
      groupId
    );
    console.log("ADD TO GROUP: conversation", conversation);
    await conversation?.sync();
    //DONT TOUCH THIS LINE
    await conversation?.addMembers([lowerAddress]);
    console.log("ADD TO GROUP: conversation synced");
    await conversation?.sync();
    const members = await conversation?.members();
    console.log("ADD TO GROUP: members", members);

    if (members) {
      for (const member of members) {
        let lowerMemberAddress = member.accountAddresses[0].toLowerCase();
        console.log("ADD TO GROUP: member", lowerMemberAddress);
        if (lowerMemberAddress === lowerAddress) {
          return {
            code: 200,
            message: "You have been added to the group",
          };
        }
      }
    }
    return {
      code: 400,
      message: "Failed to add to group",
    };
  } catch (error) {
    return {
      code: 400,
      message: "Failed to add to group",
    };
  }
}

export async function sendBroadcast(
  message: string,
  context: HandlerContext,
  sender: string
) {
  if (!getAllowedAddresses().includes(sender.toLowerCase())) {
    return {
      code: 400,
      message: "You are not allowed to send messages",
    };
  }
  let allSubscribers = await getSubscribers(context);
  if (allSubscribers.length > 0) {
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

export async function clearChatHistory(address?: string) {
  clearMemory();
  clearInfoCache();
  return {
    code: 200,
    message: "Chat history cleared",
  };
}
export function getAllowedAddresses() {
  return [
    "0xa6d9b3de32c76950d47f9867e2a7089f78c2ce8b".toLowerCase(),
    "0x277c0dd35520db4aaddb45d4690ab79353d3368b".toLowerCase(),
    "0x6a03c07f9cb413ce77f398b00c2053bd794eca1a".toLowerCase(),
  ];
}
export async function getSubscribers(context?: HandlerContext) {
  try {
    await db.read();
    let subscribers = db?.data?.subscribers;
    const extraSubscribers = fs
      .readFileSync("src/data/subscribers.txt", "utf8")
      .split("\n");
    const extraSubscribersJson = extraSubscribers.map((address) => ({
      address: address.toLowerCase(),
      status: "subscribed",
    }));
    let allSubscribers = subscribers.concat(extraSubscribersJson);
    if (process.env.ALL_SUBS == "true") {
      await context?.send(
        `Sending message to ALL ${allSubscribers.length} subscribers...`
      );
    } else {
      await context?.send(
        `Sending message to ${extraSubscribersJson.length} subscribers for testing, in total there are ${allSubscribers.length} subscribers`
      );
      allSubscribers = extraSubscribersJson;
    }
    //filter bots
    console.log("Filtering bots", allSubscribers.length);
    allSubscribers = allSubscribers.filter(
      (subscriber) => !isAnyBot(subscriber.address.toLowerCase())
    );
    console.log("Filtered bots", allSubscribers.length);
    //filter duplicates
    console.log("Filtering duplicates", allSubscribers.length);
    allSubscribers = allSubscribers.filter(
      (subscriber, index, self) =>
        index ===
        self.findIndex(
          (t) => t.address.toLowerCase() === subscriber.address.toLowerCase()
        )
    );
    console.log("Filtered duplicates", allSubscribers.length);
    return allSubscribers;
  } catch (error) {
    console.log(error);
    return [];
  }
}
