const isDeployed = process.env.NODE_ENV === "production";

export async function getBotName(address: string) {
  const addressList = isDeployed ? botAddresses : botLocalAddresses;
  return addressList.find(
    (bot) => bot.address.toLowerCase() === address.toLowerCase()
  )?.name;
}

export async function isReplyFromBot(
  chain: any,
  userPrompt: string,
  name: string
) {
  if (userPrompt.includes("@" + name)) return true;
  const botAddress = getBotAddress(name);
  if (!botAddress) return false;

  return chain.some(
    (c: any) => c.address.toLowerCase() == botAddress.toLowerCase()
  );
}

export const getBotAddress = (name: string) => {
  const addressList = isDeployed ? botAddresses : botLocalAddresses;
  if (addressList) {
    return addressList.find(
      (bot) => bot.name.toLowerCase() === name.toLowerCase()
    )?.address;
  }
  return "";
};

export const botLocalAddresses = [
  { name: "bittu", address: "0xa1C6718567B4960380235a07c1B0793aF81B1264" },
  { name: "lili", address: "0xFD18Eff445A32010bFB2Ab32A0F7A02CF08bAfdB" },
  { name: "earl", address: "0xe9791cb9Db1eF92Ed0670B31ab9a9453AA7BFb4c" },
  { name: "peanut", address: "0x839e618F3b928195b9572e3939bEF13ddF446717" },
  { name: "kuzco", address: "0x3C348aEF831a28f80FF261B028a0A9b2491C0BA6" },
];
export const botAddresses = [
  { name: "earl", address: "0x840c601502C56087dA44A8176791d33f4b741aeC" },
  { name: "lili", address: "0xE1f36769cfBf168d18d37D5257825E1E272ba843" },
  { name: "bittu", address: "0xf6A5657d0409eE8188332f0d3E9348242b54c4dc" },
  { name: "kuzco", address: "0xbef3B8277D99A7b8161C47CD82e85356D26E4429" },
  { name: "peanut", address: "0xc143D1b3a0Fe554dF36FbA0681f9086cf2640560" },
];

export async function isBot(address: string) {
  const addressList = isDeployed ? botAddresses : botLocalAddresses;
  return addressList.some(
    (bot) => bot.address.toLowerCase() === address.toLowerCase()
  );
}

export function replaceDeeplinks(generalPrompt: string) {
  generalPrompt = generalPrompt.replace(
    "kuzco.frens.eth",
    getBotAddress("kuzco") || ""
  );
  generalPrompt = generalPrompt.replace(
    "lili.frens.eth",
    getBotAddress("lili") || ""
  );
  generalPrompt = generalPrompt.replace(
    "peanut.frens.eth",
    getBotAddress("peanut") || ""
  );
  generalPrompt = generalPrompt.replace(
    "bittu.frens.eth",
    getBotAddress("bittu") || ""
  );
  generalPrompt = generalPrompt.replace(
    "earl.frens.eth",
    getBotAddress("earl") || ""
  );
  return generalPrompt;
}
