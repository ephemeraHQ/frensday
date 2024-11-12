import { HandlerContext } from "@xmtp/message-kit";
import {
  getUserInfo,
  textGeneration,
  processMultilineResponse,
} from "@xmtp/message-kit";
import { checkIfRecordExists } from "../lib/lowdb.js";
import { system_prompt } from "../prompt.js";
import { onboard } from "../lib/utils.js";

export async function agentHandler(context: HandlerContext, name: string) {
  const {
    message: {
      content: { text, params },
      sender,
    },
  } = context;

  try {
    const userInfo = await getUserInfo(sender.address);

    if (!userInfo) {
      console.log("User info not found");
      return;
    }
    let userPrompt = params?.prompt ?? text;
    let systemPrompt = system_prompt(name, userInfo);
    //Onboarding
    /*if (name === "earl") {
      const exists = await checkIfRecordExists("subscribers", sender.address);
      console.log("exists", exists);
      if (!exists) {
        return await onboard(
          context,
          userInfo.preferredName ?? "Friend",
          sender.address
        );
      }
    }*/

    const { reply } = await textGeneration(
      `${name}:${sender.address}`,
      userPrompt,
      systemPrompt
    );

    await processMultilineResponse(sender.address, reply, context);
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    //await context.send(messageError);
  }
}
