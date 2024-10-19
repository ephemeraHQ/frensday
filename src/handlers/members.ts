import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";

const GROUP_ID = "59cc12e7db37917243d7e64b360f4405";
export async function handleMembers(context: HandlerContext) {
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
    group,
    client,
  } = context;

  if (group && command == "id") {
    console.log(group.id);
    return;
  } else if (command == "add") {
    await db.read();
    const subscriberExists = db.data.subscribers.find(
      (s) => s.address === sender.address
    );
    if (!subscriberExists) {
      const conversation = await client.conversations.getConversationById(
        GROUP_ID
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
    await db.read();
    const subscriberExists = db.data.subscribers.find(
      (s) => s.address === sender.address
    );
    if (subscriberExists) {
      const conversation = await client.conversations.getConversationById(
        GROUP_ID
      );

      //Remove from group
      const members = await conversation?.members();
      const member = members?.find((m) =>
        m.accountAddresses.includes(sender.address)
      );
      if (member)
        await conversation?.removeMembers([member.accountAddresses[0]]);

      db.data.subscribers = db.data.subscribers.filter(
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
