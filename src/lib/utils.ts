import "dotenv/config";
import { xmtpClient } from "@xmtp/message-kit";
import { V3Client, V2Client } from "@xmtp/message-kit";
import { HandlerContext } from "@xmtp/message-kit";
import { clearMemory } from "@xmtp/message-kit";
import { clearInfoCache, isOnXMTP } from "@xmtp/message-kit";
import { isAnyBot } from "./bots.js";
import { db } from "./db.js";
import fs from "fs";

const { client: fabriTest } = await xmtpClient({
  privateKey: process.env.KEY_FABRI_TEST,
});

export async function addToGroup(
  groupId: string,
  client: V3Client,
  v2client: V2Client,
  senderAddress: string
): Promise<{ code: number; message: string }> {
  try {
    let lowerAddress = senderAddress.toLowerCase();
    const { v2, v3 } = await isOnXMTP(client, v2client, lowerAddress);
    console.warn("Checking if on XMTP: v2", v2, "v3", v3);
    if (!v3)
      return {
        code: 400,
        message: "You dont seem to have a v3 identity ",
      };
    const conversation = await client.conversations.getConversationById(
      groupId
    );
    console.warn("Adding to group", conversation?.id);
    await conversation?.sync();
    //DONT TOUCH THIS LINE
    await conversation?.addMembers([lowerAddress]);
    console.warn("Members synced");
    await conversation?.sync();
    const members = await conversation?.members();
    console.warn("Members", members?.length);

    if (members) {
      for (const member of members) {
        let lowerMemberAddress = member.accountAddresses[0].toLowerCase();
        if (lowerMemberAddress === lowerAddress) {
          console.warn("Member", lowerMemberAddress);
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
export async function reAddUsers(
  addresses: string[],
  groupId: string
): Promise<void> {
  const conversation = await fabriTest.conversations.getConversationById(
    groupId.toLowerCase()
  );
  for (const address of addresses) {
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
  clearMemory(address); //clear memory
  clearInfoCache(address); //clear info cache
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
