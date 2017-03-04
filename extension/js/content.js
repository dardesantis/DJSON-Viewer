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
        port,
        buttonPlain,
        buttonFormatted
        ;

    var supportedThemes = ["default", "monokai", "xcode", "solarized", "darkorange", "halewa"];

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
                            'body{-webkit-user-select:text;overflow-y:scroll !important;margin:0;position:relative;background-color:#fff}body pre#emptyPre{word-wrap:break-word;white-space:pre-wrap}pre{white-space:normal;font-size:13px;color:#444}#optionBar{-webkit-user-select:none;display:block;position:absolute;top:9px;right:17px;z-index:10}#optionBar button{-webkit-border-radius:2px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.1);-webkit-user-select:none;background:-webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);border:1px solid #aaa;color:#444;font-size:12px;margin-bottom:0;min-width:4em;padding:3px 0;position:relative;display:inline-block;width:80px;text-shadow:1px 1px rgba(255,255,255,0.3)}#optionBar button:hover{-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);border-color:#999;color:#222}#optionBar button:focus{outline:0}#optionBar #buttonFormatted:active,#optionBar #buttonPlain:active{-webkit-box-shadow:inset 0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);color:#333}#optionBar #buttonFormatted.selected,#optionBar #buttonPlain.selected{-webkit-box-shadow:inset 0 1px 5px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);color:#333}#optionBar #collapseAll{margin-right:10px}#optionBar #buttonFormatted{margin-left:0;margin-right:10px;border-top-left-radius:0;border-bottom-left-radius:0}#optionBar #buttonPlain{margin-right:0;border-top-right-radius:0;border-bottom-right-radius:0;border-right:none}#optionBar #rawFormatterContainer{display:none;margin-top:15px}#optionBar #themeChooser{display:inline-block;width:21px;height:21px;cursor:pointer;background-image:url("data:image/png;base64,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");background-size:cover;position:relative;top:7px}#optionBar #themeChooserContainer{display:none;position:absolute;top:40px;right:0;width:440px;background:#fff;box-shadow:1px 2px 9px 1px #888888;padding:10px;box-sizing:border-box}#optionBar #themeChooserContainer:before{width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-bottom:11px solid #888888;opacity:0.3;position:absolute;top:-11px;right:0.5px;content:""}#optionBar #themeChooserContainer:after{width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:10px solid #fff;position:absolute;top:-10px;right:1px;content:""}#optionBar #themeChooserContainer #themeChooserTitle{font-weight:bold;color:#333}#optionBar #themeChooserContainer #themeChooserSelectContainer{margin-top:10px}#optionBar #themeChooserContainer #themeChooserPreview pre{word-wrap:break-word;white-space:pre-wrap;border:1px solid;padding:5px;box-shadow:inset 1px 1px 2px 0 #888888}#jsonpOpener,#jsonpCloser{padding:4px 0 0 8px;color:#444;margin-bottom:-6px}#jsonpCloser{margin-top:0}#formattedJson{padding-left:28px;padding-top:6px}.dObj{display:block;padding-left:20px;margin-left:-20px;position:relative}.collapsed{white-space:nowrap}.collapsed>.blockInner{display:none}.collapsed>.ellipsis:after{content:"…";font-weight:bold}.collapsed>.ellipsis{margin:0 4px;color:#888}.collapsed .dObj{display:inline}.expander{width:0;height:0;border-top:8px solid #444;border-right:6px solid transparent;border-left:6px solid transparent;display:block;position:absolute;left:3px;top:5px;z-index:5;opacity:0.15;cursor:pointer;-webkit-transition:-webkit-transform 0.1s linear}.collapsed>.expander{-webkit-transform:rotate(-90deg)}.expander:hover{opacity:0.35}.expander:active{opacity:0.5}.collapsed .dObj .expander{display:none}.blockInner{display:block;padding-left:24px;border-left:1px dotted #bbb;margin-left:2px}#formattedJson,#jsonpOpener,#jsonpCloser{color:#333;font:13px/18px monospace}#formattedJson{color:#444}.b{font-weight:bold}.s{color:#0B7500;word-wrap:break-word}a:link,a:visited{text-decoration:none;color:inherit}a:hover,a:active{text-decoration:underline;color:#050}.bl,.nl,.n{font-weight:bold;color:#1A01CC}.key{color:#000}#formattingMsg{font:13px "Lucida Grande", "Segoe UI", "Tahoma";padding:10px 0 0 8px;margin:0;color:#333}#formattingMsg .loader{position:relative;top:5px;border:4px solid #f3f3f3;border-radius:50%;border-top:4px solid #3498db;width:12px;height:12px;-webkit-animation:spin 1s linear infinite;animation:spin 1s linear infinite;display:inline-block}[hidden]{display:none !important}span{white-space:pre-wrap}@-webkit-keyframes spin{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}body[data-theme="default"],#themeChooserPreview[data-theme="default"]{background-color:#fff}body[data-theme="default"] .expander,#themeChooserPreview[data-theme="default"] .expander{border-top:8px solid #444}body[data-theme="default"] #formattedJson,body[data-theme="default"] #jsonpOpener,body[data-theme="default"] #jsonpCloser,#themeChooserPreview[data-theme="default"] #formattedJson,#themeChooserPreview[data-theme="default"] #jsonpOpener,#themeChooserPreview[data-theme="default"] #jsonpCloser{color:#333}body[data-theme="default"] #formattedJson,#themeChooserPreview[data-theme="default"] #formattedJson{color:#444}body[data-theme="default"] .objProp,#themeChooserPreview[data-theme="default"] .objProp{color:#000}body[data-theme="default"] .s,#themeChooserPreview[data-theme="default"] .s{color:#0B7500}body[data-theme="default"] .key,#themeChooserPreview[data-theme="default"] .key{color:#000}body[data-theme="default"] pre,#themeChooserPreview[data-theme="default"] pre{color:#444}body[data-theme="default"] a:hover,body[data-theme="default"] a:active,#themeChooserPreview[data-theme="default"] a:hover,#themeChooserPreview[data-theme="default"] a:active{color:#050}body[data-theme="default"] .bl,body[data-theme="default"] .nl,body[data-theme="default"] .n,#themeChooserPreview[data-theme="default"] .bl,#themeChooserPreview[data-theme="default"] .nl,#themeChooserPreview[data-theme="default"] .n{color:#1A01CC}body[data-theme="monokai"],#themeChooserPreview[data-theme="monokai"]{background-color:#272822}body[data-theme="monokai"] .expander,#themeChooserPreview[data-theme="monokai"] .expander{border-top:8px solid #fffff9}body[data-theme="monokai"] #formattedJson,body[data-theme="monokai"] #jsonpOpener,body[data-theme="monokai"] #jsonpCloser,#themeChooserPreview[data-theme="monokai"] #formattedJson,#themeChooserPreview[data-theme="monokai"] #jsonpOpener,#themeChooserPreview[data-theme="monokai"] #jsonpCloser{color:#fff}body[data-theme="monokai"] #formattedJson,#themeChooserPreview[data-theme="monokai"] #formattedJson{color:#fffff9}body[data-theme="monokai"] .objProp,#themeChooserPreview[data-theme="monokai"] .objProp{color:#F92672}body[data-theme="monokai"] .s,#themeChooserPreview[data-theme="monokai"] .s{color:#a6e22e}body[data-theme="monokai"] .key,#themeChooserPreview[data-theme="monokai"] .key{color:#F92672}body[data-theme="monokai"] pre,#themeChooserPreview[data-theme="monokai"] pre{color:#fffff9}body[data-theme="monokai"] a:hover,body[data-theme="monokai"] a:active,#themeChooserPreview[data-theme="monokai"] a:hover,#themeChooserPreview[data-theme="monokai"] a:active{color:#8ac21b}body[data-theme="monokai"] .bl,body[data-theme="monokai"] .nl,body[data-theme="monokai"] .n,#themeChooserPreview[data-theme="monokai"] .bl,#themeChooserPreview[data-theme="monokai"] .nl,#themeChooserPreview[data-theme="monokai"] .n{color:#AE81FF}body[data-theme="xcode"],#themeChooserPreview[data-theme="xcode"]{background-color:#fff}body[data-theme="xcode"] .expander,#themeChooserPreview[data-theme="xcode"] .expander{border-top:8px solid #bdaddd}body[data-theme="xcode"] #formattedJson,body[data-theme="xcode"] #jsonpOpener,body[data-theme="xcode"] #jsonpCloser,#themeChooserPreview[data-theme="xcode"] #formattedJson,#themeChooserPreview[data-theme="xcode"] #jsonpOpener,#themeChooserPreview[data-theme="xcode"] #jsonpCloser{color:#9589b0}body[data-theme="xcode"] #formattedJson,#themeChooserPreview[data-theme="xcode"] #formattedJson{color:#bdaddd}body[data-theme="xcode"] .objProp,#themeChooserPreview[data-theme="xcode"] .objProp{color:#a195ee}body[data-theme="xcode"] .s,#themeChooserPreview[data-theme="xcode"] .s{color:#000}body[data-theme="xcode"] .key,#themeChooserPreview[data-theme="xcode"] .key{color:#a195ee}body[data-theme="xcode"] pre,#themeChooserPreview[data-theme="xcode"] pre{color:#bdaddd}body[data-theme="xcode"] a:hover,body[data-theme="xcode"] a:active,#themeChooserPreview[data-theme="xcode"] a:hover,#themeChooserPreview[data-theme="xcode"] a:active{color:#f7104d}body[data-theme="xcode"] .bl,body[data-theme="xcode"] .nl,body[data-theme="xcode"] .n,#themeChooserPreview[data-theme="xcode"] .bl,#themeChooserPreview[data-theme="xcode"] .nl,#themeChooserPreview[data-theme="xcode"] .n{color:#3b8afb}body[data-theme="solarized"],#themeChooserPreview[data-theme="solarized"]{background-color:#002b36}body[data-theme="solarized"] .expander,#themeChooserPreview[data-theme="solarized"] .expander{border-top:8px solid #cfebee}body[data-theme="solarized"] #formattedJson,body[data-theme="solarized"] #jsonpOpener,body[data-theme="solarized"] #jsonpCloser,#themeChooserPreview[data-theme="solarized"] #formattedJson,#themeChooserPreview[data-theme="solarized"] #jsonpOpener,#themeChooserPreview[data-theme="solarized"] #jsonpCloser{color:#e2fafc}body[data-theme="solarized"] #formattedJson,#themeChooserPreview[data-theme="solarized"] #formattedJson{color:#cfebee}body[data-theme="solarized"] .objProp,#themeChooserPreview[data-theme="solarized"] .objProp{color:#839496}body[data-theme="solarized"] .s,#themeChooserPreview[data-theme="solarized"] .s{color:#2aa198}body[data-theme="solarized"] .key,#themeChooserPreview[data-theme="solarized"] .key{color:#839496}body[data-theme="solarized"] pre,#themeChooserPreview[data-theme="solarized"] pre{color:#cfebee}body[data-theme="solarized"] a:hover,body[data-theme="solarized"] a:active,#themeChooserPreview[data-theme="solarized"] a:hover,#themeChooserPreview[data-theme="solarized"] a:active{color:#268bd2}body[data-theme="solarized"] .bl,body[data-theme="solarized"] .nl,body[data-theme="solarized"] .n,#themeChooserPreview[data-theme="solarized"] .bl,#themeChooserPreview[data-theme="solarized"] .nl,#themeChooserPreview[data-theme="solarized"] .n{color:#d33682}body[data-theme="darkorange"],#themeChooserPreview[data-theme="darkorange"]{background-color:#000}body[data-theme="darkorange"] .expander,#themeChooserPreview[data-theme="darkorange"] .expander{border-top:8px solid #ededed}body[data-theme="darkorange"] #formattedJson,body[data-theme="darkorange"] #jsonpOpener,body[data-theme="darkorange"] #jsonpCloser,#themeChooserPreview[data-theme="darkorange"] #formattedJson,#themeChooserPreview[data-theme="darkorange"] #jsonpOpener,#themeChooserPreview[data-theme="darkorange"] #jsonpCloser{color:#fff}body[data-theme="darkorange"] #formattedJson,#themeChooserPreview[data-theme="darkorange"] #formattedJson{color:#ededed}body[data-theme="darkorange"] .objProp,#themeChooserPreview[data-theme="darkorange"] .objProp{color:orange}body[data-theme="darkorange"] .s,#themeChooserPreview[data-theme="darkorange"] .s{color:#90ee90}body[data-theme="darkorange"] .key,#themeChooserPreview[data-theme="darkorange"] .key{color:orange}body[data-theme="darkorange"] pre,#themeChooserPreview[data-theme="darkorange"] pre{color:#ededed}body[data-theme="darkorange"] a:hover,body[data-theme="darkorange"] a:active,#themeChooserPreview[data-theme="darkorange"] a:hover,#themeChooserPreview[data-theme="darkorange"] a:active{color:#1e90ff}body[data-theme="darkorange"] .bl,body[data-theme="darkorange"] .nl,body[data-theme="darkorange"] .n,#themeChooserPreview[data-theme="darkorange"] .bl,#themeChooserPreview[data-theme="darkorange"] .nl,#themeChooserPreview[data-theme="darkorange"] .n{color:#add8e6}body[data-theme="halewa"],#themeChooserPreview[data-theme="halewa"]{background-color:#263238}body[data-theme="halewa"] .expander,#themeChooserPreview[data-theme="halewa"] .expander{border-top:8px solid #5ee38a}body[data-theme="halewa"] #formattedJson,body[data-theme="halewa"] #jsonpOpener,body[data-theme="halewa"] #jsonpCloser,#themeChooserPreview[data-theme="halewa"] #formattedJson,#themeChooserPreview[data-theme="halewa"] #jsonpOpener,#themeChooserPreview[data-theme="halewa"] #jsonpCloser{color:#60fc9f}body[data-theme="halewa"] #formattedJson,#themeChooserPreview[data-theme="halewa"] #formattedJson{color:#5ee38a}body[data-theme="halewa"] .objProp,#themeChooserPreview[data-theme="halewa"] .objProp{color:#c792ea}body[data-theme="halewa"] .s,#themeChooserPreview[data-theme="halewa"] .s{color:#ffcb6b}body[data-theme="halewa"] .key,#themeChooserPreview[data-theme="halewa"] .key{color:#c792ea}body[data-theme="halewa"] pre,#themeChooserPreview[data-theme="halewa"] pre{color:#5ee38a}body[data-theme="halewa"] a:hover,body[data-theme="halewa"] a:active,#themeChooserPreview[data-theme="halewa"] a:hover,#themeChooserPreview[data-theme="halewa"] a:active{color:#50a3d8}body[data-theme="halewa"] .bl,body[data-theme="halewa"] .nl,body[data-theme="halewa"] .n,#themeChooserPreview[data-theme="halewa"] .bl,#themeChooserPreview[data-theme="halewa"] .nl,#themeChooserPreview[data-theme="halewa"] .n{color:#6dc2b8}'
                        );
                    }

                    djsonContent.innerHTML = '<p id="formattingMsg"><span class="loader"></span> Formatting...</p>';

                    var formattingMsg = document.getElementById('formattingMsg');
                    // TODO: set formattingMsg to visible after about 300ms (so faster than this doesn't require it)
                    formattingMsg.hidden = true;
                    setTimeout(function () {
                        formattingMsg.hidden = false;
                    }, 250);

                    var theme = localStorage.getItem("theme");
                    if (theme) {
                        document.body.setAttribute("data-theme", theme);
                    }

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

                    // Create option bar
                    var optionBar = document.createElement('div');
                    optionBar.id = 'optionBar';

                    //create theme chooser
                    var themeChooser = document.createElement('div');
                    themeChooser.id = 'themeChooser';
                    themeChooser.addEventListener('click', function () {
                        var isThemeChooserContainerHidden = themeChooserContainer.offsetParent === null;
                        themeChooserContainer.style.display = isThemeChooserContainerHidden ? 'block' : 'none';
                    });

                    var themeChooserContainer = document.createElement('div');
                    themeChooserContainer.id = 'themeChooserContainer';
                    var themeChooserTitle = document.createElement('div');
                    themeChooserTitle.id = 'themeChooserTitle';
                    themeChooserTitle.innerText = 'Theme Chooser';
                    themeChooserContainer.appendChild(themeChooserTitle);
                    var themeChooserPreview = document.createElement('div');
                    themeChooserPreview.id = 'themeChooserPreview';
                    var themeChooserPreviewPre = document.createElement('pre');
                    themeChooserPreviewPre.innerHTML = '<span class="b">{</span><br/>    "<span class="key">number</span>": <span class="n">0.3</span>,<br/>    "<span class="key">sting</span>": <span class="s">"DJSON"</span>,</br>    "<span class="key">null</span>": <span class="a">"https://github.com/dardesantis/DJSON-Viewer"</span></br/><span class="b">}</span>';
                    themeChooserPreview.appendChild(themeChooserPreviewPre);
                    var themeChooserSelectContainer = document.createElement('div');
                    themeChooserSelectContainer.id = 'themeChooserSelectContainer';
                    var themeChooserSelect = document.createElement('select');

                    supportedThemes.forEach(function (themeName) {
                        var option = document.createElement('option');
                        option.value = themeName;
                        option.innerText = themeName;
                        if(theme && theme == themeName){
                            option.selected = 'selected';
                            themeChooserPreview.setAttribute('data-theme', themeName);
                        }
                        themeChooserSelect.appendChild(option);
                    });
                    themeChooserSelect.addEventListener('change', function () {
                        var selectedTheme = this.options[this.selectedIndex].value;
                        themeChooserPreview.setAttribute('data-theme', selectedTheme);
                    });
                    themeChooserSelectContainer.appendChild(themeChooserSelect);
                    themeChooserContainer.appendChild(themeChooserSelectContainer);
                    themeChooserContainer.appendChild(themeChooserPreview);
                    var themeChooserSaveButton = document.createElement('button');
                    themeChooserSaveButton.type = 'button';
                    themeChooserSaveButton.id = 'themeChooserSaveButton';
                    themeChooserSaveButton.innerText = 'Save';
                    themeChooserContainer.appendChild(themeChooserSaveButton);

                    themeChooserSaveButton.addEventListener('click', function () {
                        var selectedTheme = themeChooserSelect.options[themeChooserSelect.selectedIndex].value;
                        localStorage.setItem("theme", selectedTheme);
                        document.body.setAttribute("data-theme", selectedTheme);
                        themeChooserContainer.style.display = 'none';
                    });

                    // Put it in optionBar
                    optionBar.appendChild(buttonExpand);
                    optionBar.appendChild(buttonCollapse);
                    optionBar.appendChild(buttonPlain);
                    optionBar.appendChild(buttonFormatted);
                    optionBar.appendChild(themeChooser);
                    optionBar.appendChild(rawFormatterContainer);
                    optionBar.appendChild(themeChooserContainer);

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