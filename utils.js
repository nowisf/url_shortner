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
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
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
