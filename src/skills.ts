import type { SkillGroup } from "@xmtp/message-kit";
import { handleEns } from "./handlers/ens.js";
import { handlePoap } from "./handlers/poap.js";
import { handleMembers } from "./handlers/members.js";

export const skills: SkillGroup[] = [
  {
    name: "Earl",
    tag: "@earl",
    description: "Earl manages all for the event",
    skills: [
      {
        skill: "/send [message]",
        triggers: ["/send"],
        adminOnly: true,
        handler: handleMembers,
        examples: ["/send Hello everyone, the event is starting now!"],
        description: "Send updates to all subscribers.",
        params: {
          message: {
            type: "prompt",
          },
        },
      },
      {
        skill: "/subscribe",
        triggers: ["/subscribe"],
        handler: handleMembers,
        examples: ["/subscribe"],
        description: "Subscribe to updates.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        skill: "/remove",
        triggers: ["/remove"],
        examples: ["/remove"],
        handler: handleMembers,
        description: "Remove yourself from the group.",
        params: {},
      },
      {
        skill: "/reset",
        triggers: ["/reset"],
        examples: ["/reset"],
        handler: handleMembers,
        description: "Reset the conversation.",
        params: {},
      },
      {
        skill: "/unsubscribe",
        triggers: ["/unsubscribe"],
        examples: ["/unsubscribe"],
        handler: handleMembers,
        description: "Unsubscribe to updates.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        skill: "/add",
        adminOnly: true,
        handler: handleMembers,
        triggers: ["/add"],
        examples: ["/add"],
        description: "Add yourself to the group.",
        params: {},
      },
      {
        skill: "/status",
        adminOnly: true,
        triggers: ["/status"],
        examples: ["/status"],
        handler: handleMembers,
        description: "Get the status of the bot.",
        params: {},
      },
      {
        skill: "/exists",
        adminOnly: true,
        examples: ["/exists"],
        handler: handleMembers,
        triggers: ["/exists"],
        description: "Check if an address is onboarded.",
        params: {},
      },
    ],
  },
  {
    name: "Kuzco",
    tag: "@kuzko",
    description: "Register ENS domains.",
    skills: [
      {
        skill: "/register [domain]",
        triggers: ["/register"],
        handler: handleEns,
        description:
          "Register a new ENS domain. Returns a URL to complete the registration process.",
        examples: ["/register vitalik.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/info [domain]",
        triggers: ["/info"],
        handler: handleEns,
        description:
          "Get detailed information about an ENS domain including owner, expiry date, and resolver.",
        examples: ["/info nick.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/renew [domain]",
        triggers: ["/renew"],
        handler: handleEns,
        description:
          "Extend the registration period of your ENS domain. Returns a URL to complete the renewal.",
        examples: ["/renew fabri.base.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/check [domain]",
        triggers: ["/check"],
        handler: handleEns,
        examples: ["/check vitalik.eth", "/check fabri.base.eth"],
        description: "Check if a domain is available.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/cool [domain]",
        triggers: ["/cool"],
        examples: ["/cool vitalik.eth"],
        handler: handleEns,
        description: "Get cool alternatives for a .eth domain.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/tip [address]",
        description: "Show a URL for tipping a domain owner.",
        triggers: ["/tip"],
        handler: handleEns,
        examples: ["/tip 0x1234567890123456789012345678901234567890"],
        params: {
          address: {
            type: "string",
          },
        },
      },
    ],
  },
  {
    name: "Bittu",
    tag: "@bittu",
    description: "Bittu is the mascot of the event, delivers your poap",
    skills: [
      {
        skill: "/poap [address]",
        triggers: ["/poap"],
        examples: ["/poap 0xe9791cb9Db1eF92Ed0670B31ab9a9453AA7BFb4c"],
        handler: handlePoap,
        description: "Get your POAP.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        skill: "/sendbittu [address]",
        triggers: ["/sendbittu"],
        examples: ["/sendbittu 0xe9791cb9Db1eF92Ed0670B31ab9a9453AA7BFb4c"],
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
];
