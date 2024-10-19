import { mainHandler } from "./handlers/main.js";
import fs from "fs";

setupFiles();

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
  await mainHandler(appConfig_KUZCO, appConfig_KUZCO.name),
  await mainHandler(appConfig_PEANUT, appConfig_PEANUT.name),
  await mainHandler(appConfig_LILI, appConfig_LILI.name),
  await mainHandler(appConfig_EARL, appConfig_EARL.name),
  await mainHandler(appConfig_BITTU, appConfig_BITTU.name),
]);

async function setupFiles() {
  if (!fs.existsSync(".data/db.json")) {
    const dbfile = fs.readFileSync("src/data/db.json", "utf8");
    fs.writeFileSync(".data/db.json", dbfile);
    console.log("DB file created");
  }
}
