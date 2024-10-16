import { HandlerContext, User, ApiResponse } from "@xmtp/message-kit";
import { textGeneration } from "../lib/openai.js";
import fs from "fs";
import path from "path";
import { getBotAddress } from "../lib/bots.js";
import { fileURLToPath } from "url";
import { RedisClientType } from "@redis/client";
import { getRedisClient } from "../lib/redis.js";
const chatHistories: Record<string, any[]> = {};
import { subscribeToNotion } from "../lib/notion.js";

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
      await getSystemPrompt(name, sender, context),
      chatHistories[historyKey]
    );
    console.log("reply", reply);

    if (!group) chatHistories[historyKey] = history; // Update chat history for the user
    const messages = reply
      .split("\n")
      .filter((message) => message.trim() !== "");

    for (const message of messages) {
      if (message.startsWith("/")) {
        const response = await context.intent(message);
        if (response) context.send((response as ApiResponse).message);
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

async function getSystemPrompt(
  name: string,
  sender: User,
  context: HandlerContext
) {
  const bangkokTimezone = "Asia/Bangkok";
  const currentTime = new Date().toLocaleString("en-US", {
    timeZone: bangkokTimezone,
  });

  //General prompt
  const generalFilePath = path.resolve(
    __dirname,
    `../../src/prompts/general.md`
  );
  let generalPrompt = fs.readFileSync(generalFilePath, "utf8");
  const time = `Current time in Bangkok: ${currentTime} - ${new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    }
  )}`;
  generalPrompt = generalPrompt.replace("{NAME}", name);
  generalPrompt = generalPrompt.replace("{TIME}", time);
  generalPrompt = generalPrompt.replace(
    "kuzco.converse.xyz",
    getBotAddress("kuzco") || ""
  );
  generalPrompt = generalPrompt.replace(
    "lili.converse.xyz",
    getBotAddress("lili") || ""
  );
  generalPrompt = generalPrompt.replace(
    "peanut.converse.xyz",
    getBotAddress("peanut") || ""
  );
  generalPrompt = generalPrompt.replace(
    "bittu.converse.xyz",
    getBotAddress("bittu") || ""
  );
  generalPrompt = generalPrompt.replace(
    "earl.converse.xyz",
    getBotAddress("earl") || ""
  );
  //Personality prompt
  const personalityFilePath = path.resolve(
    __dirname,
    `../../src/prompts/personalities/${name}.md`
  );
  const personality = fs.readFileSync(personalityFilePath, "utf8");
  const taskFilePath = path.resolve(
    __dirname,
    `../../src/prompts/tasks/${name}.md`
  );

  //Task prompt
  let task = fs.readFileSync(taskFilePath, "utf8");
  task = task.replace("{ADDRESS}", sender.address);

  if (name === "earl") {
    const speakersFilePath = path.resolve(
      __dirname,
      "../../src/data/speakers.md"
    );
    const speakers = fs.readFileSync(speakersFilePath, "utf8");
    task = task + "\n\n" + speakers;

    const response = await context.intent("/subscribe");
    console.log("response", response);
  } else if (name === "lili") {
    const thailandFilePath = path.resolve(
      __dirname,
      "../../src/data/thailand.csv"
    );
    const thailand = fs.readFileSync(thailandFilePath, "utf8");
    task = task + "\n\n" + thailand;
  }

  //System prompt
  const systemPrompt =
    `# Rules\n\n` +
    generalPrompt +
    `\n\n# Personality: You are ${name}\n\n` +
    personality +
    `\n\n# Task\n\n You are ${name}. ${task}`;
  //console.log(systemPrompt);
  return systemPrompt;
}
