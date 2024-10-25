import { HandlerContext, xmtpClient } from "@xmtp/message-kit";
import { db } from "../lib/db.js";
await db.read();

const { v2client: bittu } = await xmtpClient({
  privateKey: process.env.KEY_BITTU,
});

export async function handlePoap(context: HandlerContext) {
  //@ts-ignore
  const { name } = context;
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
  } = context;

  if (command == "poap" && text == "/poap list") {
    const poapTable = db?.data?.poaps;
    const claimed = poapTable.filter((poap) => poap.Address);
    return {
      code: 200,
      message: `You have claimed ${claimed.length} POAPs out of ${poapTable.length}`,
    };
  } else if (command == "poap") {
    // Destructure and validate parameters for the ens command
    const { address } = params;
    await db.read();
    const poapTable = db?.data?.poaps;
    const poap = poapTable.find((poap) => poap.Address == address);

    if (!poap) {
      const emptyPoap = poapTable.find((poap) => !poap.Address);
      if (emptyPoap) {
        db?.data?.poaps?.push({ URL: emptyPoap?.URL, Address: address });
        return {
          code: 200,
          message: `Here is your POAP ${emptyPoap?.URL}?address=${address}`,
        };
      } else {
        return {
          code: 200,
          message: "No more POAPs available",
        };
      }
    } else {
      //?user_address=${address}`
      return {
        code: 200,
        message: `You have already claimed this POAP ${poap?.URL}`,
      };
    }
  } else if (command == "sendbittu") {
    const conversations = await bittu.conversations.list();

    let targetConversation = conversations.find(
      (conv) => conv.peerAddress.toLowerCase() === sender.address.toLowerCase()
    );

    if (!targetConversation) {
      targetConversation = await bittu.conversations.newConversation(
        sender.address.toLowerCase()
      );
    }
    await targetConversation.send(
      "psst, Bittu here. Do you want a exclusive POAP? Just ask me for it."
    );
    return {
      code: 200,
      message: "Bittu sent",
    };
  }
}
