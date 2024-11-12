import { HandlerContext, xmtpClient } from "@xmtp/message-kit";
import { clearChatHistory } from "../lib/utils.js";
import { SkillResponse } from "@xmtp/message-kit";
import { getRecordByField, updateRecordById } from "../lib/lowdb.js";

const { v2client: bittu } = await xmtpClient({
  privateKey: process.env.KEY_BITTU,
  hideInitLogMessage: true,
});

export async function handlePoap(
  context: HandlerContext
): Promise<SkillResponse | undefined> {
  const {
    message: {
      content: { text, skill, params },
      sender,
    },
  } = context;

  const url = `https://converse.xyz/poap/`; // we use this to render the frame

  if (skill == "poap") {
    context.send("No more poaps available");
    return {
      code: 400,
      message: "No more poaps available",
    };
    /*
    // Destructure and validate parameters for the ens command
    const { address } = params;
    console.log("address", address);
    // Find a POAP with the given address
    const poap = await getRecordByField("poaps", "address", address);
    if (!poap) {
      // Find a new POAP with an empty address
      const newPoap = await getRecordByField("poaps", "address", "");

      if (newPoap?.id && address) {
        let poapURL = `${url}${newPoap?.id}`;
        if (address) poapURL += `?address=${address}`;
        await clearChatHistory(sender.address);
        await context.send(`Here is your POAP`);
        await updateRecordById("poaps", newPoap?.id, { address });
        const poap = await getRecordByField("poaps", "address", address);
        // context.send(`POAP updated to ${newPoap?.id} - ${address}`);
        return {
          code: 200,
          message: `${poapURL}`,
        };
      } else {
        clearChatHistory(sender.address);
        return {
          code: 400,
          message: "No more POAPs available",
        };
      }
    } else if (poap) {
      let poapURL = `${url}${poap?.id}`;
      if (address) poapURL += `?address=${address}`;
      await context.send(`Here is the POAP you already claimed`);
      //context.send(`POAP delivered to ${poap?.id} - ${address}`);
      return {
        code: 200,
        message: `${poapURL}`,
      };
    }
    */
  } else if (skill == "sendbittu") {
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
  } else if (skill == "removepoap") {
    const { address } = params;
    const poap = await getRecordByField("poaps", "address", address);
    if (poap) {
      await updateRecordById("poaps", poap.id, { address: "" });
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

/*
  //const url = `https://mint.poap.studio/claim-20/`; will not render the frame
  //const url = `https://collectors.POAP.xyz/mint-v2/` will not render the frame (default poaps)
  //const url = `https://dev.converse.xyz/poap/`; // we use this to render the frame
  //const url = `http://localhost:3000/poap/`; // we use this to render the frame

    // Here we use address
    // Poap studio uses user_address
    // In converse web  transform address to user_address
    */
