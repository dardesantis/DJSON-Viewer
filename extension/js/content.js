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

    var djsonContent,
        pre,
        djson,
        djsonStyleEl,
        slowAnalysisTimeout,
        port
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
                    if(typeof djsonStyleEl === "undefined") {
                        djsonStyleEl = document.createElement('style');
                        djsonStyleEl.id = 'djsonStyleEl';
                        document.head.appendChild(djsonStyleEl);
                        djsonStyleEl.insertAdjacentHTML(
                            'beforeend',
                            'body{-webkit-user-select:text;overflow-y:scroll !important;margin:0;position:relative;background-color:#fff}body pre#emptyPre{word-wrap:break-word;white-space:pre-wrap}pre{white-space:normal;font-size:13px;color:#444}#optionBar{-webkit-user-select:none;display:block;position:absolute;top:9px;right:17px;z-index:10}#optionBar button{-webkit-border-radius:2px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.1);-webkit-user-select:none;background:-webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);border:1px solid #aaa;color:#444;font-size:12px;margin-bottom:0;min-width:4em;padding:3px 0;position:relative;display:inline-block;width:80px;text-shadow:1px 1px rgba(255,255,255,0.3)}#optionBar button:hover{-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);border-color:#999;color:#222}#optionBar button:focus{outline:0}#optionBar #buttonFormatted:active,#optionBar #buttonPlain:active{-webkit-box-shadow:inset 0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);color:#333}#optionBar #buttonFormatted.selected,#optionBar #buttonPlain.selected{-webkit-box-shadow:inset 0 1px 5px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);color:#333}#optionBar #collapseAll{margin-right:10px}#optionBar #buttonFormatted{margin-left:0;margin-right:10px;border-top-left-radius:0;border-bottom-left-radius:0}#optionBar #buttonPlain{margin-right:0;border-top-right-radius:0;border-bottom-right-radius:0;border-right:none}#optionBar #rawFormatterContainer{display:none;margin-top:15px}#optionBar #optionChooser{display:inline-block;width:21px;height:21px;cursor:pointer;background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzdBQTYwNTYxQzY2MTFFNzk4MENFNTBBMjJGODI4MDgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzdBQTYwNTcxQzY2MTFFNzk4MENFNTBBMjJGODI4MDgiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDN0FBNjA1NDFDNjYxMUU3OTgwQ0U1MEEyMkY4MjgwOCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDN0FBNjA1NTFDNjYxMUU3OTgwQ0U1MEEyMkY4MjgwOCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Ph3jLF8AAA/vSURBVHjalFkJkFzV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");background-size:cover;position:relative;top:7px}#optionScreen{padding:0 10px}#optionScreen #themeChooserContainer #themeChooserSelectContainer{margin-top:10px}#optionScreen #themeChooserContainer #themeChooserPreview pre{word-wrap:break-word;white-space:pre-wrap;border:1px solid;padding:5px;box-shadow:inset 1px 1px 2px 0 #888888}#jsonpOpener,#jsonpCloser{padding:4px 0 0 8px;color:#444;margin-bottom:-6px}#jsonpCloser{margin-top:0}#formattedJson{padding-left:28px;padding-top:6px}.dObj{display:block;padding-left:20px;margin-left:-20px;position:relative}.collapsed{white-space:nowrap}.collapsed>.blockInner{display:none}.collapsed>.ellipsis:after{content:"…";font-weight:bold}.collapsed>.ellipsis{margin:0 4px;color:#888}.collapsed .dObj{display:inline}.expander{width:0;height:0;border-top:8px solid #444;border-right:6px solid transparent;border-left:6px solid transparent;display:block;position:absolute;left:3px;top:5px;z-index:5;opacity:0.15;cursor:pointer;-webkit-transition:-webkit-transform 0.1s linear}.collapsed>.expander{-webkit-transform:rotate(-90deg)}.expander:hover{opacity:0.35}.expander:active{opacity:0.5}.collapsed .dObj .expander{display:none}.blockInner{display:block;padding-left:24px;border-left:1px dotted #bbb;margin-left:2px}#formattedJson,#jsonpOpener,#jsonpCloser{color:#333;font:13px/18px monospace}#formattedJson{color:#444}.b{font-weight:bold}.s{color:#0B7500;word-wrap:break-word}a:link,a:visited{text-decoration:none;color:inherit}a:hover,a:active{text-decoration:underline;color:#050}.bl,.nl,.n{font-weight:bold;color:#1A01CC}.key{color:#000}.nested:after{content:"view nested JSON";background-color:#1A01CC;color:#fff;border-radius:4px;padding:2px 5px;margin-left:10px;cursor:pointer}#formattingMsg{font:13px "Lucida Grande", "Segoe UI", "Tahoma";padding:10px 0 0 8px;margin:0;color:#333}#formattingMsg .loader{position:relative;top:5px;border:4px solid #f3f3f3;border-radius:50%;border-top:4px solid #3498db;width:12px;height:12px;-webkit-animation:spin 1s linear infinite;animation:spin 1s linear infinite;display:inline-block}#status{position:fixed;left:0;bottom:0;min-width:628px;border:1px solid #333;border-bottom-width:0;border-left-width:0;border-top-right-radius:4px;height:16px;padding:2px 7px 4px 4px;font-size:15px;opacity:0;background-color:#444;color:#fff;transition:opacity .2s ease-out;-webkit-transition:opacity .2s ease-out;user-select:none;-webkit-user-select:none}#status:not(:empty){opacity:1}[hidden]{display:none !important}span{white-space:pre-wrap}@-webkit-keyframes spin{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}body[data-theme="default"],#themeChooserPreview[data-theme="default"]{background-color:#fff}body[data-theme="default"] .expander,#themeChooserPreview[data-theme="default"] .expander{border-top:8px solid #444}body[data-theme="default"] #formattedJson,body[data-theme="default"] #jsonpOpener,body[data-theme="default"] #jsonpCloser,#themeChooserPreview[data-theme="default"] #formattedJson,#themeChooserPreview[data-theme="default"] #jsonpOpener,#themeChooserPreview[data-theme="default"] #jsonpCloser{color:#333}body[data-theme="default"] #formattedJson,#themeChooserPreview[data-theme="default"] #formattedJson{color:#444}body[data-theme="default"] .objProp,#themeChooserPreview[data-theme="default"] .objProp{color:#000}body[data-theme="default"] .s,#themeChooserPreview[data-theme="default"] .s{color:#0B7500}body[data-theme="default"] .key,#themeChooserPreview[data-theme="default"] .key{color:#000}body[data-theme="default"] pre,#themeChooserPreview[data-theme="default"] pre{color:#444}body[data-theme="default"] a:hover,body[data-theme="default"] a:active,#themeChooserPreview[data-theme="default"] a:hover,#themeChooserPreview[data-theme="default"] a:active{color:#050}body[data-theme="default"] .bl,body[data-theme="default"] .nl,body[data-theme="default"] .n,#themeChooserPreview[data-theme="default"] .bl,#themeChooserPreview[data-theme="default"] .nl,#themeChooserPreview[data-theme="default"] .n{color:#1A01CC}body[data-theme="default"] .nested:after,#themeChooserPreview[data-theme="default"] .nested:after{background-color:#1A01CC;color:#fff}body[data-theme="default"] #formattingMsg,#themeChooserPreview[data-theme="default"] #formattingMsg{color:#333}body[data-theme="default"] #status,#themeChooserPreview[data-theme="default"] #status{border-color:#333;background-color:#444;color:#fff}body[data-theme="monokai"],#themeChooserPreview[data-theme="monokai"]{background-color:#272822}body[data-theme="monokai"] .expander,#themeChooserPreview[data-theme="monokai"] .expander{border-top:8px solid #fffff9}body[data-theme="monokai"] #formattedJson,body[data-theme="monokai"] #jsonpOpener,body[data-theme="monokai"] #jsonpCloser,#themeChooserPreview[data-theme="monokai"] #formattedJson,#themeChooserPreview[data-theme="monokai"] #jsonpOpener,#themeChooserPreview[data-theme="monokai"] #jsonpCloser{color:#fff}body[data-theme="monokai"] #formattedJson,#themeChooserPreview[data-theme="monokai"] #formattedJson{color:#fffff9}body[data-theme="monokai"] .objProp,#themeChooserPreview[data-theme="monokai"] .objProp{color:#F92672}body[data-theme="monokai"] .s,#themeChooserPreview[data-theme="monokai"] .s{color:#a6e22e}body[data-theme="monokai"] .key,#themeChooserPreview[data-theme="monokai"] .key{color:#F92672}body[data-theme="monokai"] pre,#themeChooserPreview[data-theme="monokai"] pre{color:#fffff9}body[data-theme="monokai"] a:hover,body[data-theme="monokai"] a:active,#themeChooserPreview[data-theme="monokai"] a:hover,#themeChooserPreview[data-theme="monokai"] a:active{color:#8ac21b}body[data-theme="monokai"] .bl,body[data-theme="monokai"] .nl,body[data-theme="monokai"] .n,#themeChooserPreview[data-theme="monokai"] .bl,#themeChooserPreview[data-theme="monokai"] .nl,#themeChooserPreview[data-theme="monokai"] .n{color:#AE81FF}body[data-theme="monokai"] .nested:after,#themeChooserPreview[data-theme="monokai"] .nested:after{background-color:#AE81FF;color:#272822}body[data-theme="monokai"] #formattingMsg,#themeChooserPreview[data-theme="monokai"] #formattingMsg{color:#fff}body[data-theme="monokai"] #status,#themeChooserPreview[data-theme="monokai"] #status{border-color:#fff;background-color:#fffff9;color:#272822}body[data-theme="xcode"],#themeChooserPreview[data-theme="xcode"]{background-color:#fff}body[data-theme="xcode"] .expander,#themeChooserPreview[data-theme="xcode"] .expander{border-top:8px solid #bdaddd}body[data-theme="xcode"] #formattedJson,body[data-theme="xcode"] #jsonpOpener,body[data-theme="xcode"] #jsonpCloser,#themeChooserPreview[data-theme="xcode"] #formattedJson,#themeChooserPreview[data-theme="xcode"] #jsonpOpener,#themeChooserPreview[data-theme="xcode"] #jsonpCloser{color:#9589b0}body[data-theme="xcode"] #formattedJson,#themeChooserPreview[data-theme="xcode"] #formattedJson{color:#bdaddd}body[data-theme="xcode"] .objProp,#themeChooserPreview[data-theme="xcode"] .objProp{color:#a195ee}body[data-theme="xcode"] .s,#themeChooserPreview[data-theme="xcode"] .s{color:#000}body[data-theme="xcode"] .key,#themeChooserPreview[data-theme="xcode"] .key{color:#a195ee}body[data-theme="xcode"] pre,#themeChooserPreview[data-theme="xcode"] pre{color:#bdaddd}body[data-theme="xcode"] a:hover,body[data-theme="xcode"] a:active,#themeChooserPreview[data-theme="xcode"] a:hover,#themeChooserPreview[data-theme="xcode"] a:active{color:#f7104d}body[data-theme="xcode"] .bl,body[data-theme="xcode"] .nl,body[data-theme="xcode"] .n,#themeChooserPreview[data-theme="xcode"] .bl,#themeChooserPreview[data-theme="xcode"] .nl,#themeChooserPreview[data-theme="xcode"] .n{color:#3b8afb}body[data-theme="xcode"] .nested:after,#themeChooserPreview[data-theme="xcode"] .nested:after{background-color:#3b8afb;color:#fff}body[data-theme="xcode"] #formattingMsg,#themeChooserPreview[data-theme="xcode"] #formattingMsg{color:#9589b0}body[data-theme="xcode"] #status,#themeChooserPreview[data-theme="xcode"] #status{border-color:#9589b0;background-color:#bdaddd;color:#fff}body[data-theme="solarized"],#themeChooserPreview[data-theme="solarized"]{background-color:#002b36}body[data-theme="solarized"] .expander,#themeChooserPreview[data-theme="solarized"] .expander{border-top:8px solid #cfebee}body[data-theme="solarized"] #formattedJson,body[data-theme="solarized"] #jsonpOpener,body[data-theme="solarized"] #jsonpCloser,#themeChooserPreview[data-theme="solarized"] #formattedJson,#themeChooserPreview[data-theme="solarized"] #jsonpOpener,#themeChooserPreview[data-theme="solarized"] #jsonpCloser{color:#e2fafc}body[data-theme="solarized"] #formattedJson,#themeChooserPreview[data-theme="solarized"] #formattedJson{color:#cfebee}body[data-theme="solarized"] .objProp,#themeChooserPreview[data-theme="solarized"] .objProp{color:#839496}body[data-theme="solarized"] .s,#themeChooserPreview[data-theme="solarized"] .s{color:#2aa198}body[data-theme="solarized"] .key,#themeChooserPreview[data-theme="solarized"] .key{color:#839496}body[data-theme="solarized"] pre,#themeChooserPreview[data-theme="solarized"] pre{color:#cfebee}body[data-theme="solarized"] a:hover,body[data-theme="solarized"] a:active,#themeChooserPreview[data-theme="solarized"] a:hover,#themeChooserPreview[data-theme="solarized"] a:active{color:#268bd2}body[data-theme="solarized"] .bl,body[data-theme="solarized"] .nl,body[data-theme="solarized"] .n,#themeChooserPreview[data-theme="solarized"] .bl,#themeChooserPreview[data-theme="solarized"] .nl,#themeChooserPreview[data-theme="solarized"] .n{color:#d33682}body[data-theme="solarized"] .nested:after,#themeChooserPreview[data-theme="solarized"] .nested:after{background-color:#d33682;color:#002b36}body[data-theme="solarized"] #formattingMsg,#themeChooserPreview[data-theme="solarized"] #formattingMsg{color:#e2fafc}body[data-theme="solarized"] #status,#themeChooserPreview[data-theme="solarized"] #status{border-color:#e2fafc;background-color:#cfebee;color:#002b36}body[data-theme="darkorange"],#themeChooserPreview[data-theme="darkorange"]{background-color:#000}body[data-theme="darkorange"] .expander,#themeChooserPreview[data-theme="darkorange"] .expander{border-top:8px solid #ededed}body[data-theme="darkorange"] #formattedJson,body[data-theme="darkorange"] #jsonpOpener,body[data-theme="darkorange"] #jsonpCloser,#themeChooserPreview[data-theme="darkorange"] #formattedJson,#themeChooserPreview[data-theme="darkorange"] #jsonpOpener,#themeChooserPreview[data-theme="darkorange"] #jsonpCloser{color:#fff}body[data-theme="darkorange"] #formattedJson,#themeChooserPreview[data-theme="darkorange"] #formattedJson{color:#ededed}body[data-theme="darkorange"] .objProp,#themeChooserPreview[data-theme="darkorange"] .objProp{color:orange}body[data-theme="darkorange"] .s,#themeChooserPreview[data-theme="darkorange"] .s{color:#90ee90}body[data-theme="darkorange"] .key,#themeChooserPreview[data-theme="darkorange"] .key{color:orange}body[data-theme="darkorange"] pre,#themeChooserPreview[data-theme="darkorange"] pre{color:#ededed}body[data-theme="darkorange"] a:hover,body[data-theme="darkorange"] a:active,#themeChooserPreview[data-theme="darkorange"] a:hover,#themeChooserPreview[data-theme="darkorange"] a:active{color:#1e90ff}body[data-theme="darkorange"] .bl,body[data-theme="darkorange"] .nl,body[data-theme="darkorange"] .n,#themeChooserPreview[data-theme="darkorange"] .bl,#themeChooserPreview[data-theme="darkorange"] .nl,#themeChooserPreview[data-theme="darkorange"] .n{color:#add8e6}body[data-theme="darkorange"] .nested:after,#themeChooserPreview[data-theme="darkorange"] .nested:after{background-color:#add8e6;color:#000}body[data-theme="darkorange"] #formattingMsg,#themeChooserPreview[data-theme="darkorange"] #formattingMsg{color:#fff}body[data-theme="darkorange"] #status,#themeChooserPreview[data-theme="darkorange"] #status{border-color:#fff;background-color:#ededed;color:#000}body[data-theme="halewa"],#themeChooserPreview[data-theme="halewa"]{background-color:#263238}body[data-theme="halewa"] .expander,#themeChooserPreview[data-theme="halewa"] .expander{border-top:8px solid #5ee38a}body[data-theme="halewa"] #formattedJson,body[data-theme="halewa"] #jsonpOpener,body[data-theme="halewa"] #jsonpCloser,#themeChooserPreview[data-theme="halewa"] #formattedJson,#themeChooserPreview[data-theme="halewa"] #jsonpOpener,#themeChooserPreview[data-theme="halewa"] #jsonpCloser{color:#60fc9f}body[data-theme="halewa"] #formattedJson,#themeChooserPreview[data-theme="halewa"] #formattedJson{color:#5ee38a}body[data-theme="halewa"] .objProp,#themeChooserPreview[data-theme="halewa"] .objProp{color:#c792ea}body[data-theme="halewa"] .s,#themeChooserPreview[data-theme="halewa"] .s{color:#ffcb6b}body[data-theme="halewa"] .key,#themeChooserPreview[data-theme="halewa"] .key{color:#c792ea}body[data-theme="halewa"] pre,#themeChooserPreview[data-theme="halewa"] pre{color:#5ee38a}body[data-theme="halewa"] a:hover,body[data-theme="halewa"] a:active,#themeChooserPreview[data-theme="halewa"] a:hover,#themeChooserPreview[data-theme="halewa"] a:active{color:#50a3d8}body[data-theme="halewa"] .bl,body[data-theme="halewa"] .nl,body[data-theme="halewa"] .n,#themeChooserPreview[data-theme="halewa"] .bl,#themeChooserPreview[data-theme="halewa"] .nl,#themeChooserPreview[data-theme="halewa"] .n{color:#6dc2b8}body[data-theme="halewa"] .nested:after,#themeChooserPreview[data-theme="halewa"] .nested:after{background-color:#6dc2b8;color:#263238}body[data-theme="halewa"] #formattingMsg,#themeChooserPreview[data-theme="halewa"] #formattingMsg{color:#60fc9f}body[data-theme="halewa"] #status,#themeChooserPreview[data-theme="halewa"] #status{border-color:#60fc9f;background-color:#5ee38a;color:#263238}'
                        );
                    }

                    var localStorageOptions = JSON.parse(msg[1]);
                    var theme = localStorageOptions && localStorageOptions.hasOwnProperty('theme') ? localStorageOptions.theme : null;
                    if (theme) {
                        document.body.setAttribute("data-theme", theme);
                    }

                    djsonContent.innerHTML = '<p id="formattingMsg"><span class="loader"></span> Formatting...</p>';

                    var formattingMsg = document.getElementById('formattingMsg');
                    // TODO: set formattingMsg to visible after about 300ms (so faster than this doesn't require it)
                    formattingMsg.hidden = true;
                    setTimeout(function () {
                        formattingMsg.hidden = false;
                    }, 250);

                    // statusBar
                    if (!document.getElementById("status")){
                        var statusElement = document.createElement('div');
                        statusElement.id = "status";
                        document.body.appendChild(statusElement);
                    }

                    // Create collapse/expand all button
                    if (!document.getElementById("optionBar")) {
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
                                var firstBlockInner = document.querySelector(".rootDObj > .blockInner");
                                if (firstBlockInner !== null) {
                                    collapse(firstBlockInner.children, true);
                                }
                            }
                        );

                        // Create minify/beautify buttons
                        var minifyRaw = document.createElement('button');
                        minifyRaw.id = 'minifyRaw';
                        minifyRaw.innerText = 'Minify';
                        minifyRaw.addEventListener(
                            'click',
                            function () {
                                pre.innerText = JSON.stringify(djson);
                            }
                        );

                        var beautifyRaw = document.createElement('button');
                        beautifyRaw.id = 'beutifyRaw';
                        beautifyRaw.innerText = 'Beautify';
                        beautifyRaw.addEventListener(
                            'click',
                            function () {
                                pre.innerText = JSON.stringify(djson, undefined, 4);
                            }
                        );
                        var rawFormatterContainer = document.createElement('div');
                        rawFormatterContainer.id = 'rawFormatterContainer';
                        rawFormatterContainer.appendChild(minifyRaw);
                        rawFormatterContainer.appendChild(beautifyRaw);

                        // Create toggleFormat button
                        var buttonPlain = document.createElement('button');
                        var buttonFormatted = document.createElement('button');
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
                                    statusElement.style.opacity = 0;
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
                                    statusElement.style.opacity = 1;
                                }
                            },
                            false
                        );

                        // Create option bar
                        var optionBar = document.createElement('div');
                        optionBar.id = 'optionBar';

                        //create option icon
                        var optionChooser = document.createElement('div');
                        optionChooser.id = 'optionChooser';
                        optionChooser.addEventListener('click', function () {
                            port.postMessage({type: "OPEN OPTION TAB"});
                        });

                        // Put it in optionBar
                        optionBar.appendChild(buttonExpand);
                        optionBar.appendChild(buttonCollapse);
                        optionBar.appendChild(buttonPlain);
                        optionBar.appendChild(buttonFormatted);
                        optionBar.appendChild(optionChooser);
                        optionBar.appendChild(rawFormatterContainer);

                        // Attach event handlers
                        document.addEventListener(
                            'click',
                            generalClick,
                            false // No need to propogate down
                        );

                        // Put option bar in DOM
                        document.body.insertBefore(optionBar, pre);

                        document.addEventListener('keyup', function (e) {
                            if (e.keyCode === 37 && typeof buttonPlain !== 'undefined') {
                                buttonPlain.click();
                            }
                            else if (e.keyCode === 39 && typeof buttonFormatted !== 'undefined') {
                                buttonFormatted.click();
                            }
                        });
                    }

                    break;

                case 'FORMATTED' :

                    var localStorageOptions = JSON.parse(msg[3]);

                    // Insert CSS numOfChildren elements
                    var numOfChildren = JSON.parse(msg[4]);
                    for(var z=0; z<numOfChildren.length; z++){
                        var count = numOfChildren[z];
                        var comment = count + (count === 1 ? ' item' : ' items');
                        // Add CSS that targets it
                        djsonStyleEl.insertAdjacentHTML(
                            'beforeend',
                            '\n.numChild' + count + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
                        );

                        if(localStorageOptions.hasOwnProperty("showAlwaysCount")) {
                            djsonStyleEl.insertAdjacentHTML(
                                'beforeend',
                                '\n.numChild' + count + ':not(.collapsed)>.b:not(.lastB):after{color: #aaa; font-weight: normal; content:" // ' + comment + '"}'
                            );
                        }
                    }

                    // Insert HTML content
                    djsonContent.innerHTML = msg[1];

                    djsonContent.removeEventListener('mouseover', onMouseMove, false);
                    djsonContent.addEventListener('mouseover', onMouseMove, false);
                    document.body.removeEventListener('contextmenu', onContextMenu, false);
                    document.body.addEventListener('contextmenu', onContextMenu, false);

                    // bind nested json open actions
                    //{"dario":"{\"test\":{\"test1\":{\"test1\":[{\"test2\":\"1\",\"test3\": \"foo\",\"test4\":\"bar\",\"test5\":\"test7\"}]}}}"}

                    var nested = document.getElementsByClassName('nested');
                    for (var i = 0; i < nested.length; i++) {
                        nested[i].addEventListener('click', function () {
                            port.postMessage({type: "VIEW NESTED", obj: window.djson, path: document.getElementById("status").innerText});
                        }, false);
                    }

                    // Export parsed JSON for easy access in console
                    setTimeout(function () {
                        try{
                            if(document.location.protocol === "chrome-extension:") {
                                window.djson = JSON.parse(msg[2]);
                                djson = window.djson;
                            } else {
                                var script = document.createElement("script") ;
                                script.innerHTML = 'window.djson = ' + msg[2] + ';' ;
                                document.head.appendChild(script) ;
                                djson = JSON.parse(msg[2]);
                            }
                            console.log('DJSON Viewer: Type "djson" to inspect.') ;
                        } catch (ex) {}
                    }, 100);

                    break;

                default :
                    throw new Error('Message not understood: ' + msg[0]);
            }
        });

        var onMouseMove = (function() {
            function onmouseOut() {
                document.getElementById("status").innerText = "";
            }

            function findDObjElement(element){
                if(element.id == "formattedJson" || element.id == "djsonContent"){
                    return false;
                }
                while(!element.classList.contains("dObj")){
                    element = element.parentNode;
                }
                if(element.classList.contains('rootDObj')){
                    return false;
                }
                return element;
            }

            return function(event) {
                var str = "", statusElement = document.getElementById("status");
                var element = findDObjElement(event.target);
                if (element) {
                    do {
                        if (element.classList.contains("arrElem")) {
                            var index = [].indexOf.call(element.parentNode.children, element);
                            str = "[" + index + "]" + str;
                        }
                        else if (element.classList.contains("dObj")) {
                            str = "." + element.getElementsByClassName("key")[0].innerText + str;
                        }
                        element = element.parentNode.parentNode;
                    } while (element.classList.contains("dObj") && !element.classList.contains("rootDObj"));
                    str = "$"+str;
                    statusElement.innerText = str;
                    return;
                }
                onmouseOut();
            };
        })();

        function onContextMenu() {
            var status = document.getElementById("status");
            if(status && status.innerText.length > 0){
                port.postMessage({type: "COPY PATH", obj: window.djson, path: status.innerText});
            }
        }
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
            try{
                JSON.parse(pre.data.trim());
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

            // EXIT POINT: NON-PLAIN-TEXT PAGE
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
    }

    document.addEventListener("DOMContentLoaded", ready, false);

    function findBlockInner(el) {
        var blockInner = el.firstElementChild;
        while (blockInner && !blockInner.classList.contains('blockInner')) {
            blockInner = blockInner.nextElementSibling;
        }
        return blockInner;
    }

    function collapse(elements, recursive) {
        for (var i = elements.length - 1; i >= 0; i--) {
            elements[i].classList.add('collapsed');
            if (recursive) {
                var blockInner = findBlockInner(elements[i]);
                if (blockInner) {
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