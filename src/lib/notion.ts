import dotenv from "dotenv";
dotenv.config();
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const poapsID = process.env.NOTION_POAP_DB;
const subscribedID = process.env.NOTION_SUBSCRIBED_DB;
export async function downloadPoapTable() {
  const response = await notion.databases.query({
    database_id: poapsID as string,
  });

  const poapTable = response.results.map((page: any) => {
    const url = page.properties.Url.url;
    const address = page.properties.Address.title[0]?.plain_text;
    const id = page.id;
    return { url, address, id };
  });
  return poapTable as { url: string; address: string; id: string }[];
}
export async function subscribeToNotion(address: string, subscribed: boolean) {
  const page = await notion.pages.create({
    parent: {
      database_id: subscribedID as string,
    },
    properties: {
      Address: {
        type: "title",
        title: [
          {
            text: { content: address },
          },
        ],
      },
      Status: {
        type: "select",
        select: {
          name: subscribed ? "✅" : "❌",
        },
      },
    },
  });
  return page.id;
}

export async function updatePoapAddress(dbRowId: string, address: string) {
  await notion.pages.update({
    page_id: dbRowId as string,
    properties: {
      Address: {
        type: "title",
        title: [
          {
            type: "text",
            text: { content: address },
          },
        ],
      },
    },
  });
}
