import { HandlerContext, Config } from "@xmtp/message-kit";
import { agentHandler } from "./agent.js";
import { run } from "@xmtp/message-kit";
import { startCron } from "../lib/cron.js";
import { xmtpClient } from "@xmtp/message-kit";
import { isBot, isReplyFromBot, getBotAddress } from "../lib/bots.js";
import { RedisClientType } from "@redis/client";
import { clearChatHistory } from "./agent.js";

const stopWords = ["cancel", "reset", "stop"];

const { v2client } = await xmtpClient({ privateKey: process.env.KEY_EARL });
startCron(v2client);

export async function mainHandler(appConfig: Config, name: string) {
  run(async (context: HandlerContext) => {
    const {
      message: {
        content: { content: text, params },
        content,
        typeId,
        sender,
      },
      group,
      version,
      getReplyChain,
    } = context;
    const isBotBool = await isBot(sender.address);
    if (isBotBool) return; //return if its bot

    if (typeId !== "text" && typeId !== "reply") return;
    const lowerContent = text?.toLowerCase();

    if (stopWords.some((word) => lowerContent.includes(word))) {
      clearChatHistory();
      context.send("Cleared chat history");
      //remove from group
      const response = await context.intent("/remove");
      const response2 = await context.intent("/unsubscribe");
      if (response && response.message) context.send(response.message);
      if (response2 && response2.message) context.send(response2.message);

      return;
    }
    if (lowerContent.startsWith("/")) {
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
