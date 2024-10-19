import { HandlerContext } from "@xmtp/message-kit";
import { db } from "../lib/db.js";
await db.read();

export async function handlePoap(context: HandlerContext) {
  const {
    message: {
      content: { content: text, command, params },
      sender,
    },
  } = context;

  if (command == "poap" && text == "/poap list") {
    const poapTable = db?.data?.poaps;
    const claimed = poapTable.filter((poap) => poap.Address);
    await context.send(
      `You have claimed ${claimed.length} POAPs out of ${poapTable.length}`
    );
  } else if (command == "poap") {
    // Destructure and validate parameters for the ens command
    const { address } = params;

    if (!address) {
      await context.send(
        "Missing required parameters. Please provide address."
      );
      return;
    }
    await db.read();
    const poapTable = db?.data?.poaps;
    const poap = poapTable.find((poap) => poap.Address == address);
    console.log(poap);
    if (!poap) {
      const emptyPoap = poapTable.find((poap) => !poap.Address);
      if (emptyPoap) {
        db?.data?.poaps?.push({ URL: emptyPoap?.URL, Address: address });
        await context.send(`Here is your POAP ${emptyPoap?.URL}`);
        await db.write();
      } else {
        await context.send("No more POAPs available");
      }
    } else {
      await context.send(`You have already claimed this POAP ${poap?.URL}`);
    }
    //clearChatHistory();
  }
}
