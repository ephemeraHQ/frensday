import dotenv from "dotenv";
dotenv.config();
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const pageId = process.env.NOTION_POAP_DB;

export async function downloadPoapTable() {
  const response = await notion.databases.query({
    database_id: pageId as string,
  });

  const poapTable = response.results.map((page: any) => {
    const url = page.properties.Url.url;
    const address = page.properties.Address.title[0]?.plain_text;
    const id = page.id;
    return { url, address, id };
  });
  return poapTable as { url: string; address: string; id: string }[];
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
