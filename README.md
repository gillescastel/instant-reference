# Instant Reference

This repository complements [my blog post on my Mathematics PhD research workflow](https://castel.dev/post/research-workflow).

Pdf reference:

![pdf-reference](https://user-images.githubusercontent.com/7069691/162628728-099034c5-378b-421b-bbac-4cf35ab089aa.gif)

Url reference:

![url-reference](https://user-images.githubusercontent.com/7069691/162628882-309c98d0-5e66-4565-a9ed-a60975337317.gif)


## Installing 

First install dependencies by running

```
sudo apt install xclip exiftool xdotool x11-utils zenity xsel
```

Then clone this repository into a directory.
```bash
cd directory
git clone https://github.com/gillescastel/instant-reference
cd instant-reference
npm install
```


Then add this directory to your PATH by adding the following line to the bottom of your `~/.profile` file:

```bash
export PATH="/home/username/path/to/directory/instant-reference:$PATH"
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

In `config.js` located in `instant-reference`, change the `pdfViewer` to the one you use (in Ubuntu, the default is evince).

### Installing the 'Add to library button' (optional)

![arxiv2](https://user-images.githubusercontent.com/7069691/162634543-b7d6b4ee-e102-4799-8207-16e3cd1db865.png)

Install a userscripts manager add-on for your browser, for example Tampermonkey ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)).
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

**Change download location by editing `config.js` (located in the `instant-reference` directory) and changing the value of `papersDirectory`.** Be sure to create the directory.

If you get errors using Firefox, try this.
Go to `about:config` and add the following settings:

```
network.protocol-handler.app.phd	/home/username/path/to/directory/phd-protocol-handler.js	
network.protocol-handler.expose.phd	false	
network.protocol-handler.external.phd	true
```

Then once you click a `phd://` link it will ask you to how to open these kind of links. Specify the protocol handler located at `/home/username/path/to/directory/phd-protocol-handler.js` and click on 'Don't ask next time'.


### Setting up the shortcut

Using your preferred shortcut manager (E.g. Settings > Keyboard Shortcuts in Ubuntu), add a shortcut that executes 
`/home/username/path/to/directory/copy-reference.js`.

When you press this shortcut, the script will copy a bit of LaTeX code for you to paste in your editor.
By adding the following definition of `\pdfref` to your preamble, the copied LaTeX snippet will transform in a clickable link, and upon clicking on it, the custom protocol handler will open the document at the correct page.

```tex
\usepackage{hyperref}
\hypersetup{hidelinks}
\usepackage{xifthen}
\usepackage{fontawesome}

\newcommand\urlref[2]{%
    \href{#1}{\raisebox{0.15ex}{\scriptsize \faLink}\:\textup{\textbf{#2}}}%
}

\newcommand\pdfref[3]{%
    \href{phd://open-paper?id=#1&page=#2}{%
    \textup{[\textbf{\ifthenelse{\isempty{#3}}{here}{#3}}]}}%
}
```

The first argument of `\pdfref` is the id of the document, the second the page number and the third the title, which is by default the title of the pdf, which you can change by running
  
```bash
exiftool -overwrite_original_in_place -Title="New title" document.pdf
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


## Debugging

To debug the protocol handler, run the following and have a look at the output. This should download 'Ricci flow with surgery on three-manifolds' to your preferred download location.

```bash
./phd-protocol-handler.js "phd://download-arxiv/test?title=Ricci+flow+with+surgery+on+three-manifolds&download=https%3A%2F%2Farxiv.org%2Fpdf%2Fmath%2F0303109&authors=Grisha+Perelman"
```

For the reference shortcut, run

```bash
sleep 2; ./copy-reference.js
```

Within two second, move activate your pdf reader and have a look at the output.
