# PhD workflow and Instant Pdf referencing 

This repository complements [my blog post on my PhD and referencing workflow](https://castel.dev/post/phd-workflow).


## Installing 

First install dependencies by running

```
sudo apt install xclip exiftool xdotool x11-utils zenity rofi
```

Then clone this repository into a directory.
```bash
cd directory
git clone https://github.com/gillescastel/instant-pdf-referencing
cd instant-pdf-referencing
npm install
```


Then add this directory to your PATH by adding the following to your `~/.profile`:
```bash
export PATH="/home/username/path/to/directory:$PATH"
```

You might need to log out and log in for this to work.

### Installing the protocol

Install the `phd` protocol by creating a file located at `~/.local/share/applications/phd.desktop` containing:

```ini
[Desktop Entry]
Name=Phd helper
Exec=phd-protocol-handler.js %u
Icon=emacs-icon
Type=Application
Terminal=false
MimeType=x-scheme-handler/phd;
```

Then run the following to register it
```bash
sudo update-desktop-database
xdg-mime default phd.desktop x-scheme-handler/phd
```

### Installing the 'Add to library button'

Install a userscripts manager add-on for your browser, for example Tampermonkey (
[Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)).
Then add the following userscript:
```javascript
// ==UserScript==
// @name         ArXiv add to library
// @version      0.1
// @description  Add a button to ArXiv to add a paper to your library
// @match        https://arxiv.org/*

// ==/UserScript==

(function() {
    'use strict';
    const download = document.querySelector('.download-pdf').href
    const title = document.querySelector('.title').textContent.replace(/^Title:/, '')
    const authors = [...document.querySelectorAll('.authors a')].map(a => a.textContent)
    const query = new URLSearchParams({title, download, authors});
    const url = 'phd://download-arxiv/download?' + query
    const list = document.querySelector('.extra-services .full-text ul')
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.target = '_blank'
    a.innerHTML = 'Add to library'
    a.href = url
    li.appendChild(a)
    list.appendChild(li)
})();
```

So this simply adds a link to ArXiv with url `phd://download-arxiv/download?title=Title&authors=&Authors&download=pdfUrl`. When you click on it the custom protocol handler takes over and downloads the file.

Finally, change download location by editing `config.js` and changing the value of `papersDirectory`.

If you get errors using Firefox, try this.
Go to `about:config` and add the following settings:

```
network.protocol-handler.app.phd	/home/username/path/to/directory/phd-protocol-handler.js	
network.protocol-handler.expose.phd	false	
network.protocol-handler.external.phd	true
```

Then once you click a `phd://` link it will ask you to how to open these kind of links. Specify the protocol handler located at `/home/username/path/to/directory/phd-protocol-handler.js` and click on 'Don't ask next time'.


### Setting up the shortcuts.

Using your proffered shortcut manager, add a shortcut that executes 
`node /home/username/path/to/directory/copy-pdf-reference.js`.

When you press this shortcut, the script will copy a bit of LaTeX code for you to paste in your editor.
By adding the following definition of `\pdfref` to your preamble, the copied LaTeX snippet will transform in a clickable link, and upon clicking on it, the custom protocol handler will open the document at the correct page.

```tex
\usepackage{xifthen}
\newcommand\pdfref[3]{%
    \href{phd://open-paper?id=#1&page=#2}{%
    \textup{[\textbf{\ifthenelse{\isempty{#3}}{here}{#3}}]}}%
}
```


## Supported Pdf readers

### Zathura

Zathura is supported out of the box.

### Evince

Evince is also supported, but beware of the following.
First, you need to have gvfs installed and running (the filesystem metadata framework Evince uses to save current page number.) This is by default on Ubuntu.

The snap version of Ubuntu has [some problems](https://gitlab.gnome.org/GNOME/evince/-/issues/1642#note_1409663) with talking to gvfs, so this doesn't work. To fix this, remove it and install a deb-based version:

```bash
sudo snap remove evince
sudo apt install evince
```

You'll probably also need to disable App Armor for Evince to allow it to talk to gvfs. Do this by running:

```
sudo apt install apparmor-utils
sudo aa-complain /usr/bin/evince
```

### Other pdf viewers

Interested in adding support for other pdf viewers? Feel free to add a pull request. Have a look at `get-current-pdf-page.js` to get started.
