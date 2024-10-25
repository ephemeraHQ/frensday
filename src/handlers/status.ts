import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";

export async function handleStatus(context: HandlerContext) {
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
  } = context;

  if (command == "status") {
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
  }
}
