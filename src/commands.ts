import type { CommandGroup } from "@xmtp/message-kit";
import { handleEns } from "./handlers/ens.js";
import { handlePoap } from "./handlers/poap.js";
import { handleSubscribe } from "./handlers/subscribe.js";
import { handleMembers } from "./handlers/members.js";

export const commands: CommandGroup[] = [
  {
    name: "Characters Groups",
    triggers: ["@earl", "@earl", "@bittu", "@lili", "@peanut", "@kuzco"],
    description: "Talk to the characters.",
    commands: [],
  },
  {
    name: "Subscribe",
    description: "Subscribe to updates.",
    triggers: ["/subscribe", "/unsubscribe"],
    commands: [
      {
        command: "/subscribe [address]",
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
    triggers: ["/id", "/add", "/remove", "/exists"],
    commands: [
      {
        command: "/add",
        handler: handleMembers,
        description: "Add yourself to the group.",
        params: {},
      },
      {
        command: "/remove",
        handler: handleMembers,
        description: "Remove yourself from the group.",
        params: {},
      },
      {
        command: "/id",
        handler: handleMembers,
        description: "Get the group ID.",
        params: {},
      },
      {
        command: "/exists [address]",
        handler: handleSubscribe,
        description: "Check if an address is onboarded.",
        params: {
          address: {
            type: "address",
          },
        },
      },
    ],
  },
  {
    name: "Poap Bot",
    description: "Get your POAP.",
    triggers: ["/poap", "/sendbittu"],
    commands: [
      {
        command: "/poap [address]",
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
        handler: handlePoap,
        description: "Send Bittu to send a DM.",
        params: {
          address: {
            type: "address",
          },
        },
      },
    ],
  },
  {
    name: "Ens Domain Bot",
    description: "Register ENS domains.",
    triggers: [
      "/ens",
      "@ens",
      "@ensbot",
      "/help",
      "/register",
      "/check",
      "/info",
      "/renew",
    ],
    commands: [
      {
        command: "/register [domain]",
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
        handler: undefined,
        description: "Get help with the bot.",
        params: {},
      },
      {
        command: "/check [domain]",
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
];
