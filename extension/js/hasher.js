
var tabs = {
  json : 0,
  hash : 1,
  time : 2,
  encode : 3,
  number : 4
};

/*
 *  Copy to clipboard
 */
function copyToClipboard(id) {
  $("#"+id).select(); 
  document.execCommand('copy');
}


var hasher = {
  tab : tabs.json,
  elements: {
    h1 : {
      id : tabs.hash+"md5",
      tab : tabs.hash,
      title : "MD5",
      calculate : function (input) {
        return CryptoJS.MD5(input);
      }
    },
    h2 : {
      id: tabs.hash+"sha1",
      tab : tabs.hash,
      title: "SHA-1",
      calculate: function (input) {
        return CryptoJS.SHA1(input);
      }
    },
    h3 : {
      id: tabs.hash+"sha224",
      tab : tabs.hash,
      title: "SHA-224",
      calculate: function (input) {
        return CryptoJS.SHA224(input);
      }
    },
    h4 : {
      id: tabs.hash+"sha256",
      tab : tabs.hash,
      title: "SHA-256",
      calculate: function (input) {
        return CryptoJS.SHA256(input);
      }
    },
    h5 : {
      id: tabs.hash+"sha384",
      tab : tabs.hash,
      title: "SHA-384",
      calculate: function (input) {
        return CryptoJS.SHA384(input);
      }
    },
    h6 : {
      id: tabs.hash+"sha512",
      tab : tabs.hash,
      title: "SHA-512",
      calculate: function (input) {
        return CryptoJS.SHA512(input);
      }
    },

    // Time
    time1 : {
      id: tabs.time+"date2ts",
      tab : tabs.time,
      title: "Unixtime",
      calculate: function (input) {
        var date;
        if (/[^\d]/.test(input)) {
          date = new Date(input);
        } else {
          date = new Date(1000*parseInt(input));
        }
        if (!isNaN(date.getTime())) {
          return date.getTime()/1000;
        }
        return "";
      }
    },
    time2 : {
      id: tabs.time+"ts2date",
      tab : tabs.time,
      title: "Local time",
      calculate: function (input) {
        var date;
        if (/[^\d]/.test(input)) {
          date = new Date(input);
        } else {
          date = new Date(1000*parseInt(input));
        }
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
        return "";
      }
    },
    time3 : {
      id: tabs.time+"date2sql",
      tab : tabs.time,
      title: "DATETIME (local)",
      calculate: function (input) {
        var ddd;
        if (/[^\d]/.test(input)) {
          ddd = new Date(input);
        } else {
          ddd = new Date(1000*parseInt(input));
        }
        if (!isNaN(ddd.getTime())) {
          var y = ddd.getFullYear();
          var m = ddd.getMonth() + 1;
          var d = ddd.getDate();
          var h = ddd.getHours();
          var i = ddd.getMinutes();
          var s = ddd.getSeconds();
          
          m = (m < 10) ? "0" + m : m;
          d = (d < 10) ? "0" + d : d;
          h = (h < 10) ? "0" + h : h;
          i = (i < 10) ? "0" + i : i;
          s = (s < 10) ? "0" + s : s;
          
          return y + "-" + m + "-" + d + " " + h + ":" + i + ":" + s;
        }
        return "";
      }
    },
    time31 : {
      id: tabs.time+"date2sqlutc",
      tab : tabs.time,
      title: "DATETIME (UTC)",
      calculate: function (input) {
        var ddd;
        if (/[^\d]/.test(input)) {
          ddd = new Date(input);
        } else {
          ddd = new Date(1000*parseInt(input));
        }
        if (!isNaN(ddd.getTime())) {
          var y = ddd.getUTCFullYear();
          var m = ddd.getUTCMonth() + 1;
          var d = ddd.getUTCDate();
          var h = ddd.getUTCHours();
          var i = ddd.getUTCMinutes();
          var s = ddd.getUTCSeconds();
          
          m = (m < 10) ? "0" + m : m;
          d = (d < 10) ? "0" + d : d;
          h = (h < 10) ? "0" + h : h;
          i = (i < 10) ? "0" + i : i;
          s = (s < 10) ? "0" + s : s;
          
          return y + "-" + m + "-" + d + " " + h + ":" + i + ":" + s;
        }
        return "";
      }
    },
    time4 : {
      id: tabs.time+"ts2RFC1123",
      tab : tabs.time,
      title: "RFC-1123",
      calculate: function (input) {
        var date;
        if (/[^\d]/.test(input)) {
          date = new Date(input);
        } else {
          date = new Date(1000*parseInt(input));
        }
        if (!isNaN(date.getTime())) {
          return date.toUTCString();
        }
        return "";
      }
    },
    time5 : {
      id: tabs.time+"date2iso",
      tab : tabs.time,
      title: "ISO 8601",
      calculate: function (input) {
        var date;
        if (/[^\d]/.test(input)) {
          date = new Date(input);
        } else {
          date = new Date(1000*parseInt(input));
        }
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
        return "";
      }
    },


    // Numbers
    n5 : {
      id: tabs.number+"i5",
      tab : tabs.number,
      title: "Dec to Hex",
      ruler: 1,
      calculate: function (input) {
        return numbers.decToHex(input);
      }
    },
    n6 : {
      id: tabs.number+"i6",
      tab : tabs.number,
      title: "Hex to Dec",
      calculate: function (input) {
        return numbers.hexToDec(input);
      }
    },
    n7 : {
      id: tabs.number+"i7",
      tab : tabs.number,
      title: "Dec to Bin",
      ruler: 1,
      calculate: function (input) {
        return numbers.decToBin(input);
      }
    },
    n8 : {
      id: tabs.number+"i8",
      tab : tabs.number,
      title: "Bin to Dec",
      calculate: function (input) {
        return numbers.binToDec(input);
      }
    },
    n9 : {
      id: tabs.number+"i3",
      tab : tabs.number,
      title: "Dec to Roman",
      calculate: function (input) {
        var rc = new RomanConverter();
        return rc.decToRoman(input);
      }
    },
    n10 : {
      id: tabs.number+"i4",
      tab : tabs.number,
      title: "Roman to Dec",
      calculate: function (input) {
        var rc = new RomanConverter();
        return rc.romanToDec(input);
      }
    },


    // Strings
    s1 : {
      id: tabs.string+"i1",
      tab : tabs.string,
      title: "ASCII to Hex",
      ruler: 2,
      calculate: function (input) {
        try {
          var words = CryptoJS.enc.Latin1.parse(input);
          return CryptoJS.enc.Hex.stringify(words);
        } catch (err) {
          return "Parse error";
        }
      }
    },
    s2 : {
      id: tabs.string+"i2",
      tab : tabs.string,
      title: "Hex to ASCII",
      calculate: function (input) {
        if (/[^0-9a-f]/i.test(input)) {
          return "NaN";
        }
        try {
          var words = CryptoJS.enc.Hex.parse(input);
          return CryptoJS.enc.Latin1.stringify(words);
        } catch (err) {
          return "Parse error";
        }
        return "";
      }
    },
    s3 : {
      id: tabs.string+"utf8-hex",
      tab : tabs.string,
      title: "UTF-8 to Hex",
      ruler: 2,
      calculate: function (input) {
        try {
          var words = CryptoJS.enc.Utf8.parse(input);
          return CryptoJS.enc.Hex.stringify(words);
        } catch (err) {
          return "Parse error";
        }
      }
    },
    s4 : {
      id: tabs.string+"hex-utf8",
      tab : tabs.string,
      title: "Hex to UTF-8",
      calculate: function (input) {
        if (/[^0-9a-f]/i.test(input)) {
          return "NaN";
        }
        try {
          var words = CryptoJS.enc.Hex.parse(input);
          return CryptoJS.enc.Utf8.stringify(words);
        } catch (err) {
          return "Parse error";
        }
        return "";
      }
    },
    s5 : {
      id: tabs.string+"utf16-hex",
      tab : tabs.string,
      title: "UTF-16 to Hex",
      ruler: 2,
      calculate: function (input) {
        try {
          var words = CryptoJS.enc.Utf16.parse(input);
          return CryptoJS.enc.Hex.stringify(words);
        } catch (err) {
          return "Parse error";
        }
      }
    },
    s6 : {
      id: tabs.string+"hex-utf16",
      tab : tabs.string,
      title: "Hex to UTF-16",
      calculate: function (input) {
        if (/[^0-9a-f]/i.test(input)) {
          return "NaN";
        }
        try {
          var words = CryptoJS.enc.Hex.parse(input);
          return CryptoJS.enc.Utf16.stringify(words);
        } catch (err) {
          return "Parse error";
        }
        return "";
      }
    },


    // Encode
    e1: {
      id : tabs.encode+"base64",
      tab : tabs.encode,
      title : "Base64",
      calculate : function (input) {
        try {
          var words = CryptoJS.enc.Utf8.parse(input);
          return CryptoJS.enc.Base64.stringify(words);
        } catch (err) {
          return "Parse error";
        }
      }
    },
    e2: {
      id : tabs.encode+"base64-d",
      tab : tabs.encode,
      title : "Base64 decode",
      calculate : function (input) {
        try {
          var words = CryptoJS.enc.Base64.parse(input);
          return CryptoJS.enc.Utf8.stringify(words);
        } catch (err) {
          return "";
        }
      }
    },
    e3: {
      id : tabs.encode+"base64-d-h",
      tab : tabs.encode,
      title : "Base64 decode to Hex",
      ruler: 2,
      calculate : function (input) {
        try {
          var words = CryptoJS.enc.Base64.parse(input);
          return CryptoJS.enc.Hex.stringify(words);
        } catch (err) {
          return "Parse error";
        }
      }
    },
    e4: {
      id : tabs.encode+"encodeURI",
      tab : tabs.encode,
      title : "JavaScript encodeURI()",
      calculate : function (input) {
        return encodeURI(input);
      }
    },
    e5: {
      id : tabs.encode+"encodeURIComponent",
      tab : tabs.encode,
      title : "JavaScript encodeURIComponent()",
      calculate : function (input) {
        return encodeURIComponent(input);
      }
    },
    e6: {
      id : tabs.encode+"decodeURI",
      tab : tabs.encode,
      title : "JavaScript decodeURI()",
      calculate : function (input) {
        return decodeURI(input);
      }
    },
    e7: {
      id : tabs.encode+"decodeURIComponent",
      tab : tabs.encode,
      title : "JavaScript decodeURIComponent()",
      calculate : function (input) {
        return decodeURIComponent(input);
      }
    },
    e8: {
      id : tabs.encode+"htmlspecialchars",
      tab : tabs.encode,
      title : "HTML special chars",
      calculate : function (input) {
        function escapeHtml(html) {
          return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }          

        return escapeHtml(input);
      }
    },
    e9: {
      id : tabs.encode+"htmlspecialchars-d",
      tab : tabs.encode,
      title : "HTML special chars decode",
      calculate : function (input) {
        function unescapeHtml(html) {
          return html
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
        }          

        return unescapeHtml(input);
      }
    }
  },
  getElementById : function (id) {
    for (i in this.elements) {
      if (this.elements[i].id === id) {
        return this.elements[i];
      }
    }
    return null;
  },
  /*
   */
  init : function () {
    // render HTML
    this.render();
    // Register click events
    for (var i in this.elements) {
      if (this.elements.hasOwnProperty(i) && this.elements[i].tab === this.tab) {
        // expand textarea
        $("#"+this.elements[i].id+"-expand").click(function () {
          var id = this.id.toString().replace("-expand", "");
          if (!$("#"+this.id).hasClass("on")) {
            var element = hasher.getElementById(id);
              if (element) {
                $("#"+id).attr("rows", element.rows);
              }
          } else {
            $("#"+id).attr("rows", "1");
          }
          $("#"+this.id).toggleClass("on");
        });
        // copy to clibboard on click
        $("#"+this.elements[i].id+"-value").click(function () {
          $("#output .note").hide();
          var id = this.id.toString().replace("-value", "");
          if ($("#"+id).val().length > 0) {
            $("#"+id+"-note").text("copied").show('fast');
            copyToClipboard(id);
          }
        });
      }
    }
  },
  /*
   * Recalculate
   */
  update : function () {
    $("#output .note").hide();
    var input = $("#input-value").val();
    for (var i in this.elements) {
      this.elements[i].rows = 0;
      if (this.elements[i].tab === this.tab) {
        // main calculation
        var value = this.elements[i].calculate(input);
        $("#"+this.elements[i].id).val(value);

        // expand
        var res = value.toString().match(/(\n\r|\r\n|\n|\r)/g);
        var rows = 1;
        if (res != null && res.length != undefined) {
          rows = res.length + 1;
        }
        
        this.elements[i].rows = rows;
        if (rows > 1) {
          $("#"+this.elements[i].id+"-expand").show().text(rows + " lines").show();
        } else {
          $("#"+this.elements[i].id+"-expand").text("").hide();
        }

        // show ruler
        if (this.elements[i].ruler != undefined) {
          $("#"+this.elements[i].id+"-ruler").html(this.ruler(value, this.elements[i].ruler));
        }
      }
    }
  },
  /*
   * 
   */
  render : function () {
    if (this.tab === tabs.json) {
        $(".containerDiv").show();
    } else {
        $(".containerDiv").hide();
    }
    $("#output").html("");
    for (var i in this.elements) {
      if (this.elements[i].tab === this.tab) {
        var html = 
          '<div class="element">'+
            '<div>'+
              '<span id="'+this.elements[i].id+'-title" class="title">'+
                this.elements[i].title+
              '</span>'+
              '<span id="'+this.elements[i].id+'-expand" class="expand"></span>'+
              '<span id="'+this.elements[i].id+'-note" class="note"></span>'+
            '</div>'+
            '<div id="'+this.elements[i].id+'-value" class="value">'+
              '<textarea id="'+this.elements[i].id+'" rows="1"></textarea>';
              // ruler
              if (this.elements[i].ruler != undefined) {
                html += '<div id="'+this.elements[i].id+'-ruler" class="ruler"></div>'
              }
        html += 
            '</div>'+
          '</div>';
        $("#output").append(html);
      }
    }
  },
  /*
   * Symbol's numbers
   */
  ruler : function (value, type) {
    var html = "";
    var length = value.length;
    if (type === -1) {
      for (var i = 0; i < value.length; i++) {
        html += '<span title="'+(length - i - 1)+'">&nbsp;</span>';
      }
    } else if (type === 2) {
      for (i = 0; i < value.length; i+= 2) {
        html += '<span title="'+(i/2 + 1)+'">&nbsp;&nbsp;</span>';
      }
    } else {
      for (i = 0; i < value.length; i++) {
        html += '<span title="'+(i+1)+'">&nbsp;</span>';
      }
    }
    return html;
  }
};
