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
      if (conversation) conversation.addMembers([sender.address]);

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
      if (conversation) conversation.removeMembers([sender.address]);

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
  }
}
