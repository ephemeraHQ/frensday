import { HandlerContext } from "@xmtp/message-kit";
import {
  getUserInfo,
  textGeneration,
  processMultilineResponse,
} from "@xmtp/message-kit";
import { system_prompt } from "../prompt.js";
import { getBotAddress } from "../lib/bots.js";

export async function agentHandler(context: HandlerContext, name: string) {
  if (!process?.env?.OPEN_AI_API_KEY) {
    console.log("No OPEN_AI_API_KEY found in .env");
    return;
  }
  const {
    message: {
      content: { content, params },
      sender,
    },
  } = context;
  try {
    const userInfo = await getUserInfo(sender.address);

    if (!userInfo) {
      console.log("User info not found");
      return;
    }
    let userPrompt = params?.prompt ?? content;
    let systemPrompt = system_prompt(name, userInfo);
    //Onboarding
    if (name === "earl") {
      const exists = await context.executeSkill(`/exists`);
      if (exists?.code == 400) {
        context?.send(
          "Hey there! Give me a sec while I fetch info about you first..."
        );
        return await onboard(
          context,
          userInfo.preferredName ?? "Friend",
          sender.address
        );
      }
    }

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

async function onboard(
  context: HandlerContext,
  name: string,
  senderAddress: string
) {
  try {
    console.warn("ONBOARD:Onboarding", senderAddress);
    const addedToGroup = await context.executeSkill("/add");
    // Sleep for 30 seconds
    console.warn("ONBOARD: Added to group");
    if (addedToGroup?.code == 200) {
      //onboard message
      const subscribed = await context.executeSkill(
        `/subscribe ${senderAddress}`
      );
      console.warn("ONBOARD: Subscribed to group");
      const groupId = process.env.GROUP_ID;
      console.warn("ONBOARD:  Group ID", groupId);
      await context.send(
        `Welcome ${name}! I'm Earl, and I'm here to assist you with everything frENSday!\n\nJoin us in our event group chat: https://converse.xyz/group/${groupId}\n\nIf you need any information about the event or our speakers, just ask me. I'm always happy to help!`
      );

      await context.executeSkill(`/sendbittu ${senderAddress}`);
      setTimeout(() => {
        context.send(
          `psst... by the way, check with Bittu https://converse.xyz/dm/${getBotAddress(
            "bittu"
          )} for a exclusive POAP 😉`
        );
      }, 30000); // 30000 milliseconds = 30 seconds
      return true;
    } else {
      console.warn(addedToGroup?.message ?? "Failed to add to group");
      context.send(addedToGroup?.message ?? "Failed to add to group");
      return false;
    }
  } catch (error) {
    console.log("Error adding to group", error);
    return false;
  }
}
