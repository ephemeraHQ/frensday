import { HandlerContext, xmtpClient } from "@xmtp/message-kit";
import { db } from "../lib/db.js";
import { clearChatHistory } from "./members.js";

const { v2client: bittu } = await xmtpClient({
  privateKey: process.env.KEY_BITTU,
  hideInitLogMessage: true,
});

export async function handlePoap(context: HandlerContext) {
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
  } = context;

  //const url = `https://mint.poap.studio/claim-20/`; will not render the frame
  //const url = `https://collectors.POAP.xyz/mint-v2/` will not render the frame (default poaps)
  const url = `https://converse.xyz/poap/`; // we use this to render the frame
  //const url = `https://dev.converse.xyz/poap/`; // we use this to render the frame
  //const url = `http://localhost:3000/poap/`; // we use this to render the frame

  await db.read();
  if (command == "poap") {
    // Destructure and validate parameters for the ens command
    const { address } = params;
    const poapTable = db?.data?.poaps;
    // Find a POAP with the given address
    const poap = poapTable.find((poap) => poap.address === address);

    // Here we use address
    // Poap studio uses user_address
    // In converse web  transform address to user_address
    if (!poap) {
      // Find a new POAP with an empty address
      const newPoap = poapTable.find((poap) => poap.address === "");
      console.log("newPoap", newPoap);

      if (newPoap?.id && newPoap?.address !== address) {
        // Assign the address to the new POAP
        clearChatHistory(sender.address);
        await context.send(`Here is your POAP`);
        let poapURL = `${url}${newPoap?.id}`;
        if (address) poapURL += `?address=${address}`;
        await context.send(poapURL);
        updatePoapDB(newPoap.id, address);
        //Write db
      } else {
        clearChatHistory(sender.address);
        await context.send(`No more POAPs available`);
      }
    } else if (poap) {
      clearChatHistory(sender.address);

      await context.send(`Here is the POAP you already claimed`);
      let poapURL = `${url}${poap?.id}`;
      if (address) poapURL += `?address=${address}`;
      await context.send(poapURL);
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
    clearChatHistory(sender.address);
    return {
      code: 200,
      message: "Bittu sent",
    };
  } else if (command == "removepoap") {
    const { address } = params;
    const poap = db?.data?.poaps?.find(
      (poap) => poap?.address?.toLowerCase() === address?.toLowerCase()
    );
    if (poap) {
      updatePoapDB(poap.id, "");
    } else {
      return {
        code: 400,
        message: "No POAP found for this address",
      };
    }
    return {
      code: 200,
      message: `Your poap ${poap?.id} has been removed`,
    };
  }
}

async function updatePoapDB(id: string, address: string) {
  const poap = db?.data?.poaps?.find((poap) => poap.id === id);
  if (poap) poap.address = address;
  await db.write();
  return true;
}
