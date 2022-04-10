#!/usr/bin/node

import {papersDirectory, pdfReader} from "./config.js";
import {execa} from "execa";
import {join} from "node:path";
import fs from "node:fs";
import url from "node:url";
import {idToPath, downloadFile, notify} from "./utils.js";

async function openPdf({id, page = 0}) {
  const path = await idToPath(id);
  console.log(id, path);
  if (pdfReader == 'zathura')
    return await execa(pdfReader, [path, "-P", page]);
  if (pdfReader == 'evince')
    return await execa(pdfReader, ["--page-index", page, path]);

  try {
    await execa(pdfReader, [path, "-p", page]);
  } catch (e) {
    try {
      await execa(pdfReader, [path, "-p", page]);
    } catch (e) {}
  }
}

async function downloadArxiv({authors: authorsStr, title, download}) {
  notify('Downloading ' + title);
  const allAuthors = authorsStr.split(",").map(lastNameFirst);
  const authors = allAuthors.slice(0, 5);

  const path = join(
    papersDirectory,
    title + " -- " + authors + ".pdf"
  );

  // check if file exists.

  // only if it exists!
  await downloadFile(download + ".pdf", path);
  await execa("exiftool", [
    "-overwrite_original_in_place",
    `-Title=${title}`,
    `-Author=${allAuthors.join(", ")}`,
    path,
  ]);

  execa(pdfReader, [path]);
}

function lastNameFirst(author) {
  const splitted = author.split(" ");
  const last = splitted[splitted.length - 1];
  const rest = splitted.slice(0, -1);
  return [last, ...rest].join(" ").replace(".", "");
}

async function handle(host, query) {
  if (host == "open-paper") {
    openPdf(query);
  }

  if (host == "download-arxiv") {
    downloadArxiv(query);
  }
}

const args = process.argv;
const parsed = url.parse(args[2], true);
const {host, query} = parsed;

handle(host, query);

// or follow:
// https://askubuntu.com/questions/514125/url-protocol-handlers-in-basic-ubuntu-desktop
// go to .local/share/applications
// Add to phd.desktop:
// [Desktop Entry]
// Name=Phd helper
// Exec=phd-protocol-handler
// Icon=emacs-icon
// Type=Application
// Terminal=false
// MimeType=x-scheme-handler/phd;
//
// xdg-mime default phd.desktop x-scheme-handler/phd
//sudo update-desktop-database
//
// In firefox, maybe have to go to settings and then select 'use phd-protocol-handler for dealing with phd protocol
//
//
//
//
// ==UserScript==
// @name         ArXiv add to library
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://arxiv.org/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
//
// (function() {
//     'use strict';
//   const download = document.querySelector('.download-pdf').href
//   const title = document.querySelector('.title').textContent.replace(/^Title:/, '')
//   const authors = [...document.querySelectorAll('.authors a')].map(a => a.textContent)
//   const query = new URLSearchParams({title, download, authors});
//   const url = 'phd://download-arxiv/test?' + query
//   const list = document.querySelector('.extra-services .full-text ul')
//   const li = document.createElement('li')
//   const a = document.createElement('a')
//   a.target = '_blank'
//   a.innerHTML = 'Add to library'
//   a.href = url
//   li.appendChild(a)
//   list.appendChild(li)
// })();
