import { mainHandler } from "./handlers/main.js";

// App configuration
const appConfig_KUZCO = {
  privateKey: process.env.KEY_KUZCO,
  name: "kuzco",
};
const appConfig_PEANUT = {
  privateKey: process.env.KEY_PEANUT,
  name: "peanut",
};
const appConfig_LILI = {
  privateKey: process.env.KEY_LILI,
  name: "lili",
};
const appConfig_EARL = {
  privateKey: process.env.KEY_EARL,
  name: "earl",
};
const appConfig_BITTU = {
  privateKey: process.env.KEY_BITTU,
  name: "bittu",
};

Promise.all([
  console.log(
    "Starting bots",
    appConfig_KUZCO.name,
    appConfig_PEANUT.name,
    appConfig_LILI.name,
    appConfig_EARL.name,
    appConfig_BITTU.name
  ),
  await mainHandler(appConfig_KUZCO, appConfig_KUZCO.name),
  await mainHandler(appConfig_PEANUT, appConfig_PEANUT.name),
  await mainHandler(appConfig_LILI, appConfig_LILI.name),
  await mainHandler(appConfig_EARL, appConfig_EARL.name),
  await mainHandler(appConfig_BITTU, appConfig_BITTU.name),
]);
