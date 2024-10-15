import { HandlerContext, User } from "@xmtp/message-kit";

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
      content: { command, params },
    },
  } = context;

  const baseUrl = "https://ens.steer.fun/";
  if (command == "register") {
    // Destructure and validate parameters for the ens command
    const { domain } = params;

    if (!domain) {
      context.send("Missing required parameters. Please provide domain.");
      return;
    }
    // Generate URL for the ens
    let url_ens = baseUrl + "frames/manage?name=" + domain;
    context.send(`${url_ens}`);
  } else if (command == "help") {
    context.send(
      "Here is the list of commands:\n/register [domain]: Register a domain.\n/info [domain]: Get information about a domain.\n/check [domain]: Check if a domain is available.\n/help: Show the list of commands"
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
      URL: `https://app.ens.domains/${domain}`,
    };

    let message = "Domain information:\n\n";
    for (const [key, value] of Object.entries(formattedData)) {
      if (value) {
        message += `${key}: ${value}\n`;
      }
    }

    context.send(message);
  } else if (command == "check") {
    const { domain } = params;

    if (!domain) {
      context.send("Please provide a domain name to check.");
      return;
    }
    const response = await fetch(`https://ensdata.net/${domain}`);
    const data = await response.json();

    //@ts-ignore
    if (data.status == 404) {
      context.send(
        `Looks like ${domain} is available! Do you want to register it? https://ens.steer.fun/frames/manage?name=${domain}`
      );
    } else {
      context.send(
        `Looks like ${domain} is already registered! Let's try another one`
      );
    }
  }
}
