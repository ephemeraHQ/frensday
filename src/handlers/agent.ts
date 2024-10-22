import { HandlerContext, User } from "@xmtp/message-kit";
import { responseParser } from "../lib/openai.js";
import { textGeneration } from "../lib/openai.js";
import fs from "fs";
import path from "path";
import { replaceDeeplinks } from "../lib/bots.js";
import { fileURLToPath } from "url";
let chatHistories: Record<string, any[]> = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function agentHandler(context: HandlerContext, name: string) {
  if (!process?.env?.OPEN_AI_API_KEY) {
    console.log("No OPEN_AI_API_KEY found in .env");
    return;
  }

  const {
    message: {
      content: { content: userPrompt },
      sender,
    },
    group,
  } = context;
  try {
    const historyKey = `${name}:${sender.address}`;

    //Onboarding
    if (name === "earl" && !group)
      if (await onboard(context, name, sender)) return;

    const { reply, history } = await textGeneration(
      userPrompt,
      await getSystemPrompt(name, sender),
      chatHistories[historyKey]
    );

    if (!group) chatHistories[historyKey] = history; // Update chat history for the user

    await processResponseWithIntent(reply, context, sender.address);
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    await context.send(
      "Oops looks like something went wrong. Please call my creator to fix me."
    );
  }
}

async function processResponseWithIntent(
  reply: string,
  context: any,
  senderAddress: string
) {
  let messages = reply
    .split("\n")
    .map((message: string) => responseParser(message))
    .filter((message): message is string => message.length > 0);

  for (const message of messages) {
    if (message.startsWith("/")) {
      const response = await context.intent(message);
      if (response && response.message) {
        let msg = responseParser(response.message);

        chatHistories[senderAddress]?.push({
          role: "system",
          content: msg,
        });

        await context.send(response.message);
        return chatHistories;
      }
    } else {
      await context.send(message);
      return chatHistories;
    }
  }
}

async function getSystemPrompt(name: string, sender: User) {
  //General prompt
  let generalPrompt = fs.readFileSync(
    path.resolve(__dirname, `../../src/prompts/general.md`),
    "utf8"
  );
  //Personality prompt
  const personality = fs.readFileSync(
    path.resolve(__dirname, `../../src/prompts/personalities/${name}.md`),
    "utf8"
  );

  //Task prompt
  let task = fs.readFileSync(
    path.resolve(__dirname, `../../src/prompts/tasks/${name}.md`),
    "utf8"
  );

  //Modify prompt
  generalPrompt = replaceValues(generalPrompt, name);
  task = task.replace("{ADDRESS}", sender.address);

  //Specific data

  if (name === "earl") {
    const speakers = fs.readFileSync(
      path.resolve(__dirname, "../../src/data/speakers.md"),
      "utf8"
    );

    task = task + "\n\n### Speakers\n\n" + speakers;
  } else if (name === "lili") {
    const thailand = fs.readFileSync(
      path.resolve(__dirname, "../../src/data/thailand.csv"),
      "utf8"
    );
    task = task + "\n\n### Thailand\n\n" + thailand;
  }

  const systemPrompt =
    generalPrompt +
    `\n\n# Personality: You are ${name}\n\n` +
    personality +
    `\n\n# Task\n\n You are ${name}. ${task}`;
  return systemPrompt;
}

function replaceValues(generalPrompt: string, name: string) {
  const bangkokTimezone = "Asia/Bangkok";
  const currentTime = new Date().toLocaleString("en-US", {
    timeZone: bangkokTimezone,
  });

  const time = `Current time in Bangkok: ${currentTime} - ${new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    }
  )}`;
  generalPrompt = generalPrompt.replace("{NAME}", name);
  generalPrompt = generalPrompt.replace("{TIME}", time);

  //Return with dev addresses for testing
  if (process.env.NODE_ENV !== "production")
    generalPrompt = replaceDeeplinks(generalPrompt);

  return generalPrompt;
}

export async function clearChatHistory() {
  chatHistories = {};
}

async function onboard(context: HandlerContext, name: string, sender: User) {
  if (name === "earl") {
    try {
      const exists = await context.intent(`/exists ${sender.address}`);
      if (exists?.code == 400) {
        const response2 = await context.intent("/add");
        console.log("Adding to group", response2);
        // Sleep for 30 seconds
        const groupId = process.env.GROUP_ID;
        if (response2?.code == 200) {
          //onboard message
          context.send(
            `Welcome! I'm Earl, and I'm here to assist you with everything frENSday!

Join us in our event group chat: https://frens-day-fabrizioguespe.replit.app/?groupId=${groupId}

If you need any information about the event or our speakers, just ask me. I'm always happy to help!`
          );
          const response = await context.intent("/subscribe");
          console.log(response?.message ?? "");
          setTimeout(() => {
            context.send(
              "psst... by the way, check with Bittu https://converse.xyz/dm/bittu.frens.eth for a exclusive POAP 😉"
            );
          }, 60000); // 60000 milliseconds = 1 minute
          console.log(`User added: ${sender.address}`);

          const msg = await context.intent(`/sendpoap ${sender.address}`);
          if (msg?.code == 200) context.send(msg?.message);
          return msg?.code == 200;
        }
      }
    } catch (error) {
      console.log("Error adding to group", error);
    }
    return false;
  }
}
