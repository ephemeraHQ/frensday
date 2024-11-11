import { HandlerContext, run } from "@xmtp/message-kit";
import { agentHandler } from "./agent.js";
import { fetchSpeakersCron } from "../lib/cron.js";
import { isBot, BotAddress } from "../lib/bots.js";

fetchSpeakersCron();

export async function mainHandler(appConfig: BotAddress) {
  const { name } = appConfig;
  run(
    async (context: HandlerContext) => {
      const {
        message: {
          typeId,
          sender,
          content: { text },
        },
        group,
        members,
      } = context;
      if (isBot(sender.address)) return;
      //Disable for groups
      if (group) {
        context.reply("Sorry i dont work inside groups 🙈... yet ;)");
        return;
      }
      if (typeId !== "text") return;

      await agentHandler(context, name);
    },
    { ...appConfig }
  );
}
