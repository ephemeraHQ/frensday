import type { CommandGroup } from "@xmtp/message-kit";
import { handleEns } from "./handlers/ens.js";
import { handlePoap } from "./handlers/poap.js";
import { handleSubscribe } from "./handlers/subscribe.js";

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
    triggers: ["/subscribe", "/stop"],
    commands: [
      {
        command: "/subscribe [address]",
        handler: handleSubscribe,
        description: "Subscribe to updates.",
        params: {
          address: {
            type: "string",
          },
        },
      },
      {
        command: "/stop [address]",
        handler: handleSubscribe,
        description: "Unsubscribe to updates.",
        params: {
          address: {
            type: "string",
          },
        },
      },
    ],
  },
  {
    name: "Poap Bot",
    description: "Get your POAP.",
    triggers: ["/poap"],
    commands: [
      {
        command: "/poap [address]",
        handler: handlePoap,
        description: "Get your POAP.",
        params: {
          address: {
            type: "string",
          },
        },
      },
    ],
  },
  {
    name: "Ens Domain Bot",
    description: "Register ENS domains.",
    triggers: ["/help", "/register", "/check", "/info"],
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
