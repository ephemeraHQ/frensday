import { HandlerContext, Config } from "@xmtp/message-kit";
import { agentHandler } from "./agent.js";
import { run } from "@xmtp/message-kit";
import { startCron } from "../lib/cron.js";
import { xmtpClient } from "@xmtp/message-kit";
import { isBot, isReplyFromBot, getBotAddress } from "../lib/bots.js";
import { clearChatHistory } from "./agent.js";

const { v2client: earl } = await xmtpClient({
  privateKey: process.env.KEY_EARL,
});
startCron(earl);

export async function mainHandler(appConfig: Config) {
  //@ts-ignore
  const { name } = appConfig;
  run(async (context: HandlerContext) => {
    const {
      message: {
        content: { content: text, params, command },
        content,
        typeId,
        sender,
      },
      group,
      members,
      version,
      getReplyChain,
    } = context;

    if (isBot(sender.address)) return;
    if (typeId === "group_updated" && name == "bittu") {
      const { addedInboxes } = context.message.content;
      if (addedInboxes.length === 1) {
        const addedMember = await members?.find(
          (member: any) => member.inboxId === addedInboxes[0]?.inboxId
        );
        if (addedMember) {
          console.log(addedMember);
          group.send(
            "Welcome to the group!" + addedMember?.address.slice(0, 4) + "..."
          );
        }
      }

      return;
    } else if (typeId !== "text" && typeId !== "reply") return;
    const lowerContent = text?.toLowerCase();

    if (lowerContent.startsWith("/reset")) {
      clearChatHistory();
      context.send("Resetting chat history");
      //remove from group
      const response = await context.intent("/remove");
      if (response && response.message) context.send(response.message);
      const response2 = await context.intent("/unsubscribe");
      if (response2 && response2.message) context.send(response2.message);

      const response3 = await context.intent(`/removepoap ${sender.address}`);
      if (response3 && response3.message) context.send(response3.message);

      return;
    } else if (lowerContent.startsWith("/")) {
      context.intent(text);
      return;
    } else if (
      !group ||
      (group && typeId === "text" && text.includes("@" + name))
    ) {
      await agentHandler(context, name);
      return;
    } else if (typeId === "reply") {
      const { content: reply, reference } = content;
      const botAddress = getBotAddress(name);
      const { chain } = await getReplyChain(
        reference,
        version,
        botAddress || ""
      );

      let userPrompt = `The following is a conversation history. \nMessage History:\n${chain
        .map((c) => c.content)
        .join("\n")}\nLatest reply: ${reply}`;

      if (await isReplyFromBot(chain, userPrompt, name)) {
        await agentHandler(context, name);
      }
      return;
    } else if (group) return;
  }, appConfig);
}
