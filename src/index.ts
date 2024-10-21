import { mainHandler } from "./handlers/main.js";
import fs from "fs";
import { generateAnnouncement } from "./lib/cron.js";

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
  await mainHandler(appConfig_KUZCO),
  await mainHandler(appConfig_PEANUT),
  await mainHandler(appConfig_LILI),
  await mainHandler(appConfig_EARL),
  await mainHandler(appConfig_BITTU),
]);

generateAnnouncement();
async function setupFiles() {
  if (!fs.existsSync(".data/db.json")) {
    const dbfile = fs.readFileSync("src/data/db.json", "utf8");
    fs.writeFileSync(".data/db.json", dbfile);
    console.log("DB file created", dbfile);
  }
}
