import cron from "node-cron";
import { Client } from "@xmtp/xmtp-js";
import { RedisClientType } from "@redis/client";
import { fetchSpeakers } from "./eventapi.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPEAKERS_FILE_PATH = path.resolve(
  __dirname,
  "../../src/data/speakers.md"
);

async function saveSpeakersToFile() {
  const speakerInfo = await fetchSpeakers();
  const formattedSpeakerInfo = speakerInfo.replace(/\n/g, "\n\n");
  await fs.writeFile(SPEAKERS_FILE_PATH, formattedSpeakerInfo);
}

export async function startCron(
  redisClient: RedisClientType,
  v2client: Client
) {
  const conversations = await v2client.conversations.list();
  // Ensure speakers file exists or create it for the first time
  try {
    await fs.access(SPEAKERS_FILE_PATH);
  } catch (error) {
    console.log("Speakers file doesn't exist. Creating it for the first time.");
    await saveSpeakersToFile();
  }
  // Cron job to fetch and save speakers every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Fetching and saving speakers");
    await saveSpeakersToFile();
  });
  // Cron job to send updates once a day at midnight UTC
  cron.schedule(
    "0 0 * * *", // Once a day at midnight UTC
    async () => {
      const keys = await redisClient.keys("*");
      console.log(`Running task. ${keys.length} subscribers.`);
      const speakers = await fs.readFile(SPEAKERS_FILE_PATH, "utf-8");

      for (const address of keys) {
        const subscriptionStatus = await redisClient.get(address);
        if (subscriptionStatus === "subscribed") {
          const targetConversation = conversations.find(
            (conv) => conv.peerAddress === address
          );
          if (targetConversation) {
            await targetConversation.send(
              "Check out the latest event updates:"
            );
            await targetConversation.send(speakers);
            await targetConversation.send(
              "If you need any information about the event or our speakers, just ask me. I'm always happy to help!"
            );
            await targetConversation.send(
              "To unsubscribe, just tell me to stop."
            );
          }
        }
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );
}
