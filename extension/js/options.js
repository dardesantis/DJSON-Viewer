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

    // theme
    var supportedThemes = ["default", "monokai", "xcode", "solarized", "darkorange", "halewa"];
    var theme = localStorage.getItem("theme");
    var themeChooserSelect = document.getElementById("themeChooserSelectContainer");
    themeChooserSelect= themeChooserSelect.firstElementChild;
    supportedThemes.forEach(function (themeName) {
        var option = document.createElement('option');
        option.value = themeName;
        option.innerText = themeName;
        if(theme && theme == themeName){
            option.selected = 'selected';
            document.getElementById("themeChooserPreview").setAttribute('data-theme', themeName);
        }
        themeChooserSelect.appendChild(option);
    });

    themeChooserSelect.addEventListener('change', function () {
        var selectedTheme = this.options[this.selectedIndex].value;
        themeChooserPreview.setAttribute('data-theme', selectedTheme);
        localStorage.setItem("theme", selectedTheme);
    });

    function optionInit(checkBoxId) {
        var checkbox = document.getElementById(checkBoxId);
        var localStoreItemName = checkBoxId.replace("Checkbox", "");
        var localStorageItem = localStorage.getItem(localStoreItemName);
        if(localStorageItem && localStorageItem === "true"){
            checkbox.checked = true;
        }
        checkbox.addEventListener('click', function () {
            if(checkbox.checked) {
                localStorage.setItem(localStoreItemName, true);
            } else {
                localStorage.removeItem(localStoreItemName)
            }
        });
    }

    // start JSON collapsed
    optionInit("startCollapsedCheckbox");

    // start JSON collapsed if big json
    optionInit("startCollapsedIfBigCheckbox");

    // show always count of children
    optionInit("showAlwaysCountCheckbox");

})();