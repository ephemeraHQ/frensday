import { HandlerContext, User } from "@xmtp/message-kit";
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
    if (name === "earl" && !group) {
      if (await onboard(context, name, sender)) return;
    }

    const { reply, history } = await textGeneration(
      userPrompt,
      await getSystemPrompt(name, sender),
      chatHistories[historyKey]
    );

    if (!group) chatHistories[historyKey] = history; // Update chat history for the user
    const messages = reply.split("\n").filter((message) =>
      message
        ?.replace(/(\*\*|__)(.*?)\1/g, "$2")
        ?.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$2")
        ?.replace(/^#+\s*(.*)$/gm, "$1")
        ?.replace(/`([^`]+)`/g, "$1")
        ?.replace(/^`|`$/g, "")
        ?.trim()
    );
    console.log("messages", reply, messages);
    for (const message of messages) {
      if (message.startsWith("/")) {
        const response = await context.intent(message);
        //console.log("response", response);

        if (response && response.message) {
          let msg = response?.message
            ?.replace(/(\*\*|__)(.*?)\1/g, "$2")
            ?.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$2")
            ?.replace(/^#+\s*(.*)$/gm, "$1")
            ?.replace(/`([^`]+)`/g, "$1")
            ?.replace(/^`|`$/g, "")
            ?.trim();

          chatHistories[sender.address].push({
            role: "system",
            content: msg,
          });

          await context.send(response.message);
        }
      } else {
        await context.send(message);
      }
    }
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    await context.send(
      "Oops looks like something went wrong. Please call my creator to fix me."
    );
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
        console.log("Adding to group");
        const response2 = await context.intent("/add");
        if (response2?.code == 200) {
          //onboard message
          context.send(
            `Welcome! I'm Earl, and I'm here to assist you with everything frENSday!

Join us in our event group chat: https://bit.ly/frensday

If you need any information about the event or our speakers, just ask me. I'm always happy to help!`
          );
          console.log("Subscribing");
          const response = await context.intent("/subscribe");
          context.send(response?.message ?? "");
          context.send(
            "psst... by the way, check with Bittu for a exclusive POAP 😉"
          );

          return true;
        }
      }
    } catch (error) {
      console.log("Error adding to group", error);
    }
    return false;
  }
}
