import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";

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
        process.env.GROUP_ID as string
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
  }
}
