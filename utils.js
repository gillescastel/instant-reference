import https from "node:https";
import fs from "node:fs/promises";
import fsn from "node:fs";
import {join} from "node:path";
import {execa, execaCommand, execaCommandSync} from "execa";

export const copy = (str) =>
  execaCommand("xsel --input --clipboard", {
    input: str,
  });

export const wait = async (ms) => new Promise((res) => setTimeout(res, ms));
export const press = async (key) => execa("xdotool", ["key", key]);
export const notify = (str) => execa("notify-send", [str]);

export const ask = async (question) => {
  try {
    const {stdout} = await execa('zenity', ['--entry', '--text', question]);
    return stdout.trim()
  } catch (e) {}

  console.log('Please install zenity');
  return null
}

export const downloadFile = (url, path) => {
  return new Promise((done, rej) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0",
        },
      },
      (res) => {
        const writeStream = fsn.createWriteStream(path);
        res.pipe(writeStream);

        writeStream.on("finish", () => {
          writeStream.close();
          done();
        });
      }
    );
  });
};

export const idToPath = async (id) => {
  const db = new URL("./ids.json", import.meta.url);
  let ids = [];
  try {
    ids = JSON.parse(await fs.readFile(db));
  } catch (e) {}
  const result = ids.find(([i, p]) => i == id);
  return result ? result[1] : null;
};

export const pathToId = async (path) => {
  const db = new URL("./ids.json", import.meta.url);
  let ids = [];
  try {
    ids = JSON.parse(await fs.readFile(db));
  } catch (e) {}

  const existing = ids.find(([id, p]) => p === path);
  if (existing) return existing[0];

  const unique = (option) => !ids.find(([id, p]) => id === option);
  let id;
  while (!id || !unique(id)) {
    id = await ask('New file. Please give it a unique id.')
    if (!id) return null;
  }

  ids.push([id, path]);
  await fs.writeFile(db, JSON.stringify(ids, null, 2));
  return id;
};
