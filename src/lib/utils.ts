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
export async function sendBroadcast(message: string, context: HandlerContext) {
  let allSubscribers = await getSubscribers(context);
  console.log("Sending to", allSubscribers.length, "users");
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

export async function getSubscribers(context?: HandlerContext) {
  try {
    await db.read();
    let allSubscribers = db?.data?.subscribers;

    if (process.env.ALL_SUBS == "true") {
      await context?.send(
        `Sending message to ALL ${allSubscribers.length} subscribers...`
      );
    } else {
      await context?.send(
        `Sending message to ${allSubscribers.length} subscribers for testing, in total there are ${allSubscribers.length} subscribers`
      );
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
