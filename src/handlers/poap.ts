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

  if (command == "poaplist") {
    await db.read();
    const poapTable = db?.data?.poaps;
    const claimed = poapTable.filter((poap) => poap.address);
    return {
      code: 200,
      message: `You have claimed ${claimed.length} POAPs out of ${poapTable.length}`,
    };
  } else if (command == "poap") {
    await db.read();
    // Destructure and validate parameters for the ens command
    const { address } = params;
    const poapTable = db?.data?.poaps;
    const poap = poapTable.find((poap) => poap.address == address);

    if (!poap) {
      const newPoap = poapTable.find((poap) => !poap.address);
      if (newPoap) {
        db?.data?.poaps?.push({ id: newPoap?.id, address: address });
        const url = `https://mint.poap.studio/claim-20/${newPoap?.id}?user_address=${address}`;
        //const url = `https://collectors.POAP.xyz/mint-v2/${newPoap?.id}?address=${address}`;
        await db.write();
        return {
          code: 200,
          message: `Here is your POAP ${url}`,
        };
      } else {
        return {
          code: 200,
          message: "No more POAPs available",
        };
      }
    } else if (poap) {
      const url = `https://collectors.POAP.xyz/mint-v2/${poap?.id}`;
      return {
        code: 200,
        message: `You have already claimed this POAP ${url}`,
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
  } else if (command == "removepoap") {
    await db.read();
    const { address } = params;
    const poapTable = db?.data?.poaps;
    console.log("poapTable", poapTable);
    const claimed = poapTable.find(
      (poap) => poap?.address?.toLowerCase() === address?.toLowerCase()
    );
    console.log("claimed", address, claimed);
    if (claimed) {
      claimed.address = "";
      await db.write();
    } else {
      return {
        code: 400,
        message: "No POAP found for this address",
      };
    }
    return {
      code: 200,
      message: `Your poap ${claimed?.id} has been removed`,
    };
  }
}
