/** @license
 DJSON Viewer | MIT License
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

    var djsonContent,
        pre,
        djsonStyleEl,
        slowAnalysisTimeout,
        port,
        buttonPlain,
        buttonFormatted
        ;

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        chrome.tabs.getCurrent(function (tab) {
            if(tab.url == chrome.extension.getURL('json.html')){
                while (document.body.firstChild) {
                    document.body.removeChild(document.body.firstChild);
                }
                var pre = document.createElement('pre');
                pre.id = 'emptyPre';
                pre.innerText = request.json;
                document.body.appendChild(pre);
                ready();
            }
        });
    });

    function connectToPort(){
        // Open the port "djson" now, ready for when we need it
        // console.time('established port') ;
        port = chrome.extension.connect({name: 'djson'});

        // Add listener to receive response from BG when ready
        port.onMessage.addListener(function (msg) {
            // console.log('Port msg received', msg[0], (""+msg[1]).substring(0,30)) ;

            switch (msg[0]) {
                case 'NOT JSON' :
                    pre.hidden = false;
                    document.body.removeChild(djsonContent);
                    break;

                case 'FORMATTING' :
                    // It is JSON, and it's now being formatted in the background worker.

                    // Clear the slowAnalysisTimeout (if the BG worker had taken longer than 1s to respond with an answer to whether or not this is JSON, then it would have fired, unhiding the PRE... But now that we know it's JSON, we can clear this timeout, ensuring the PRE stays hidden.)
                    clearTimeout(slowAnalysisTimeout);

                    // Insert CSS
                    djsonStyleEl = document.createElement('style');
                    djsonStyleEl.id = 'djsonStyleEl';
                    document.head.appendChild(djsonStyleEl);
                    djsonStyleEl.insertAdjacentHTML(
                        'beforeend',
                        'body{-webkit-user-select:text;overflow-y:scroll !important;margin:0;position:relative}pre{white-space:normal;font-size:13px}#optionBar{-webkit-user-select:none;display:block;position:absolute;top:9px;right:17px}#optionBar button{-webkit-border-radius:2px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.1);-webkit-user-select:none;background:-webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);border:1px solid #aaa;color:#444;font-size:12px;margin-bottom:0;min-width:4em;padding:3px 0;position:relative;z-index:10;display:inline-block;width:80px;text-shadow:1px 1px rgba(255,255,255,0.3)}#optionBar button:hover{-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);border-color:#999;color:#222}#optionBar button:focus{outline:0}#optionBar #buttonFormatted:active,#optionBar #buttonPlain:active{-webkit-box-shadow:inset 0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);color:#333}#optionBar #buttonFormatted.selected,#optionBar #buttonPlain.selected{-webkit-box-shadow:inset 0 1px 5px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);color:#333}#optionBar #collapseAll{margin-right:10px}#optionBar #buttonFormatted{margin-left:0;border-top-left-radius:0;border-bottom-left-radius:0}#optionBar #buttonPlain{margin-right:0;border-top-right-radius:0;border-bottom-right-radius:0;border-right:none}#optionBar #rawFormatterContainer{display:none;margin-top:15px}#jsonpOpener,#jsonpCloser{padding:4px 0 0 8px;color:black;margin-bottom:-6px}#jsonpCloser{margin-top:0}#formattedJson{padding-left:28px;padding-top:6px}.dObj{display:block;padding-left:20px;margin-left:-20px;position:relative}.collapsed{white-space:nowrap}.collapsed>.blockInner{display:none}.collapsed>.ellipsis:after{content:"…";font-weight:bold}.collapsed>.ellipsis{margin:0 4px;color:#888}.collapsed .dObj{display:inline}.expander{width:20px;height:18px;display:block;position:absolute;left:-2px;top:1px;z-index:5;background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAD1JREFUeNpiYGBgOADE%2F3Hgw0DM4IRHgSsDFOzFInmMAQnY49ONzZRjDFiADT7dMLALiE8y4AGW6LoBAgwAuIkf%2F%2FB7O9sAAAAASUVORK5CYII%3D") no-repeat center center;opacity:0.15}.collapsed>.expander{-webkit-transform:rotate(-90deg);width:18px;height:20px;left:0;top:0}.expander:hover{opacity:0.35}.expander:active{opacity:0.5}.collapsed .dObj .expander{display:none}.blockInner{display:block;padding-left:24px;border-left:1px dotted #bbb;margin-left:2px}#formattedJson,#jsonpOpener,#jsonpCloser{color:#333;font:13px/18px monospace}#formattedJson{color:#444}.b{font-weight:bold}.s{color:#0B7500;word-wrap:break-word}a:link,a:visited{text-decoration:none;color:inherit}a:hover,a:active{text-decoration:underline;color:#050}.bl,.nl,.n{font-weight:bold;color:#1A01CC}.key{color:black}#formattingMsg{font:13px "Lucida Grande", "Segoe UI", "Tahoma";padding:10px 0 0 8px;margin:0;color:#333}#formattingMsg .loader{position:relative;top:5px;border:4px solid #f3f3f3;border-radius:50%;border-top:4px solid #3498db;width:12px;height:12px;-webkit-animation:spin 1s linear infinite;animation:spin 1s linear infinite;display:inline-block}[hidden]{display:none !important}span{white-space:pre-wrap}@-webkit-keyframes spin{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}'
                    );

                    djsonContent.innerHTML =
                        '<p id="formattingMsg"><span class="loader"></span> Formatting...</p>';

                    var formattingMsg = document.getElementById('formattingMsg');
                    // TODO: set formattingMsg to visible after about 300ms (so faster than this doesn't require it)
                    formattingMsg.hidden = true;
                    setTimeout(function () {
                        formattingMsg.hidden = false;
                    }, 250);

                    // Create option bar
                    var optionBar = document.createElement('div');
                    optionBar.id = 'optionBar';

                    // Create collapse/expand all button
                    var buttonExpand = document.createElement('button');
                    buttonExpand.id = 'expandAll';
                    buttonExpand.innerText = 'Expand All';
                    buttonExpand.addEventListener(
                        'click',
                        function () {
                            expand([document.getElementsByClassName('expander')[0].parentNode], true);
                        }
                    );

                    var buttonCollapse = document.createElement('button');
                    buttonCollapse.id = 'collapseAll';
                    buttonCollapse.innerText = 'Collapse All';
                    buttonCollapse.addEventListener(
                        'click',
                        function () {
                            collapse([document.getElementsByClassName('expander')[0].parentNode], true);
                        }
                    );

                    // Create minify/beutify buttons
                    var minifyRaw = document.createElement('button');
                    minifyRaw.id = 'minifyRaw';
                    minifyRaw.innerText = 'Minify';
                    minifyRaw.addEventListener(
                        'click',
                        function () {
                            var pre = document.getElementsByTagName("pre")[0];
                            pre.innerText = JSON.stringify(window.djson);
                        }
                    );

                    var beautifyRaw = document.createElement('button');
                    beautifyRaw.id = 'beutifyRaw';
                    beautifyRaw.innerText = 'Beautify';
                    beautifyRaw.addEventListener(
                        'click',
                        function () {
                            var pre = document.getElementsByTagName("pre")[0];
                            pre.innerText = JSON.stringify(window.djson, undefined, 4);
                        }
                    );
                    var rawFormatterContainer = document.createElement('div');
                    rawFormatterContainer.id = 'rawFormatterContainer';
                    rawFormatterContainer.appendChild(minifyRaw);
                    rawFormatterContainer.appendChild(beautifyRaw);

                    // Create toggleFormat button
                    buttonPlain = document.createElement('button');
                    buttonFormatted = document.createElement('button');
                    buttonPlain.id = 'buttonPlain';
                    buttonPlain.innerText = 'Raw';
                    buttonFormatted.id = 'buttonFormatted';
                    buttonFormatted.innerText = 'Parsed';
                    buttonFormatted.classList.add('selected');

                    var plainOn = false;
                    buttonPlain.addEventListener(
                        'click',
                        function () {
                            // When plain button clicked...
                            if (!plainOn) {
                                plainOn = true;
                                pre.hidden = false;
                                djsonContent.hidden = true;

                                buttonFormatted.classList.remove('selected');
                                buttonPlain.classList.add('selected');
                                buttonExpand.style.display = 'none';
                                buttonCollapse.style.display = 'none';
                                rawFormatterContainer.style.display = 'block';
                            }
                        },
                        false
                    );

                    buttonFormatted.addEventListener(
                        'click',
                        function () {
                            // When formatted button clicked...
                            if (plainOn) {
                                plainOn = false;
                                pre.hidden = true;
                                djsonContent.hidden = false;

                                buttonFormatted.classList.add('selected');
                                buttonPlain.classList.remove('selected');
                                buttonExpand.style.display = 'inline-block';
                                buttonCollapse.style.display = 'inline-block';
                                rawFormatterContainer.style.display = 'none';
                            }
                        },
                        false
                    );

                    // Put it in optionBar
                    optionBar.appendChild(buttonExpand);
                    optionBar.appendChild(buttonCollapse);
                    optionBar.appendChild(buttonPlain);
                    optionBar.appendChild(buttonFormatted);
                    optionBar.appendChild(rawFormatterContainer);

                    // Attach event handlers
                    document.addEventListener(
                        'click',
                        generalClick,
                        false // No need to propogate down
                    );

                    // Put option bar in DOM
                    document.body.insertBefore(optionBar, pre);

                    break;

                case 'FORMATTED' :
                    // Insert HTML content
                    djsonContent.innerHTML = msg[1];

                    // Export parsed JSON for easy access in console
                    setTimeout(function () {
                        try{
                            var script = document.createElement("script") ;
                            script.innerHTML = 'window.djson = ' + msg[2] + ';' ;
                            document.head.appendChild(script) ;
                            if(typeof window.djson === "undefined") {
                                window.djson = JSON.parse(msg[2]);
                            }
                            console.log('DJSON Viewer: Type "djson" to inspect.') ;
                        } catch (ex) {}
                    }, 100);

                    break;

                default :
                    throw new Error('Message not understood: ' + msg[0]);
            }
        });
    }

    function ready() {

        connectToPort();

        // First, check if it's a PRE and exit if not
        var bodyChildren = document.body.childNodes;
        pre = bodyChildren[0];
        var numChildNodes = 0;
        for (var i = 0; i < bodyChildren.length; i++) {
            if (bodyChildren[i].nodeType != Node.TEXT_NODE)
                numChildNodes++;
        }

        // if is only one big text try to check if is a valid JSON and wrap it in a pre tag
        if(bodyChildren.length == 1 && bodyChildren[0].nodeType == Node.TEXT_NODE && pre.data && (pre.data.trim().charAt(0) == '{' || pre.data.trim().charAt(0) == '[')){
            var isValidJSON = false;
            try{
                JSON.parse(pre.data.trim());
                isValidJSON = true;
                var preNew = document.createElement('pre');
                preNew.id = 'emptyPre';
                preNew.innerText = pre.data;
                document.body.removeChild(pre);
                pre = preNew;
                document.body.appendChild(pre);
                numChildNodes++;
            } catch (e) {}
        }

        var jsonLength = (pre && pre.innerText || "").length;
        if (
            numChildNodes !== 1 ||
            pre.tagName !== 'PRE' ||
            jsonLength == 0) {
            // console.log(bodyChildren.length,pre.tagName, pre.innerText.length) ;

            // Disconnect the port (without even having used it)
            port.disconnect();

            // EXIT POINT: NON-PLAIN-TEXT PAGE (or longer than 3MB)
        }
        else {
            // This is a 'plain text' page (just a body with one PRE child).
            // It might be JSON/JSONP, or just some other kind of plain text (eg CSS).

            // Hide the PRE immediately (until we know what to do, to prevent FOUC)
            pre.hidden = true;
            slowAnalysisTimeout = setTimeout(function () {
                pre.hidden = false;
            }, 1000);

            // Send the contents of the PRE to the BG script
            // Add djsonContent DIV, ready to display stuff
            djsonContent = document.createElement('div');
            djsonContent.id = 'djsonContent';
            document.body.appendChild(djsonContent);

            // Post the contents of the PRE
            port.postMessage({
                                 type: "SENDING TEXT",
                                 text: pre.innerText,
                                 length: jsonLength
                             });
        }

        document.addEventListener('keyup', function (e) {
            if (e.keyCode === 37 && typeof buttonPlain !== 'undefined') {
                buttonPlain.click();
            }
            else if (e.keyCode === 39 && typeof buttonFormatted !== 'undefined') {
                buttonFormatted.click();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", ready, false);

    function findBlockInner(el) {
        var blockInner = el.firstElementChild;
        while (blockInner && !blockInner.classList.contains('blockInner')) {
            blockInner = blockInner.nextElementSibling;
        }
        return blockInner;
    }

    var lastdObjIdGiven = 0;

    function collapse(elements, recursive) {
        //console.log('elements', elements) ;

        var el, i, blockInner, count;

        for (i = elements.length - 1; i >= 0; i--) {
            el = elements[i];
            el.classList.add('collapsed');

            if (recursive || !el.id) {
                blockInner = findBlockInner(el);

                if (!blockInner) {
                    continue;
                }

                // (CSS hides the contents and shows an ellipsis.)

                // Add a count of the number of child properties/items (if not already done for this item)
                if (!el.id) {
                    el.id = 'dObj' + (++lastdObjIdGiven);

                    // See how many children in the blockInner
                    count = blockInner.children.length;

                    // Generate comment text eg "4 items"
                    var comment = count + (count === 1 ? ' item' : ' items');
                    // Add CSS that targets it
                    djsonStyleEl.insertAdjacentHTML(
                        'beforeend',
                        '\n#dObj' + lastdObjIdGiven + '.collapsed:after{color: #aaa; content:" // '
                        + comment + '"}'
                    );
                }

                if (recursive) {
                    collapse(blockInner.children, recursive);
                }
            }
        }
    }

    function expand(elements, recursive) {
        for (var i = elements.length - 1; i >= 0; i--) {
            elements[i].classList.remove('collapsed');
            if (recursive) {
                var blockInner = findBlockInner(elements[i]);
                if (blockInner) {
                    expand(blockInner.children, recursive);
                }
            }
        }
    }

    var mac = navigator.platform.indexOf('Mac') !== -1,
        modKey;
    if (mac) {
        modKey = function (ev) {
            return ev.metaKey;
        };
    } else {
        modKey = function (ev) {
            return ev.ctrlKey;
        };
    }

    function generalClick(ev) {
        // console.log('click', ev) ;

        if (ev.which === 1) {
            var elem = ev.target;

            if (elem.className === 'expander') {
                // It's a click on an expander.

                ev.preventDefault();

                var parent = elem.parentNode,
                    div = djsonContent,
                    scrollTop = document.body.scrollTop
                    ;

                // Expand or collapse
                if (parent.classList.contains('collapsed')) {
                    // EXPAND
                    if (ev.shiftKey) {
                        expand([parent], true);
                    } else if (modKey(ev)) {
                        expand(parent.parentNode.children);
                    } else {
                        expand([parent]);
                    }
                }
                else {
                    // COLLAPSE
                    if (ev.shiftKey) {
                        collapse([parent], true);
                    } else if (modKey(ev)) {
                        collapse(parent.parentNode.children);
                    } else {
                        collapse([parent]);
                    }
                }

                // Restore scrollTop somehow
                // Clear current extra margin, if any
                div.style.marginBottom = 0;

                // No need to worry if all content fits in viewport
                if (document.body.offsetHeight < window.innerHeight) {
                    return;
                }

                // And no need to worry if scrollTop still the same
                if (document.body.scrollTop === scrollTop) {
                    return;
                }

                var difference = scrollTop - document.body.scrollTop + 8; // it always loses 8px; don't know why
                div.style.marginBottom = difference + 'px';
                document.body.scrollTop = scrollTop;
            }
        }
    }
})();