import "dotenv/config";
import { V3Client, V2Client } from "@xmtp/message-kit";
import { HandlerContext } from "@xmtp/message-kit";
import { clearMemory } from "@xmtp/message-kit";
import { clearInfoCache, isOnXMTP } from "@xmtp/message-kit";
import { isAnyBot } from "./bots.js";
import { getRecords } from "./lowdb.js";
import { getBotAddress } from "./bots.js";

export async function removeFromGroup(
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
    console.warn("removing from group", conversation?.id);
    await conversation?.sync();
    await conversation?.removeMembers([lowerAddress]);
    console.warn("Removed member from group");
    await conversation?.sync();
    const members = await conversation?.members();
    console.warn("Number of members", members?.length);

    let wasRemoved = true;
    if (members) {
      for (const member of members) {
        let lowerMemberAddress = member.accountAddresses[0].toLowerCase();
        if (lowerMemberAddress !== lowerAddress) {
          wasRemoved = false;
        }
      }
    }
    return {
      code: wasRemoved ? 200 : 400,
      message: wasRemoved
        ? "You have been removed from the group"
        : "Failed to remove from group",
    };
  } catch (error) {
    console.log("Error removing from group", error);
    return {
      code: 400,
      message: "Failed to remove from group",
    };
  }
}
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
    console.warn("Added member to group");
    await conversation?.sync();
    const members = await conversation?.members();
    console.warn("Number of members", members?.length);

    if (members) {
      for (const member of members) {
        let lowerMemberAddress = member.accountAddresses[0].toLowerCase();
        if (lowerMemberAddress === lowerAddress) {
          console.warn("Member exists", lowerMemberAddress);
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
    let allSubscribers = await getRecords("subscribers");

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

export async function onboard(
  context: HandlerContext,
  name: string,
  senderAddress: string
) {
  try {
    context?.send(
      "Hey there! Give me a sec while I fetch info about you first..."
    );
    const groupId = process.env.GROUP_ID;
    console.warn("ONBOARD Started");
    const addedToGroup = await context.executeSkill("/add");
    // Sleep for 30 seconds
    console.warn("ONBOARD: Added to group", groupId);
    if (addedToGroup?.code == 200) {
      //onboard message
      const subscribed = await context.executeSkill(
        `/subscribe ${senderAddress}`
      );
      //if (subscribed?.message) context.send(subscribed.message);
      console.warn("ONBOARD: Subscribed to updates", senderAddress);
      await context.send(
        `Welcome ${name}! I'm Earl, and I'm here to assist you with everything frENSday!\n\nJoin us in our event group chat: https://converse.xyz/group/${groupId}\n\nIf you need any information about the event or our speakers, just ask me. I'm always happy to help!`
      );
      await context.executeSkill(`/sendbittu ${senderAddress}`);
      console.warn("ONBOARD: Bittu message sent");
      setTimeout(() => {
        context.send(
          `psst... by the way, check with Bittu https://converse.xyz/dm/${getBotAddress(
            "bittu"
          )} for a exclusive POAP 😉`
        );
      }, 30000); // 30000 milliseconds = 30 seconds
      return true;
    } else {
      console.warn(addedToGroup?.message ?? "Failed to add to group");
      context.send(addedToGroup?.message ?? "Failed to add to group");
      return false;
    }
  } catch (error) {
    console.log("Error adding to group", error);
    return false;
  }
}
