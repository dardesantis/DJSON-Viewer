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

    function copyMe(textArea) {
        var cln = textArea.cloneNode(true);
        cln.style.height = 0;
        document.body.appendChild(cln);
        cln.select();
        document.execCommand("copy");
        cln.remove();
    }

    $(document).ready(function() {
        /*
         * Events registration
         */
        $("#input").keyup(function () {
            hasher.update();
        });
        $("#input").change(function () {
            hasher.update();
        });

        // Open separate window (pop-out)
        $("#button-popout").click(function () {
            if (typeof chrome.extension !== "undefined") {
                chrome.tabs.create({
                    url: 'popup.html'
                });
            }
        });

        // Click on tab
        $("#tabs li").click(function () {
            // highlight active tab, remove highlight on everything else
            $("#tabs li").removeClass("on");
            $(this).addClass("on");
            hasher.tab = tabs[this.id];
            hasher.init();
            hasher.update();
            $("#input-value").focus();
        });

        $("#callBeautify").click(function () {
            var dumpTextArea = document.getElementById('input-value');
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
        });

        $("#callMinify").click(function () {
            var dumpTextArea = document.getElementById('input-value');
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
        });

        $("#callView").click(function () {
            var jsonInput = document.getElementById('input-value').value;
            if (jsonInput.length > 0) {
                try {
                    JSON.parse(jsonInput);
                    var port = chrome.extension.connect({name: 'djson'});
                    port.postMessage({type: "OPEN JSON TAB", json: jsonInput});
                } catch (exc) {
                    document.getElementById('infoArea').innerHTML = exc + '';
                }
            } else {
                document.getElementById('infoArea').innerHTML = 'write a Json in the textarea';
            }
        });

        /*
         * Animations
         */
        $(".buttons-2").mouseenter(function(){
            $(this).animate(
                {
                    opacity: 0.8
                },
                150
            );
        }).mouseleave(function(){
            $(this).animate(
                {
                    opacity: 0.4
                },
                300
            );
        });

        /*
         * Init
         */
        hasher.init();
        hasher.update();

        // Focus hack, see http://stackoverflow.com/a/11400653/1295557
        if (location.search !== "?focusHack") location.search = "?focusHack";
        //$("#input-value").focus();
        window.scrollTo(0, 0);
    });
})();