import { HandlerContext } from "@xmtp/message-kit";
import { textGeneration, processMultilineResponse } from "../lib/gpt.js";
import { getUserInfo } from "../lib/resolver.js";
import { system_prompt } from "../prompt.js";
import { getBotAddress, messageError } from "../lib/bots.js";

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
        console.log("Onboarding", userInfo);
        const onboarded = await onboard(
          context,
          userInfo.preferredName ?? "Friend",
          sender.address
        );
        if (onboarded) return;
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
    await context.send(messageError);
  }
}

async function onboard(
  context: HandlerContext,
  name: string,
  senderAddress: string
) {
  try {
    const addedToGroup = await context.executeSkill("/add");
    if (addedToGroup?.code == 200) {
      await context.send("Successfully added to group");
    } else {
      await context.send(messageError);
    }
    // Sleep for 30 seconds
    if (addedToGroup?.code == 200) {
      //onboard message
      await context.executeSkill(`/subscribe ${senderAddress}`);
      const groupId = process.env.GROUP_ID;
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
    }
  } catch (error) {
    console.log("Error adding to group", error);
    return false;
  }
}
