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

    JSON._parse = JSON.parse;
    JSON.parse = function (json) {
        try {
            return JSON._parse(json)
        } catch (e) {
            jsonlint.parse(json)
        }
    };

    document.getElementById("callBeautify").addEventListener("click", beautifyJSON);
    document.getElementById("callMinify").addEventListener("click", minifyJSON);
    document.getElementById("callView").addEventListener("click", function(){ tabView(false) });
    document.getElementById("callViewNewTab").addEventListener("click", function(){ tabView(true) });

    function beautifyJSON() {
        var dumpTextArea = document.getElementById('dumpTextArea');
        var infoArea = document.getElementById('infoArea');
        try {
            var ugly = dumpTextArea.value;
            if (ugly.length > 0) {
                var obj = JSON.parse(ugly);
                dumpTextArea.value = JSON.stringify(obj, undefined, 4);
                copyMe(dumpTextArea);
                infoArea.innerHTML = "JSON Beautified and copied in your clipboard";
            } else {
                infoArea.innerHTML = 'write a Json in the textarea';
            }
        } catch (exc) {
            infoArea.innerHTML = exc + '';
        }
    }

    function minifyJSON() {
        var dumpTextArea = document.getElementById('dumpTextArea');
        var infoArea = document.getElementById('infoArea');
        try {
            var formatted = dumpTextArea.value;
            if (formatted.length > 0) {
                dumpTextArea.value = JSON.stringify(JSON.parse(formatted));
                copyMe(dumpTextArea);
                infoArea.innerHTML = "JSON Minified and copied in your clipboard";
            } else {
                infoArea.innerHTML = 'write a Json in the textarea';
            }
        } catch (exc) {
            infoArea.innerHTML = exc + '';
        }
    }

    function copyMe(textArea) {
        var cln = textArea.cloneNode(true);
        cln.style.height = 0;
        document.body.appendChild(cln);
        cln.select();
        document.execCommand("copy");
        cln.remove();
    }

    function tabView(newTab) {
        var jsonInput = document.getElementById('dumpTextArea').value;
        if (jsonInput.length > 0) {
            try {
                JSON.parse(jsonInput);
                var viewTabUrl = chrome.extension.getURL('json.html');
                chrome.tabs.query({url: viewTabUrl, currentWindow: true}, function (tabs) {
                    var tabLenght = tabs.length;
                    if (tabLenght > 0 && !newTab) {
                        var tabIdToSend = null;
                        for(var j=0; j<tabLenght; j++){
                            if(tabs[j].active){
                                tabIdToSend = tabs[j].id;
                                break;
                            }
                        }
                        tabIdToSend = tabIdToSend !== null ? tabIdToSend : tabs[0].id;
                        chrome.tabs.update(tabIdToSend, {'active': true}, function (tab) {
                            chrome.tabs.sendMessage(tab.id, {json: jsonInput});
                        });
                    } else {
                        var port = chrome.extension.connect({name: 'djson'});
                        port.postMessage({type: "OPEN JSON TAB", viewTabUrl: viewTabUrl, json: jsonInput});
                    }
                });
            } catch (exc) {
                document.getElementById('infoArea').innerHTML = exc + '';
            }
        } else {
            document.getElementById('infoArea').innerHTML = 'write a Json in the textarea';
        }
    }
})();