import { HandlerContext, run } from "@xmtp/message-kit";
import { agentHandler } from "./agent.js";
import { fetchSpeakersCron } from "../lib/cron.js";
import { isBot, BotAddress } from "../lib/bots.js";
import { sendBroadcast } from "../lib/utils.js";

// const { v2client: earl } = await xmtpClient({
//   privateKey: process.env.KEY_EARL,
//   hideInitLogMessage: true,
// });
fetchSpeakersCron();

export async function mainHandler(appConfig: BotAddress) {
  const { name } = appConfig;
  run(
    async (context: HandlerContext) => {
      const {
        message: {
          typeId,
          sender,
          content: { content: text },
        },
        group,
        members,
      } = context;
      if (isBot(sender.address)) return;
      if (typeId === "group_updated" && name == "bittu") {
        const { addedInboxes } = context.message.content;
        if (addedInboxes.length === 1) {
          const addedMember = await members?.find(
            (member: any) => member.inboxId === addedInboxes[0]?.inboxId
          );
          if (addedMember) {
            group.send(
              "Welcome to the group!" + addedMember?.address.slice(0, 4) + "..."
            );
          }
        }

        return;
      }
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
