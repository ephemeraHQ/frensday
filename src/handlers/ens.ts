import { HandlerContext } from "@xmtp/message-kit";

interface EnsData {
  address?: string;
  avatar?: string;
  avatar_small?: string;
  avatar_url?: string;
  contentHash?: string;
  description?: string;
  ens?: string;
  ens_primary?: string;
  github?: string;
  resolverAddress?: string;
  twitter?: string;
  url?: string;
  wallets?: {
    eth?: string;
  };
}
const chatHistories: Record<string, any[]> = {};

interface EnsData {
  address?: string;
  avatar?: string;
  avatar_small?: string;
  avatar_url?: string;
  contentHash?: string;
  description?: string;
  ens?: string;
  ens_primary?: string;
  github?: string;
  resolverAddress?: string;
  twitter?: string;
  url?: string;
  wallets?: {
    eth?: string;
  };
}

export async function handleEns(context: HandlerContext) {
  const {
    message: {
      content: { command, params, sender },
    },
  } = context;
  const frameUrl = "https://ens.steer.fun/";
  const baseUrl = "https://app.ens.domains/";
  if (command == "renew") {
    // Destructure and validate parameters for the ens command
    const { domain } = params;
    // Check if the user holds the domain
    if (!domain) {
      context.reply("Missing required parameters. Please provide domain.");
      return;
    }

    const response = await fetch(`https://ensdata.net/${domain}`);
    const data: EnsData = (await response.json()) as EnsData;

    if (data?.address !== sender?.address) {
      context.reply(
        "You do not hold this domain. Only the owner can renew it."
      );
      return;
    }

    // Generate URL for the ens
    let url_ens = frameUrl + "frames/manage?name=" + domain;
    context.send(`${url_ens}`);
  } else if (command == "register") {
    // Destructure and validate parameters for the ens command
    const { domain } = params;

    if (!domain) {
      context.reply("Missing required parameters. Please provide domain.");
      return;
    }
    // Generate URL for the ens
    let url_ens = baseUrl + domain + "/register";
    context.send(`${url_ens}`);
  } else if (command == "help") {
    context.send(
      "Here is the list of commands:\n/register [domain]: Register a domain.\n/renew [domain]: Renew a domain.\n/info [domain]: Get information about a domain.\n/check [domain]: Check if a domain is available.\n/help: Show the list of commands"
    );
  } else if (command == "info") {
    const { domain } = params;
    const response = await fetch(`https://ensdata.net/${domain}`);
    const data: EnsData = (await response.json()) as EnsData;
    //@ts-ignore
    const formattedData = {
      Address: data?.address,
      "Avatar URL": data?.avatar_url,
      Description: data?.description,
      ENS: data?.ens,
      "Primary ENS": data?.ens_primary,
      GitHub: data?.github,
      "Resolver address": data?.resolverAddress,
      Twitter: data?.twitter,
      URL: `${baseUrl}${domain}`,
    };

    let message = "Domain information:\n\n";
    for (const [key, value] of Object.entries(formattedData)) {
      if (value) {
        message += `${key}: ${value}\n`;
      }
    }

    return { code: 200, message };
    // context.send(message);
  } else if (command == "check") {
    const { domain } = params;

    if (!domain) {
      context.reply("Please provide a domain name to check.");
      return;
    }
    const response = await fetch(`https://ensdata.net/${domain}`);
    const data = await response.json();

    //@ts-ignore
    if (data.status == 404) {
      return {
        code: 200,
        message: `Looks like ${domain} is available! Do you want to register it? ${baseUrl}${domain}`,
      };
    } else {
      return {
        code: 404,
        message: `Looks like ${domain} is already registered! Let's try another one`,
      };
    }
  }
}
