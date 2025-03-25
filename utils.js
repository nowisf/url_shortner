import Chance from "chance";
import { db } from "./db.js";

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

function randomString(length) {
  const chance = new Chance();

  const string = chance.string({
    length: length,
    pool: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  });
  console.log(`string: ${string}`);
  return string;
}

function newPathUrl() {
  const short_url = randomString(5);
  const stmt = db.prepare("SELECT short_url FROM urls WHERE short_url = ?");
  const result = stmt.get(short_url);
  if (result) {
    return newPathUrl();
  }
  return short_url;
}

export { isURL, newPathUrl };
