/** @license
 DJSON Viewer and Formatter | MIT License
 Copyright 2017 Dario De Santis

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do
 so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

(function () {

    "use strict";

    var obj,
        path,
        numChildClasses,
        lineNumber,
        fns = {
            copyPath: function () {
                copy(path)
            },
            copyValue: function() {
                if(path && path.length > 1 && obj) {
                    var prop = path.substring(1);
                    if(path.charAt(1) === "."){
                        prop = prop.substring(1);
                    }
                    var result = Object.byString(obj, prop);
                    if(typeof result === "object"){
                        result = JSON.stringify(Object.byString(obj, prop));
                    }
                    copy(result);
                }
            },
            copyKey: function () {
                if(path && path.length > 1) {
                    if(path.slice(-1) === "]") {
                        path = path.replace(/\[\d\]$/, '');
                    }
                    if(path.length > 1) {
                        copy(path.substring(path.lastIndexOf(".") + 1));
                    }
                }
            },
            _viewJSON: function (info, stripSlashes) {
                if(typeof info.selectionText === "undefined") return;
                var str = info.selectionText;
                if(!str || str.length === 0) return;
                try {
                    if(stripSlashes) {
                        str = str.replace(/\\(.)/mg, "$1");
                    }
                    if( typeof JSON.parse(str) === "undefined" ) return;
                    openJsonTab(str);
                } catch (e) {}
            },
            viewJSON: function (info) {
                this._viewJSON(info, false);
            },
            viewStripedJSON: function (info) {
                this._viewJSON(info, true);
            },
            copyMD5: function(info) {
                if(typeof info.selectionText === "undefined") return;
                var str = info.selectionText;
                if(!str || typeof str !== "string" || str.length === 0) return;
                try {
                    str = md5(str).toLowerCase();
                    copy(str);
                } catch (e) {}
            }
        };

    // Constants
    var
        TYPE_STRING = 1,
        TYPE_NUMBER = 2,
        TYPE_OBJECT = 3,
        TYPE_ARRAY = 4,
        TYPE_BOOL = 5,
        TYPE_NULL = 6
        ;

    // Utility functions
    function removeComments(str) {
        str = ('__' + str + '__').split('');
        var mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false
        };
        for (var i = 0, l = str.length; i < l; i++) {
            if (mode.regex) {
                if (str[i] === '/' && str[i - 1] !== '\\') {
                    mode.regex = false;
                }
                continue;
            }
            if (mode.singleQuote) {
                if (str[i] === "'" && str[i - 1] !== '\\') {
                    mode.singleQuote = false;
                }
                continue;
            }
            if (mode.doubleQuote) {
                if (str[i] === '"' && str[i - 1] !== '\\') {
                    mode.doubleQuote = false;
                }
                continue;
            }
            if (mode.blockComment) {
                if (str[i] === '*' && str[i + 1] === '/') {
                    str[i + 1] = '';
                    mode.blockComment = false;
                }
                str[i] = '';
                continue;
            }
            if (mode.lineComment) {
                if (str[i + 1] === '\n' || str[i + 1] === '\r') {
                    mode.lineComment = false;
                }
                str[i] = '';
                continue;
            }
            if (mode.condComp) {
                if (str[i - 2] === '@' && str[i - 1] === '*' && str[i] === '/') {
                    mode.condComp = false;
                }
                continue;
            }
            mode.doubleQuote = str[i] === '"';
            mode.singleQuote = str[i] === "'";
            if (str[i] === '/') {
                if (str[i + 1] === '*' && str[i + 2] === '@') {
                    mode.condComp = true;
                    continue;
                }
                if (str[i + 1] === '*') {
                    str[i] = '';
                    mode.blockComment = true;
                    continue;
                }
                if (str[i + 1] === '/') {
                    str[i] = '';
                    mode.lineComment = true;
                    continue;
                }
                mode.regex = true;
            }
        }
        return str.join('').slice(2, -2);
    }

    function firstJSONCharIndex(s) {
        var arrayIdx = s.indexOf('['),
            objIdx = s.indexOf('{'),
            idx = 0
            ;
        if (arrayIdx !== -1) {
            idx = arrayIdx;
        }
        if (objIdx !== -1) {
            if (arrayIdx === -1) {
                idx = objIdx;
            } else {
                idx = Math.min(objIdx, arrayIdx);
            }
        }
        return idx;
    }

    // Template elements
    var baseSpan = document.createElement('span');

    function getSpanBoth(innerText, className) {
        var span = baseSpan.cloneNode(false);
        span.className = className;
        span.innerText = innerText;
        return span;
    }

    function getSpanClass(className) {
        var span = baseSpan.cloneNode(false);
        span.className = className;
        return span;
    }

    // Create template nodes
    var templatesObj = {
        t_dObj: getSpanClass('dObj'),
        t_exp: getSpanClass('expander'),
        t_key: getSpanClass('key'),
        t_string: getSpanClass('s'),
        t_number: getSpanClass('n'),
        t_nested: getSpanClass('nested'),

        t_null: getSpanBoth('null', 'nl'),
        t_true: getSpanBoth('true', 'bl'),
        t_false: getSpanBoth('false', 'bl'),

        t_oBrace: getSpanBoth('{', 'b'),
        t_cBrace: getSpanBoth('}', 'b lastB'),
        t_oBracket: getSpanBoth('[', 'b'),
        t_cBracket: getSpanBoth(']', 'b lastB'),

        t_ellipsis: getSpanClass('ellipsis'),
        t_blockInner: getSpanClass('blockInner'),

        t_colonAndSpace: document.createTextNode(':\u00A0'),
        t_commaText: document.createTextNode(','),
        t_dblqText: document.createTextNode('"')
    };

    // Core recursive DOM-building function
    function getdObjDOM(value, keyName, startCollapsed, isRoot, hideLineNumber) {
        var type,
            dObj,
            nonZeroSize,
            templates = templatesObj, // bring into scope for tiny speed boost
            objKey,
            keySpan,
            valueElement,
            dObjChildLength = 0
            ;

        // Establish value type
        if (typeof value === 'string') {
            type = TYPE_STRING;
        } else if (typeof value === 'number') {
            type = TYPE_NUMBER;
        } else if (value === false || value === true) {
            type = TYPE_BOOL;
        } else if (value === null) {
            type = TYPE_NULL;
        } else if (value instanceof Array) {
            type = TYPE_ARRAY;
        } else {
            type = TYPE_OBJECT;
        }

        // Root node for this dObj
        dObj = templates.t_dObj.cloneNode(false);
        if (!hideLineNumber) {
            dObj.setAttribute('line-number', lineNumber++);
        }

        // Add an 'expander' first (if this is object/array with non-zero size)
        if (type === TYPE_OBJECT || type === TYPE_ARRAY) {
            nonZeroSize = false;
            for (objKey in value) {
                if (value.hasOwnProperty(objKey)) {
                    nonZeroSize = true;
                    break; // no need to keep counting; only need one
                }
            }
            if (nonZeroSize) {
                dObj.appendChild(templates.t_exp.cloneNode(false));
            }
        }

        // If there's a key, add that before the value
        if (keyName !== false) { // NB: "" is a legal keyname in JSON
            // This dObj must be an object property
            dObj.classList.add('dObjProp');
            // Create a span for the key name
            keySpan = templates.t_key.cloneNode(false);
            keySpan.textContent = JSON.stringify(keyName).slice(1, -1); // remove quotes
            // Add it to dObj, with quote marks
            dObj.appendChild(templates.t_dblqText.cloneNode(false));
            dObj.appendChild(keySpan);
            dObj.appendChild(templates.t_dblqText.cloneNode(false));
            // Also add ":&nbsp;" (colon and non-breaking space)
            dObj.appendChild(templates.t_colonAndSpace.cloneNode(false));
        }
        else {
            // This is an array element instead
            dObj.classList.add('arrElem');
        }

        // Generate DOM for this value
        var blockInner, childdObj;
        switch (type) {
            case TYPE_STRING:
                // If string is a URL, get a link, otherwise get a span
                var innerStringEl = baseSpan.cloneNode(false),
                    escapedString = JSON.stringify(value)
                    ;
                escapedString = escapedString.substring(1, escapedString.length - 1); // remove quotes
                if (value.charAt(0) === 'h' && value.substring(0, 4) === 'http') { // crude but fast - some false positives, but rare, and UX doesn't suffer terribly from them.
                    var innerStringA = document.createElement('A');
                    innerStringA.href = value;
                    innerStringA.innerText = escapedString;
                    innerStringEl.appendChild(innerStringA);
                }
                else {
                    innerStringEl.innerText = escapedString;
                }
                valueElement = templates.t_string.cloneNode(false);
                valueElement.appendChild(templates.t_dblqText.cloneNode(false));
                valueElement.appendChild(innerStringEl);
                valueElement.appendChild(templates.t_dblqText.cloneNode(false));

                // check if is nested json
                try {
                    if( (value.charAt(0) === '{' || value.charAt(0) === '[') && typeof JSON.parse(escapedString.replace(/\\(.)/mg, "$1")) !== "undefined" ) {
                        valueElement.appendChild(templates.t_nested.cloneNode(false));
                    }
                } catch (e){}

                dObj.appendChild(valueElement);
                break;

            case TYPE_NUMBER:
                // Simply add a number element (span.n)
                valueElement = templates.t_number.cloneNode(false);
                valueElement.innerText = value;
                dObj.appendChild(valueElement);
                break;

            case TYPE_OBJECT:
                // Add opening brace
                dObj.appendChild(templates.t_oBrace.cloneNode(true));
                // If any properties, add a blockInner containing k/v pair(s)
                if (nonZeroSize) {
                    // Add ellipsis (empty, but will be made to do something when dObj is collapsed)
                    dObj.appendChild(templates.t_ellipsis.cloneNode(false));
                    // Create blockInner, which indents (don't attach yet)
                    blockInner = templates.t_blockInner.cloneNode(false);
                    // For each key/value pair, add as a dObj to blockInner
                    var count = 0, k, comma;
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            count++;
                            childdObj = getdObjDOM(value[k], k, startCollapsed, false, hideLineNumber);
                            // Add comma
                            comma = templates.t_commaText.cloneNode(false);
                            childdObj.appendChild(comma);
                            blockInner.appendChild(childdObj);
                        }
                    }
                    dObjChildLength = count;
                    // Now remove the last comma
                    childdObj.removeChild(comma);
                    // Add blockInner
                    dObj.appendChild(blockInner);
                }

                // Add closing brace
                var closingBrace = templates.t_cBrace.cloneNode(true);
                if (nonZeroSize) {
                    closingBrace.setAttribute('line-number', lineNumber++);
                }
                dObj.appendChild(closingBrace);
                break;

            case TYPE_ARRAY:
                // Add opening bracket
                dObj.appendChild(templates.t_oBracket.cloneNode(true));
                // If non-zero length array, add blockInner containing inner vals
                if (nonZeroSize) {
                    // Add ellipsis
                    dObj.appendChild(templates.t_ellipsis.cloneNode(false));
                    // Create blockInner (which indents) (don't attach yet)
                    blockInner = templates.t_blockInner.cloneNode(false);
                    // For each key/value pair, add the markup
                    dObjChildLength = value.length;
                    for (var i = 0, lastIndex = dObjChildLength - 1; i < dObjChildLength;
                         i++) {
                        // Make a new dObj, with no key
                        childdObj = getdObjDOM(value[i], false, startCollapsed, false, hideLineNumber);
                        // Add comma if not last one
                        if (i < lastIndex) {
                            childdObj.appendChild(templates.t_commaText.cloneNode(false));
                        }
                        // Append the child dObj
                        blockInner.appendChild(childdObj);
                    }
                    // Add blockInner
                    dObj.appendChild(blockInner);
                }
                // Add closing bracket
                var closingBrace = templates.t_cBrace.cloneNode(true);
                if (nonZeroSize) {
                    closingBrace.setAttribute('line-number', lineNumber++);
                }
                dObj.appendChild(closingBrace);
                break;

            case TYPE_BOOL:
                if (value) {
                    dObj.appendChild(templates.t_true.cloneNode(true));
                } else {
                    dObj.appendChild(templates.t_false.cloneNode(true));
                }
                break;

            case TYPE_NULL:
                dObj.appendChild(templates.t_null.cloneNode(true));
                break;
        }

        if (dObjChildLength > 0) {
            if(typeof startCollapsed !== "undefined" && startCollapsed != null && !isRoot) {
                dObj.classList.add('collapsed');
            }
            dObj.classList.add('numChild' + dObjChildLength);
            numChildClasses[dObjChildLength] = 1;
        }

        return dObj;
    }

    // Function to convert object to an HTML string
    function jsonObjToHTML(obj, jsonpFunctionName, startCollapsed, hideLineNumber) {

        lineNumber = jsonpFunctionName === null ? 1 : 2;

        // reset number of children
        numChildClasses = {};

        // Format object (using recursive dObj builder)
        var rootDObj = getdObjDOM(obj, false, startCollapsed, true, hideLineNumber);

        // The whole DOM is now built.

        // Set class on root node to identify it
        rootDObj.classList.add('rootDObj');

        // create gutter for lineNumbers
        var gutterWidth = 1 + (lineNumber.toString().length * 0.5) + 'rem';
        var gutter = document.createElement('div');
        gutter.id = 'gutter';
        gutter.style.width = gutterWidth;

        // Make div#formattedJson and append the root dObj
        var divFormattedJson = document.createElement('DIV');
        divFormattedJson.id = 'formattedJson';
        if (!hideLineNumber) {
            divFormattedJson.style.marginLeft = gutterWidth;
        }
        divFormattedJson.appendChild(rootDObj);

        // Top and tail with JSONP padding if necessary
        if (jsonpFunctionName !== null) {
            divFormattedJson.innerHTML =
                '<div id="jsonpOpener" ' + (!hideLineNumber ? ' line-number="1"' : '') +'>' + jsonpFunctionName + ' ( </div>' +
                divFormattedJson.innerHTML +
                '<div id="jsonpCloser" ' + (!hideLineNumber ? ' line-number="' + lineNumber + '"' : '') +'>)</div>';
        }

        // Return the HTML
        return (!hideLineNumber ? gutter.outerHTML : '') + divFormattedJson.outerHTML;
    }

    function copy(value) {
        if (typeof value === "boolean" || (value && (typeof value === "number" || value.length > 0))) {
            var selElement, selRange, selection;
            selElement = document.createElement("span");
            selRange = document.createRange();
            selElement.innerText = value;
            document.body.appendChild(selElement);
            selRange.selectNodeContents(selElement);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(selRange);
            document.execCommand("Copy");
            document.body.removeChild(selElement);
        }
    }

    function createContextMenu() {
        var swallowErorrs = function(){
            var err = chrome.runtime.lastError;
            if(err && err.hasOwnProperty('message') && err.message.indexOf('Cannot create item with duplicate id') === -1) {
                console.warn('Context menu error ignored:', err);
            }
        };

        chrome.contextMenus.create({
            title : "DJSON",
            id: "djson",
            contexts : [ "page", "selection", "link" ]
        }, swallowErorrs);

        chrome.contextMenus.create({
            title : "Copy Value",
            id: "copyValue",
            parentId: "djson",
            contexts : [ "page", "selection", "link" ]
        }, swallowErorrs);

        chrome.contextMenus.create({
            title : "Copy Key",
            id: "copyKey",
            parentId: "djson",
            contexts : [ "page", "selection", "link" ]
        }, swallowErorrs);

        chrome.contextMenus.create({
            title : "Copy Path",
            id: "copyPath",
            parentId: "djson",
            contexts : [ "page", "selection", "link" ]
        }, swallowErorrs);

        chrome.contextMenus.create({
            title : "View JSON",
            id: "viewJSON",
            parentId: "djson",
            contexts : [ "selection" ]
        }, swallowErorrs);

        chrome.contextMenus.create({
            title : "View JSON (Strip slashes)",
            id: "viewStripedJSON",
            parentId: "djson",
            contexts : [ "selection" ]
        }, swallowErorrs);

        chrome.contextMenus.create({
            title : "Copy MD5",
            id: "copyMD5",
            parentId: "djson",
            contexts : [ "selection" ]
        }, swallowErorrs);
    }

    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        fns[info.menuItemId](info);
    });

    function openJsonTab(json) {
        var viewTabUrl = chrome.extension.getURL('json.html');
        chrome.tabs.query({active: true}, function (tabs) {
            var index = tabs[0].index;
            chrome.tabs.create({url: viewTabUrl, active: true, index: index + 1}, function (tab) {
                setTimeout(function(){chrome.tabs.sendMessage(tab.id, {json: json})}, 500);
            });
        });
    }

    // Listen for requests from content pages wanting to set up a port
    chrome.extension.onConnect.addListener(function (port) {

        if (port.name !== 'djson') {
            console.log('DJSON Viewer error - unknown port name ' + port.name, port);
            return;
        }

        port.onMessage.addListener(function (msg) {
            var jsonpFunctionName = null,
                validJsonText
                ;

            if (msg.type === 'OPEN JSON TAB') {
                openJsonTab(msg.json);
            }

            else if (msg.type === 'OPEN OPTION TAB') {
                var viewTabUrl = chrome.extension.getURL('options.html');
                chrome.tabs.query({url: viewTabUrl, currentWindow: true}, function (tabs) {
                    var tabLenght = tabs.length;
                    if (tabLenght > 0) {
                        chrome.tabs.update(tabs[0].id, {'active': true});
                    } else {
                        chrome.tabs.query({active: true}, function (tabs) {
                            var index = tabs[0].index;
                            chrome.tabs.create({url: viewTabUrl, active: true, index: index + 1});
                        });
                    }
                });
            }

            else if (msg.type === 'VIEW NESTED') {
                var prop = msg.path.substring(1);
                if(msg.path.charAt(1) === "."){
                    prop = prop.substring(1);
                }
                var result = Object.byString(msg.obj, prop);
                openJsonTab(result);
            }

            else if (msg.type === 'SENDING TEXT') {
                // Try to parse as JSON
                var text = msg.text;

                // Strip any leading garbage, such as a 'while(1);'
                var strippedText = text.substring(firstJSONCharIndex(text));

                try {
                    obj = JSON.parse(strippedText);
                    validJsonText = strippedText;
                }
                catch (e) {

                    // Not JSON; could be JSONP though.
                    // Try stripping 'padding' (if any), and try parsing it again
                    text = text.trim();
                    // Find where the first paren is (and exit if none)
                    var indexOfParen;
                    if (!(indexOfParen = text.indexOf('(') )) {
                        port.postMessage(['NOT JSON', 'no opening parenthesis']);
                        port.disconnect();
                        return;
                    }

                    // Get the substring up to the first "(", with any comments/whitespace stripped out
                    var firstBit = removeComments(text.substring(0, indexOfParen)).trim();
                    if (!firstBit.match(/^[a-zA-Z_$][\.\[\]'"0-9a-zA-Z_$]*$/)) {
                        // The 'firstBit' is NOT a valid function identifier.
                        port.postMessage(['NOT JSON', 'first bit not a valid function name']);
                        port.disconnect();
                        return;
                    }

                    // Find last parenthesis (exit if none)
                    var indexOfLastParen;
                    if (!(indexOfLastParen = text.lastIndexOf(')') )) {
                        port.postMessage(['NOT JSON', 'no closing paren']);
                        port.disconnect();
                        return;
                    }

                    // Check that what's after the last parenthesis is just whitespace, comments, and possibly a semicolon (exit if anything else)
                    var lastBit = removeComments(text.substring(indexOfLastParen + 1)).trim();
                    if (lastBit !== "" && lastBit !== ';') {
                        port.postMessage(
                            ['NOT JSON', 'last closing paren followed by invalid characters']);
                        port.disconnect();
                        return;
                    }

                    // So, it looks like a valid JS function call, but we don't know whether it's JSON inside the parentheses...
                    // Check if the 'argument' is actually JSON (and record the parsed result)
                    text = text.substring(indexOfParen + 1, indexOfLastParen);
                    try {
                        obj = JSON.parse(text);
                        validJsonText = text;
                    }
                    catch (e2) {
                        // Just some other text that happens to be in a function call.
                        // Respond as not JSON, and exit
                        port.postMessage(['NOT JSON',
                                          'looks like a function call, but the parameter is not valid JSON']);
                        return;
                    }

                    jsonpFunctionName = firstBit;
                }

                // If still running, we now have obj, which is valid JSON.

                // Ensure it's not a number or string (technically valid JSON, but no point prettifying it)
                if (typeof obj !== 'object') {
                    port.postMessage(['NOT JSON', 'technically JSON but not an object or array']);
                    port.disconnect();
                    return;
                }

                // And send it the message to confirm that we're now formatting (so it can show a spinner)
                port.postMessage(['FORMATTING', JSON.stringify(localStorage)]);

                // Do formatting
                var startCollapsed = localStorage.getItem('startCollapsed') || (localStorage.getItem('startCollapsedIfBig') && text.length > 1000000);
                var html = jsonObjToHTML(obj, jsonpFunctionName, localStorage.getItem('startCollapsed'), localStorage.getItem('hideLineNumbers'));

                // Post the HTML string to the content script
                port.postMessage(['FORMATTED', html, validJsonText, JSON.stringify(localStorage), JSON.stringify(Object.keys(numChildClasses))]);
            }

            else if (msg.type === 'COPY PATH') {
                path = msg.path;
                obj = msg.obj;
            } else if (msg.type === 'MD5 STRING') {
                fns.copyMD5({"selectionText" :msg.string});
            }

        });
    });

    // on app update show change log
    chrome.runtime.onInstalled.addListener(function(details) {
        if(details.reason === "update") {
            chrome.tabs.create({url: chrome.extension.getURL('changelog.html'), active: true});
        }
    });

    createContextMenu();

    Object.byString = function(o, s) {
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (k in o) {
                o = o[k];
            } else {
                return;
            }
        }
        return o;
    };

    function md5(d){return rstr2hex(binl2rstr(binl_md5(rstr2binl(d),8*d.length)))}function rstr2hex(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function rstr2binl(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function binl2rstr(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function binl_md5(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_};
}());