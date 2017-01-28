![JSONViewer Logo](https://github.com/dardesantis/DJSON-Viewer/raw/master/extension/images/128.png)

DJSON Viewer
==============

Chrome extension for printing and formatting JSON and JSONP nicely when you visit it 'directly' in a browser tab.
Initial base from [callumlocke json-formatter](https://github.com/callumlocke/json-formatter): 

Features
--------

* Format JSON and JSONP responses
* Minify or Beautify JSON
* Syntax highlighting
* Collapsible trees, with indent guides
* Recursive collapsible elements
* Clickable URLs
* Toggle between raw and parsed JSON
* Works on any valid JSON page – URL doesn't matter
* Works on local files too (if you enable this in `chrome://extensions`)
* You can inspect the JSON by typing `json` in the console
* Counts items and properties in a collection

A background worker is used to prevent the UI freezing when processing very long JSON pages.

Installation
------------

**Option 1** – Install through Chrome Web Store

[![https://chrome.google.com/webstore/detail/djson-viewer/chaeijjekipecdajnijdldjjipaegdjc](https://github.com/dardesantis/DJSON-Viewer/raw/master/chromestore.png)](https://chrome.google.com/webstore/detail/djson-viewer/chaeijjekipecdajnijdldjjipaegdjc)

**Option 2** – install it using the packed version:
* clone/download this repo or just download the file djson-viewer.crx,
* open Chrome and go to `chrome://chrome/extensions/`,
* drag the `djson-viewer.crx` into Chrome
* accept to install the extension

**Option 3** – install it from source:

* clone/download this repo,
* open Chrome and go to `chrome://chrome/extensions/`,
* enable "Developer mode",
* click "Load unpacked extension",
* select the `extension` folder in this repo.

Pro Tip
------------
* Hold down control (or cmd on Mac) while collapsing a tree if you want to collapse all its siblings too.
* Hold down shift while collapsing a tree if you want to collapse also all his children

FAQ
---

### Why are large numbers not displayed accurately?

This is a [limitation of JavaScript](http://www.ecma-international.org/ecma-262/5.1/#sec-15.7.3.2) (and therefore JSON). The largest possible number is `Number.MAX_SAFE_INTEGER`, or **9007199254740991**. If you try to use a number larger than this in JavaScript/JSON, you'll lose accuracy.

The idea of JSON Formatter is to show you how the computer sees your JSON, so we don't attempt to circumvent this limitation, otherwise that would give a misleading representation of your data. It's better to see exactly what V8 sees.

If you want to use long sequences of digits in your JSON, then **quote them as strings**.

### Why are object keys sometimes in the wrong order?

What you see in JSON Formatter is a representation of the **parsed** object/array. You see what V8 sees.

Plain JavaScript objects are [unordered collections of properties](http://www.ecma-international.org/ecma-262/5.1/#sec-12.6.4). If you go through them with `for...in`, for example, there is no guarantee of any particular order. In practice, most engines maintain the order in which the keys were first declared, but V8 moves any numeric keys (e.g. `"1234"`) to the front, for a small performance gain. This was a [controversial issue](https://code.google.com/p/v8/issues/detail?id=164) – a lot of people think it sucks that you can't predict key enumeration order in Chrome – but the V8 team refused to 'fix' it, because it's not a bug, and they're right. If you want your values to be in a certain order, and you're relying on the non-standard key-ordering logic of a particular engine, then your code is broken. Restructure your data to use arrays.

##### But I just want it to be in order for readability

That would require manually parsing the JSON string with regular expressions (instead of using `JSON.parse`), which would be too slow. And it's not a good idea to go down the road of representing the data differently from how the engine actually sees it.