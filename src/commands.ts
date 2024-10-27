import type { CommandGroup } from "@xmtp/message-kit";
import { handleEns } from "./handlers/ens.js";
import { handlePoap } from "./handlers/poap.js";
import { handleSubscribe } from "./handlers/subscribe.js";
import { handleMembers } from "./handlers/members.js";
import { handleStatus } from "./handlers/status.js";

export const commands: CommandGroup[] = [
  {
    name: "Subscribe",
    description: "Subscribe to updates.",
    commands: [
      {
        command: "/subscribe [address]",
        triggers: ["/subscribe", "/unsubscribe", "@earl"],
        handler: handleSubscribe,
        description: "Subscribe to updates.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        command: "/unsubscribe [address]",
        triggers: ["/subscribe", "/unsubscribe", "@earl"],
        handler: handleSubscribe,
        description: "Unsubscribe to updates.",
        params: {
          address: {
            type: "address",
          },
        },
      },
    ],
  },
  {
    name: "Group Bot",
    description: "Get the group ID.",
    commands: [
      {
        command: "/add",
        adminOnly: true,
        handler: handleMembers,
        triggers: ["/id", "/add", "/remove", "/exists", "@earl"],
        description: "Add yourself to the group.",
        params: {},
      },
      {
        command: "/remove",
        adminOnly: true,
        handler: handleMembers,
        triggers: ["/id", "/add", "/remove", "/exists", "@earl"],
        description: "Remove yourself from the group.",
        params: {},
      },
      {
        command: "/id",
        adminOnly: true,
        handler: handleMembers,
        triggers: ["/id", "/add", "/remove", "/exists", "@earl"],
        description: "Get the group ID.",
        params: {},
      },
      {
        command: "/exists [address]",
        adminOnly: true,
        handler: handleSubscribe,
        triggers: ["/id", "/add", "/remove", "/exists", "@earl"],
        description: "Check if an address is onboarded.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        command: "/status",
        adminOnly: true,
        triggers: ["/status", "@earl"],
        handler: handleStatus,
        description: "Get the status of the bot.",
        params: {},
      },
    ],
  },
  {
    name: "Ens Domain Bot",
    description: "Register ENS domains.",
    commands: [
      {
        command: "/register [domain]",
        triggers: ["/register", "@kuzco"],
        handler: handleEns,
        description: "Register a domain.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        command: "/info [domain]",
        triggers: ["/info", "@kuzco"],
        handler: handleEns,
        description: "Get information about a domain.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        command: "/renew [domain]",
        triggers: ["/renew", "@kuzco"],
        handler: handleEns,
        description: "Renew a domain.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        command: "/help",
        triggers: ["/help", "@kuzco"],
        handler: undefined,
        description: "Get help with the bot.",
        params: {},
      },
      {
        command: "/check [domain]",
        triggers: ["/check", "@kuzco"],
        handler: handleEns,
        description: "Check if a domain is available.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
    ],
  },
  {
    name: "Poap Bot",
    description: "Get your POAP.",
    commands: [
      {
        command: "/poap [address]",
        triggers: ["/poap", "/sendbittu", "/removepoap"],
        handler: handlePoap,
        description: "Get your POAP.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        command: "/sendbittu [address]",
        triggers: ["/poap", "/sendbittu", "/removepoap"],
        handler: handlePoap,
        description: "Send Bittu to send a DM.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        command: "/removepoap [address]",
        triggers: ["/poap", "/sendbittu", "/removepoap"],
        handler: handlePoap,
        description: "Remove your POAP.",
        params: {
          address: {
            type: "address",
          },
        },
      },
    ],
  },
];
