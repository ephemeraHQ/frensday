import { HandlerContext, User } from "@xmtp/message-kit";
import { textGeneration } from "../lib/openai.js";
import fs from "fs";
import path from "path";
import { replaceDeeplinks } from "../lib/bots.js";
import { fileURLToPath } from "url";
import { RedisClientType } from "@redis/client";
import { getRedisClient } from "../lib/redis.js";
const chatHistories: Record<string, any[]> = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redisClient: RedisClientType = await getRedisClient();
export async function agentHandler(context: HandlerContext, name: string) {
  if (!process?.env?.OPEN_AI_API_KEY) {
    console.log("No OPEN_AI_API_KEY found in .env");
    return;
  }

  const {
    message: { content, sender },
    group,
  } = context;

  try {
    const { content: userPrompt } = content;
    const historyKey = `${name}:${sender.address}`;

    const { reply, history } = await textGeneration(
      userPrompt,
      await getSystemPrompt(name, sender),
      chatHistories[historyKey]
    );

    if (!group) chatHistories[historyKey] = history; // Update chat history for the user
    const messages = reply
      .split("\n")
      .filter((message) => message.trim() !== "");

    for (const message of messages) {
      if (message.startsWith("/")) {
        const response = await context.intent(message);
        if (response && response.message) await context.send(response.message);
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

  //Putting it all together

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
  generalPrompt = replaceDeeplinks(generalPrompt);
  return generalPrompt;
}
