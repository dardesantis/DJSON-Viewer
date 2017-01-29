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
    JSON._parse = JSON.parse;
    JSON.parse = function (json) {
        try {
            return JSON._parse(json)
        } catch (e) {
            jsonlint.parse(json)
        }
    };

    JSON.minify = function (json) {

        var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
            in_string = false,
            in_multiline_comment = false,
            in_singleline_comment = false,
            tmp, tmp2, new_str = [], ns = 0, from = 0, lc, rc
            ;

        tokenizer.lastIndex = 0;

        while (tmp = tokenizer.exec(json)) {
            lc = RegExp.leftContext;
            rc = RegExp.rightContext;
            if (!in_multiline_comment && !in_singleline_comment) {
                tmp2 = lc.substring(from);
                if (!in_string) {
                    tmp2 = tmp2.replace(/(\n|\r|\s)*/g, "");
                }
                new_str[ns++] = tmp2;
            }
            from = tokenizer.lastIndex;

            if (tmp[0] == "\"" && !in_multiline_comment && !in_singleline_comment) {
                tmp2 = lc.match(/(\\)*$/);
                if (!in_string || !tmp2 || (tmp2[0].length % 2) == 0) {	// start of string with ", or unescaped " character found to end string
                    in_string = !in_string;
                }
                from--; // include " character in next catch
                rc = json.substring(from);
            }
            else if (tmp[0] == "/*" && !in_string && !in_multiline_comment
                     && !in_singleline_comment) {
                in_multiline_comment = true;
            }
            else if (tmp[0] == "*/" && !in_string && in_multiline_comment
                     && !in_singleline_comment) {
                in_multiline_comment = false;
            }
            else if (tmp[0] == "//" && !in_string && !in_multiline_comment
                     && !in_singleline_comment) {
                in_singleline_comment = true;
            }
            else if ((tmp[0] == "\n" || tmp[0] == "\r") && !in_string && !in_multiline_comment
                     && in_singleline_comment) {
                in_singleline_comment = false;
            }
            else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(
                    tmp[0]))) {
                new_str[ns++] = tmp[0];
            }
        }
        new_str[ns++] = rc;
        return new_str.join("");
    };

    document.getElementById("callBeautify").addEventListener("click", beautifyJSON);
    document.getElementById("callMinify").addEventListener("click", minifyJSON);
    document.getElementById("callView").addEventListener("click", tabView);

    function beautifyJSON() {
        try {
            var ugly = document.getElementById('dumpTextArea').value;
            if (ugly.length > 0) {
                var obj = JSON.parse(ugly);
                document.getElementById('dumpTextArea').value = JSON.stringify(obj, undefined, 4);
                copyMe();
                document.getElementById('infoArea').innerHTML =
                    "JSON Beautified and copied in your clipboard";
            } else {
                document.getElementById('infoArea').innerHTML = 'write a Json in the textarea';
            }
        } catch (exc) {
            document.getElementById('infoArea').innerHTML = exc + '';
        }
    }

    function minifyJSON() {
        try {
            var formatted = document.getElementById('dumpTextArea').value;
            if (formatted.length > 0) {
                JSON.parse(formatted);
                document.getElementById('dumpTextArea').value = JSON.minify(formatted);
                copyMe();
                document.getElementById('infoArea').innerHTML =
                    "JSON Minified and copied in your clipboard";
            } else {
                document.getElementById('infoArea').innerHTML = 'write a Json in the textarea';
            }
        } catch (exc) {
            document.getElementById('infoArea').innerHTML = exc + '';
        }
    }

    function copyMe() {
        var textArea = document.getElementById("dumpTextArea");
        var cln = textArea.cloneNode(true);
        cln.style.height = 0;
        document.body.appendChild(cln);
        cln.select();
        document.execCommand("copy");
        document.getElementById('infoArea').innerHTML = "Text Copied";
        cln.remove();
    }

    function tabView() {
        var jsonInput = document.getElementById('dumpTextArea').value;
        if (jsonInput.length > 0) {
            try {
                JSON.parse(jsonInput);
                var viewTabUrl = chrome.extension.getURL('json.html');
                chrome.tabs.query({url: viewTabUrl}, function (tabs) {
                    if (tabs.length > 0) {
                        chrome.tabs.update(tabs[0].id, {'active': true}, function (tab) {
                            chrome.tabs.sendMessage(tab.id, {json: jsonInput});
                        });
                    } else {
                        chrome.tabs.create({url: viewTabUrl}, function (tab) {
                            chrome.tabs.executeScript(tab.id, {file: "notExisting.js"}, function () {
                                chrome.tabs.executeScript(tab.id, {file: "anotherNotExisting.js"}, function () {
                                    chrome.tabs.executeScript(tab.id, {file: "js/content.js"}, function () {
                                        chrome.tabs.sendMessage(tab.id, {json: jsonInput});
                                    });
                                });
                            });
                        });
                    }
                });
                return false;
            } catch (exc) {
                document.getElementById('infoArea').innerHTML = exc + '';
            }
        } else {
            document.getElementById('infoArea').innerHTML = 'write a Json in the textarea';
        }
    }
})();