(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var UserAgentParser = require('user-agent-parser');
var languageMessages = require('./languages.json');

module.exports = function (options) {

  var main = function () {

    // Despite the docs, UA needs to be provided to constructor explicitly:
    // https://github.com/faisalman/ua-parser-js/issues/90
    var parsedUserAgent = new UserAgentParser(window.navigator.userAgent).getResult();

    // Variable definition (before ajax)
    var outdatedUI = document.getElementById('outdated');

    options = options || {};

    var browserLocale = window.navigator.language || window.navigator.userLanguage; // Everyone else, IE

		// Set default options
    var browserSupport = options.browserSupport || {
      'Chrome': 37,
      'IE': 10,
      'Safari': 7,
      'Mobile Safari': 7,
      'Firefox': 32
    };
    // CSS property to check for. You may also like 'borderSpacing', 'boxShadow', 'transform', 'borderImage';
    var	requiredCssProperty = options.requiredCssProperty || false;
    var	backgroundColor = options.backgroundColor || '#f25648'; // Salmon
    var	textColor = options.textColor || 'white';
    var	language = options.language || browserLocale.slice(0, 2); // Language code

    var updateSource = 'web'; // Other possible values are 'googlePlay' or 'appStore'. Determines where we tell users to go for upgrades.

		// Chrome mobile is still Chrome (unlike Safari which is 'Mobile Safari')
    var isAndroid = parsedUserAgent.os.name === 'Android';
    if (isAndroid) {
      updateSource = 'googlePlay';
    }

    var isAndroidButNotChrome;
    if (options.requireChromeOnAndroid) {
      isAndroidButNotChrome = (isAndroid) && (parsedUserAgent.browser.name !== 'Chrome');
    }

    if (parsedUserAgent.os.name === 'iOS') {
      updateSource = 'appStore';
    }

    var done = true;

    var changeOpacity = function (opacityValue) {
      outdatedUI.style.opacity = opacityValue / 100;
      outdatedUI.style.filter = 'alpha(opacity=' + opacityValue + ')';
    };

    var fadeIn = function (opacityValue) {
      changeOpacity(opacityValue);
      if (opacityValue === 1) {
        outdatedUI.style.display = 'block';
      }
      if (opacityValue === 100) {
        done = true;
      }
    };

    var isBrowserOutOfDate = function () {
      var browserName = parsedUserAgent.browser.name;
      var browserMajorVersion = parsedUserAgent.browser.major;
      var isOutOfDate = false;
      if (browserSupport[browserName]) {
        if (browserMajorVersion < browserSupport[browserName]) {
          isOutOfDate = true;
        }
      }
      return isOutOfDate;
    };

    // Returns true if a browser supports a css3 property
    var isPropertySupported = function (prop) {
      if (!prop) {
        return true;
      }
      var div = document.createElement('div');
      var vendorPrefixes = 'Khtml Ms O Moz Webkit'.split(' ');
      var count = vendorPrefixes.length;

      if (div.style[prop]) {
        return true;
      }

      prop = prop.replace(/^[a-z]/, function (val) {
        return val.toUpperCase();
      });

      while (count--) {
        if (div.style[vendorPrefixes[count] + prop]) {
          return true;
        }
      }
      return false;
    };

    var makeFadeInFunction = function (x) {
      return function () {
        fadeIn(x);
      };
    };

		// Style element explicitly - TODO: investigate and delete if not needed
    var startStylesAndEvents = function () {
      var buttonClose = document.getElementById('buttonCloseUpdateBrowser');
      var buttonUpdate = document.getElementById('buttonUpdateBrowser');

      //check settings attributes
      outdatedUI.style.backgroundColor = backgroundColor;
      //way too hard to put !important on IE6
      outdatedUI.style.color = textColor;
      outdatedUI.children[0].style.color = textColor;
      outdatedUI.children[1].style.color = textColor;

      // Update button is desktop only
      if (buttonUpdate) {
        buttonUpdate.style.color = textColor;
        if (buttonUpdate.style.borderColor) {
          buttonUpdate.style.borderColor = textColor;
        }

        // Override the update button color to match the background color
        buttonUpdate.onmouseover = function () {
          this.style.color = backgroundColor;
          this.style.backgroundColor = textColor;
        };

        buttonUpdate.onmouseout = function () {
          this.style.color = textColor;
          this.style.backgroundColor = backgroundColor;
        };
      }

      buttonClose.style.color = textColor;

      buttonClose.onmousedown = function () {
        outdatedUI.style.display = 'none';
        return false;
      };
    };

    var getmessage = function (lang) {
      var messages = languageMessages[lang] || languageMessages.en;

      var updateMessages = {
        'web': '<p>' + messages.update.web + '<a id="buttonUpdateBrowser" href="' + messages.url + '">' + messages.callToAction + '</a></p>',
        'googlePlay': '<p>' + messages.update.googlePlay +
        '<a id="buttonUpdateBrowser" href="https://play.google.com/store/apps/details?id=com.android.chrome">' + messages.callToAction + '</a></p>',
        'appStore': '<p>' + messages.update[updateSource] + '</p>'
      };

      var updateMessage = updateMessages[updateSource];

      return '<h6>' + messages.outOfDate + '</h6>' + updateMessage +
        '<p class="last"><a href="#" id="buttonCloseUpdateBrowser" title="' + messages.close + '">×</a></p>';
    };

		// Check if browser is supported
    if (isBrowserOutOfDate() || ! isPropertySupported(requiredCssProperty) || isAndroidButNotChrome) {

			// This is an outdated browser
      if (done && outdatedUI.style.opacity !== '1') {
        done = false;

        for (var i = 1; i <= 100; i++) {
          setTimeout(makeFadeInFunction(i), i * 8);
        }
      }

      var insertContentHere = document.getElementById('outdated');
      insertContentHere.innerHTML = getmessage(language);
      startStylesAndEvents();
    }
  };

	// Load main when DOM ready.
  var oldOnload = window.onload;
  if (typeof window.onload !== 'function') {
    window.onload = main;
  }
  else {
    window.onload = function () {
      if (oldOnload) {
        oldOnload();
      }
      main();
    };
  }
};

},{"./languages.json":2,"user-agent-parser":3}],2:[function(require,module,exports){
module.exports={
  "br": {
    "outOfDate": "O seu navegador est&aacute; desatualizado!",
    "update": {
      "web": "Atualize o seu navegador para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/br",
    "callToAction": "Atualize o seu navegador agora",
    "close": "Fechar"
  },
  "cn": {
    "outOfDate": "您的浏览器已过时",
    "update": {
      "web": "要正常浏览本网站请升级您的浏览器。",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/cn",
    "callToAction": "现在升级",
    "close": "关闭"
  },
  "cz": {
    "outOfDate": "Váš prohlížeč je zastaralý!",
    "update": {
      "web": "Pro správné zobrazení těchto stránek aktualizujte svůj prohlížeč. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/cz",
    "callToAction": "Aktualizovat nyní svůj prohlížeč",
    "close": "Zavřít"
  },
  "de": {
    "outOfDate": "Ihr Browser ist veraltet!",
    "update": {
      "web": "Bitte aktualisieren Sie Ihren Browser, um diese Website korrekt darzustellen. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/de",
    "callToAction": "Den Browser jetzt aktualisieren ",
    "close": "Schließen"
  },
  "ee": {
    "outOfDate": "Sinu veebilehitseja on vananenud!",
    "update": {
      "web": "Palun uuenda oma veebilehitsejat, et näha lehekülge korrektselt. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/ee",
    "callToAction": "Uuenda oma veebilehitsejat kohe",
    "close": "Sulge"
  },
  "en": {
    "outOfDate": "Your browser is out-of-date!",
    "update": {
      "web": "Update your browser to view this website correctly. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Update my browser now",
    "close": "Close"
  },
  "es": {
    "outOfDate": "¡Tu navegador está anticuado!",
    "update": {
      "web": "Actualiza tu navegador para ver esta página correctamente. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/es",
    "callToAction": "Actualizar mi navegador ahora",
    "close": "Cerrar"
  },
  "fa": {
    "rightToLeft": true,
    "outOfDate": "مرورگر شما منسوخ شده است!",
    "update": {
      "web": "جهت مشاهده صحیح این وبسایت، مرورگرتان را بروز رسانی نمایید. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "همین حالا مرورگرم را بروز کن",
    "close": "Close"
  },
  "fi": {
    "outOfDate": "Selaimesi on vanhentunut!",
    "update": {
      "web": "Lataa ajantasainen selain n&auml;hd&auml;ksesi t&auml;m&auml;n sivun oikein. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "P&auml;ivit&auml; selaimeni nyt ",
    "close": "Sulje"
  },
  "fr": {
    "outOfDate": "Votre navigateur est désuet!",
    "update": {
      "web": "Mettez à jour votre navigateur pour afficher correctement ce site Web. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/fr",
    "callToAction": "Mettre à jour maintenant ",
    "close": "Fermer"
  },
  "hu": {
    "outOfDate": "A böngészője elavult!",
    "update": {
      "web": "Firssítse vagy cserélje le a böngészőjét. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/hu",
    "callToAction": "A böngészőm frissítése ",
    "close": "Close"
  },
  "id":{
    "outOfDate": "Browser yang Anda gunakan sudah ketinggalan zaman!",
    "update": {
      "web": "Perbaharuilah browser Anda agar bisa menjelajahi website ini dengan nyaman. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Perbaharui browser sekarang ",
    "close": "Close"
  },
  "it": {
    "outOfDate": "Il tuo browser non &egrave; aggiornato!",
    "update": {
      "web": "Aggiornalo per vedere questo sito correttamente. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/it",
    "callToAction": "Aggiorna ora",
    "close": "Chiudi"
  },
  "lt":{
    "outOfDate": "Jūsų naršyklės versija yra pasenusi!",
    "update": {
      "web": "Atnaujinkite savo naršyklę, kad galėtumėte peržiūrėti šią svetainę tinkamai. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Atnaujinti naršyklę ",
    "close": "Close"
  },
  "nl": {
    "outOfDate": "Je gebruikt een oude browser!",
    "update": {
      "web": "Update je browser om deze website correct te bekijken. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/nl",
    "callToAction": "Update mijn browser nu ",
    "close": "Sluiten"
  },
  "pl": {
    "outOfDate": "Twoja przeglądarka jest przestarzała!",
    "update": {
      "web": "Zaktualizuj swoją przeglądarkę, aby poprawnie wyświetlić tę stronę. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/pl",
    "callToAction": "Zaktualizuj przeglądarkę już teraz",
    "close": "Close"
  },
  "pt": {
    "outOfDate": "O seu browser est&aacute; desatualizado!",
    "update": {
      "web": "Atualize o seu browser para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/pt",
    "callToAction": "Atualize o seu browser agora",
    "close": "Fechar"
  },
  "ro": {
    "outOfDate": "Browserul este învechit!",
    "update": {
      "web": "Actualizați browserul pentru a vizualiza corect acest site. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Actualizați browserul acum!",
    "close": "Close"
  },
  "ru": {
    "outOfDate": "Ваш браузер устарел!",
    "update": {
      "web": "Обновите ваш браузер для правильного отображения этого сайта. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/ru",
    "callToAction": "Обновить мой браузер ",
    "close": "Закрыть"
  },
  "si": {
    "outOfDate": "Vaš brskalnik je zastarel!",
    "update": {
      "web": "Za pravilen prikaz spletne strani posodobite vaš brskalnik. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/si",
    "callToAction": "Posodobi brskalnik ",
    "close": "Zapri"
  },
  "sv": {
    "outOfDate": "Din webbläsare stödjs ej längre!",
    "update": {
      "web": "Uppdatera din webbläsare för att webbplatsen ska visas korrekt. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
    "callToAction": "Uppdatera min webbläsare nu",
    "close": "Stäng"
  },
  "ua": {
    "outOfDate": "Ваш браузер застарів!",
    "update": {
      "web": "Оновіть ваш браузер для правильного відображення цього сайта. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/ua",
    "callToAction": "Оновити мій браузер ",
    "close": "Закрити"
  }
}

},{}],3:[function(require,module,exports){
// UAParser.js v0.6.0
// Lightweight JavaScript-based User-Agent string parser
// https://github.com/faisalman/ua-parser-js
//
// Copyright © 2012-2013 Faisalman <fyzlman@gmail.com>
// Dual licensed under GPLv2 & MIT

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        MAJOR       = 'major',
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet';


    ///////////
    // Helper
    //////////


    var util = {
        has : function (str1, str2) {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
        },
        lowerize : function (str) {
            return str.toLowerCase();
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function () {

            // loop through all regexes maps
            for (var result, i = 0, j, k, p, q, matches, match, args = arguments; i < args.length; i += 2) {

                var regex = args[i],       // even sequence (0,2,4,..)
                    props = args[i + 1];   // odd sequence (1,3,5,..)

                // construct object barebones
                if (typeof(result) === UNDEF_TYPE) {
                    result = {};
                    for (p in props) {
                        q = props[p];
                        if (typeof(q) === OBJ_TYPE) {
                            result[q[0]] = undefined;
                        } else {
                            result[q] = undefined;
                        }
                    }
                }

                // try matching uastring with regexes
                for (j = k = 0; j < regex.length; j++) {
                    matches = regex[j].exec(this.getUA());
                    if (!!matches) {
                        for (p in props) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof(q) === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof(q[1]) == FUNC_TYPE) {
                                        // assign modified match
                                        result[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        result[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof(q[1]) === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                result[q] = match ? match : undefined;
                            }
                        }
                        break;
                    }
                }

                if(!!matches) break; // break the loop immediately if match found
            }
            return result;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof(map[i]) === OBJ_TYPE && map[i].length > 0) {
                    for (var j in map[i]) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                major : {
                    '1' : ['/8', '/1', '/3'],
                    '2' : '/4',
                    '?' : '/'
                },
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/((\d+)?[\w\.-]+)/i,                                 // Opera Mini
            /(opera\s[mobiletab]+).+version\/((\d+)?[\w\.-]+)/i,                // Opera Mobi/Tablet
            /(opera).+version\/((\d+)?[\w\.]+)/i,                               // Opera > 9.80
            /(opera)[\/\s]+((\d+)?[\w\.]+)/i                                    // Opera < 9.80

            ], [NAME, VERSION, MAJOR], [

            /\s(opr)\/((\d+)?[\w\.]+)/i                                         // Opera Webkit
            ], [[NAME, 'Opera'], VERSION, MAJOR], [

            // Mixed
            /(kindle)\/((\d+)?[\w\.]+)/i,                                       // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?((\d+)?[\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?((\d+)?[\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s((\d+)?[\w\.]+)/i,                                  // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)((?:\/)[\w\.]+)*/i,                                        // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt)\/((\d+)?[\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt
            ], [NAME, VERSION, MAJOR], [

            /(yabrowser)\/((\d+)?[\w\.]+)/i                                     // Yandex
            ], [[NAME, 'Yandex'], VERSION, MAJOR], [

            /(comodo_dragon)\/((\d+)?[\w\.]+)/i                                 // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION, MAJOR], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?((\d+)?[\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION, MAJOR], [

            /(dolfin)\/((\d+)?[\w\.]+)/i                                        // Dolphin
            ], [[NAME, 'Dolphin'], VERSION, MAJOR], [

            /((?:android.+)crmo|crios)\/((\d+)?[\w\.]+)/i                       // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION, MAJOR], [

            /version\/((\d+)?[\w\.]+).+?mobile\/\w+\s(safari)/i                 // Mobile Safari
            ], [VERSION, MAJOR, [NAME, 'Mobile Safari']], [

            /version\/((\d+)?[\w\.]+).+?(mobile\s?safari|safari)/i              // Safari & Safari Mobile
            ], [VERSION, MAJOR, NAME], [

            /webkit.+?(mobile\s?safari|safari)((\/[\w\.]+))/i                   // Safari < 3.0
            ], [NAME, [MAJOR, mapper.str, maps.browser.oldsafari.major], [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/((\d+)?[\w\.]+)/i,                                    // Konqueror
            /(webkit|khtml)\/((\d+)?[\w\.]+)/i
            ], [NAME, VERSION, MAJOR], [

            // Gecko based
            /(navigator|netscape)\/((\d+)?[\w\.-]+)/i                           // Netscape
            ], [[NAME, 'Netscape'], VERSION, MAJOR], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?((\d+)?[\w\.\+]+)/i,
                                                                                // Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/((\d+)?[\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/((\d+)?[\w\.]+).+rv\:.+gecko\/\d+/i,                    // Mozilla

            // Other
            /(uc\s?browser|polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf)[\/\s]?((\d+)?[\w\.]+)/i,
                                                                                // UCBrowser/Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf
            /(links)\s\(((\d+)?[\w\.]+)/i,                                      // Links
            /(gobrowser)\/?((\d+)?[\w\.]+)*/i,                                  // GoBrowser
            /(ice\s?browser)\/v?((\d+)?[\w\._]+)/i,                             // ICE Browser
            /(mosaic)[\/\s]((\d+)?[\w\.]+)/i                                    // Mosaic
            ], [NAME, VERSION, MAJOR]
        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /(ia64(?=;)|68k(?=\))|arm(?=v\d+;)|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM, IRIX, MIPS, SPARC, PA-RISC
            ], [ARCHITECTURE, util.lowerize]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\((ip[honed]+);.+(apple)/i                                         // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\((bb10);\s(\w+)/i                                                 // BlackBerry 10
            ], [[VENDOR, 'BlackBerry'], MODEL, [TYPE, MOBILE]], [

            /android.+((transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+))/i       // Asus Tablets
            ], [[VENDOR, 'Asus'], MODEL, [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])/i                                           // Sony Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /((playstation)\s[3portablevi]+)/i                                  // Playstation
            ], [[VENDOR, 'Sony'], MODEL, [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /\s((milestone|droid[2x]?))[globa\s]*\sbuild\//i,                   // Motorola
            /(mot)[\s-]?(\w+)*/i
            ], [[VENDOR, 'Motorola'], MODEL, [TYPE, MOBILE]], [
            /android.+\s((mz60\d|xoom[\s2]{0,2}))\sbuild\//i
            ], [[VENDOR, 'Motorola'], MODEL, [TYPE, TABLET]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n8000|sgh-t8[56]9))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [
            /(sie)-(\w+)*/i                                                     // Siemens
            ], [[VENDOR, 'Siemens'], MODEL, [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w-;]{10}((a\d{3}))/i                               // Acer
            ], [[VENDOR, 'Acer'], MODEL, [TYPE, TABLET]], [

            /android\s3\.[\s\w-;]{10}(lg?)-([06cv9]{3,4})/i                     // LG
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /((nexus\s4))/i,
            /(lg)[e;\s-\/]+(\w+)*/i
            ], [[VENDOR, 'LG'], MODEL, [TYPE, MOBILE]], [

            /(mobile|tablet);.+rv\:.+gecko\//i                                  // Unidentifiable
            ], [TYPE, VENDOR, MODEL]
        ],

        engine : [[

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*|windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)\/([\w\.]+)/i,                                              // Tizen
            /(android|webos|palm\os|qnx|bada|rim\stablet\sos|meego)[\/\s-]?([\w\.]+)*/i
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION],[
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids3portablevu]+)/i,                    // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk)[\/\s-]?([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(ip[honead]+)(?:.*os\s*([\w]+)*\slike\smac|;\sopera)/i             // iOS
            ], [[NAME, 'iOS'], [VERSION, /_/g, '.']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i                                    // Mac OS
            ], [NAME, [VERSION, /_/g, '.']], [

            // Other
            /(haiku)\s(\w+)/i,                                                  // Haiku
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(macintosh|mac(?=_powerpc)|plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };

    var UAParser = function UAParser (uastring) {
        if (!(this instanceof UAParser)) return new UAParser(uastring).getResult();

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring).getResult();
        }
        this.getBrowser = function () {
            return mapper.rgx.apply(this, regexes.browser);
        };
        this.getCPU = function () {
            return mapper.rgx.apply(this, regexes.cpu);
        };
        this.getDevice = function () {
            return mapper.rgx.apply(this, regexes.device);
        };
        this.getEngine = function () {
            return mapper.rgx.apply(this, regexes.engine);
        };
        this.getOS = function () {
            return mapper.rgx.apply(this, regexes.os);
        };
        this.getResult = function() {
            return {
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        this.setUA(ua);
    };

    module.exports = UAParser;
})(this);

},{}],4:[function(require,module,exports){
var outdatedBrowserFork = require("outdated-browser-rework");

outdatedBrowserFork({
    browserSupport: {
        'IE': 9,
        'Safari': 7
    }
});

},{"outdated-browser-rework":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvb3V0ZGF0ZWQtYnJvd3Nlci1yZXdvcmsvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb3V0ZGF0ZWQtYnJvd3Nlci1yZXdvcmsvbGFuZ3VhZ2VzLmpzb24iLCJub2RlX21vZHVsZXMvb3V0ZGF0ZWQtYnJvd3Nlci1yZXdvcmsvbm9kZV9tb2R1bGVzL3VzZXItYWdlbnQtcGFyc2VyL3NyYy91YS1wYXJzZXIuanMiLCJzcmMvanMvb2xkYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFVzZXJBZ2VudFBhcnNlciA9IHJlcXVpcmUoJ3VzZXItYWdlbnQtcGFyc2VyJyk7XG52YXIgbGFuZ3VhZ2VNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbGFuZ3VhZ2VzLmpzb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gIHZhciBtYWluID0gZnVuY3Rpb24gKCkge1xuXG4gICAgLy8gRGVzcGl0ZSB0aGUgZG9jcywgVUEgbmVlZHMgdG8gYmUgcHJvdmlkZWQgdG8gY29uc3RydWN0b3IgZXhwbGljaXRseTpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmFpc2FsbWFuL3VhLXBhcnNlci1qcy9pc3N1ZXMvOTBcbiAgICB2YXIgcGFyc2VkVXNlckFnZW50ID0gbmV3IFVzZXJBZ2VudFBhcnNlcih3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkuZ2V0UmVzdWx0KCk7XG5cbiAgICAvLyBWYXJpYWJsZSBkZWZpbml0aW9uIChiZWZvcmUgYWpheClcbiAgICB2YXIgb3V0ZGF0ZWRVSSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRkYXRlZCcpO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB2YXIgYnJvd3NlckxvY2FsZSA9IHdpbmRvdy5uYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgd2luZG93Lm5hdmlnYXRvci51c2VyTGFuZ3VhZ2U7IC8vIEV2ZXJ5b25lIGVsc2UsIElFXG5cblx0XHQvLyBTZXQgZGVmYXVsdCBvcHRpb25zXG4gICAgdmFyIGJyb3dzZXJTdXBwb3J0ID0gb3B0aW9ucy5icm93c2VyU3VwcG9ydCB8fCB7XG4gICAgICAnQ2hyb21lJzogMzcsXG4gICAgICAnSUUnOiAxMCxcbiAgICAgICdTYWZhcmknOiA3LFxuICAgICAgJ01vYmlsZSBTYWZhcmknOiA3LFxuICAgICAgJ0ZpcmVmb3gnOiAzMlxuICAgIH07XG4gICAgLy8gQ1NTIHByb3BlcnR5IHRvIGNoZWNrIGZvci4gWW91IG1heSBhbHNvIGxpa2UgJ2JvcmRlclNwYWNpbmcnLCAnYm94U2hhZG93JywgJ3RyYW5zZm9ybScsICdib3JkZXJJbWFnZSc7XG4gICAgdmFyXHRyZXF1aXJlZENzc1Byb3BlcnR5ID0gb3B0aW9ucy5yZXF1aXJlZENzc1Byb3BlcnR5IHx8IGZhbHNlO1xuICAgIHZhclx0YmFja2dyb3VuZENvbG9yID0gb3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IgfHwgJyNmMjU2NDgnOyAvLyBTYWxtb25cbiAgICB2YXJcdHRleHRDb2xvciA9IG9wdGlvbnMudGV4dENvbG9yIHx8ICd3aGl0ZSc7XG4gICAgdmFyXHRsYW5ndWFnZSA9IG9wdGlvbnMubGFuZ3VhZ2UgfHwgYnJvd3NlckxvY2FsZS5zbGljZSgwLCAyKTsgLy8gTGFuZ3VhZ2UgY29kZVxuXG4gICAgdmFyIHVwZGF0ZVNvdXJjZSA9ICd3ZWInOyAvLyBPdGhlciBwb3NzaWJsZSB2YWx1ZXMgYXJlICdnb29nbGVQbGF5JyBvciAnYXBwU3RvcmUnLiBEZXRlcm1pbmVzIHdoZXJlIHdlIHRlbGwgdXNlcnMgdG8gZ28gZm9yIHVwZ3JhZGVzLlxuXG5cdFx0Ly8gQ2hyb21lIG1vYmlsZSBpcyBzdGlsbCBDaHJvbWUgKHVubGlrZSBTYWZhcmkgd2hpY2ggaXMgJ01vYmlsZSBTYWZhcmknKVxuICAgIHZhciBpc0FuZHJvaWQgPSBwYXJzZWRVc2VyQWdlbnQub3MubmFtZSA9PT0gJ0FuZHJvaWQnO1xuICAgIGlmIChpc0FuZHJvaWQpIHtcbiAgICAgIHVwZGF0ZVNvdXJjZSA9ICdnb29nbGVQbGF5JztcbiAgICB9XG5cbiAgICB2YXIgaXNBbmRyb2lkQnV0Tm90Q2hyb21lO1xuICAgIGlmIChvcHRpb25zLnJlcXVpcmVDaHJvbWVPbkFuZHJvaWQpIHtcbiAgICAgIGlzQW5kcm9pZEJ1dE5vdENocm9tZSA9IChpc0FuZHJvaWQpICYmIChwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5uYW1lICE9PSAnQ2hyb21lJyk7XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlZFVzZXJBZ2VudC5vcy5uYW1lID09PSAnaU9TJykge1xuICAgICAgdXBkYXRlU291cmNlID0gJ2FwcFN0b3JlJztcbiAgICB9XG5cbiAgICB2YXIgZG9uZSA9IHRydWU7XG5cbiAgICB2YXIgY2hhbmdlT3BhY2l0eSA9IGZ1bmN0aW9uIChvcGFjaXR5VmFsdWUpIHtcbiAgICAgIG91dGRhdGVkVUkuc3R5bGUub3BhY2l0eSA9IG9wYWNpdHlWYWx1ZSAvIDEwMDtcbiAgICAgIG91dGRhdGVkVUkuc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9JyArIG9wYWNpdHlWYWx1ZSArICcpJztcbiAgICB9O1xuXG4gICAgdmFyIGZhZGVJbiA9IGZ1bmN0aW9uIChvcGFjaXR5VmFsdWUpIHtcbiAgICAgIGNoYW5nZU9wYWNpdHkob3BhY2l0eVZhbHVlKTtcbiAgICAgIGlmIChvcGFjaXR5VmFsdWUgPT09IDEpIHtcbiAgICAgICAgb3V0ZGF0ZWRVSS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIH1cbiAgICAgIGlmIChvcGFjaXR5VmFsdWUgPT09IDEwMCkge1xuICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGlzQnJvd3Nlck91dE9mRGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWU7XG4gICAgICB2YXIgYnJvd3Nlck1ham9yVmVyc2lvbiA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm1ham9yO1xuICAgICAgdmFyIGlzT3V0T2ZEYXRlID0gZmFsc2U7XG4gICAgICBpZiAoYnJvd3NlclN1cHBvcnRbYnJvd3Nlck5hbWVdKSB7XG4gICAgICAgIGlmIChicm93c2VyTWFqb3JWZXJzaW9uIDwgYnJvd3NlclN1cHBvcnRbYnJvd3Nlck5hbWVdKSB7XG4gICAgICAgICAgaXNPdXRPZkRhdGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaXNPdXRPZkRhdGU7XG4gICAgfTtcblxuICAgIC8vIFJldHVybnMgdHJ1ZSBpZiBhIGJyb3dzZXIgc3VwcG9ydHMgYSBjc3MzIHByb3BlcnR5XG4gICAgdmFyIGlzUHJvcGVydHlTdXBwb3J0ZWQgPSBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgaWYgKCFwcm9wKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdmFyIHZlbmRvclByZWZpeGVzID0gJ0todG1sIE1zIE8gTW96IFdlYmtpdCcuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBjb3VudCA9IHZlbmRvclByZWZpeGVzLmxlbmd0aDtcblxuICAgICAgaWYgKGRpdi5zdHlsZVtwcm9wXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcHJvcCA9IHByb3AucmVwbGFjZSgvXlthLXpdLywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsLnRvVXBwZXJDYXNlKCk7XG4gICAgICB9KTtcblxuICAgICAgd2hpbGUgKGNvdW50LS0pIHtcbiAgICAgICAgaWYgKGRpdi5zdHlsZVt2ZW5kb3JQcmVmaXhlc1tjb3VudF0gKyBwcm9wXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBtYWtlRmFkZUluRnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZmFkZUluKHgpO1xuICAgICAgfTtcbiAgICB9O1xuXG5cdFx0Ly8gU3R5bGUgZWxlbWVudCBleHBsaWNpdGx5IC0gVE9ETzogaW52ZXN0aWdhdGUgYW5kIGRlbGV0ZSBpZiBub3QgbmVlZGVkXG4gICAgdmFyIHN0YXJ0U3R5bGVzQW5kRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGJ1dHRvbkNsb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvbkNsb3NlVXBkYXRlQnJvd3NlcicpO1xuICAgICAgdmFyIGJ1dHRvblVwZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidXR0b25VcGRhdGVCcm93c2VyJyk7XG5cbiAgICAgIC8vY2hlY2sgc2V0dGluZ3MgYXR0cmlidXRlc1xuICAgICAgb3V0ZGF0ZWRVSS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBiYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAvL3dheSB0b28gaGFyZCB0byBwdXQgIWltcG9ydGFudCBvbiBJRTZcbiAgICAgIG91dGRhdGVkVUkuc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3I7XG4gICAgICBvdXRkYXRlZFVJLmNoaWxkcmVuWzBdLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yO1xuICAgICAgb3V0ZGF0ZWRVSS5jaGlsZHJlblsxXS5zdHlsZS5jb2xvciA9IHRleHRDb2xvcjtcblxuICAgICAgLy8gVXBkYXRlIGJ1dHRvbiBpcyBkZXNrdG9wIG9ubHlcbiAgICAgIGlmIChidXR0b25VcGRhdGUpIHtcbiAgICAgICAgYnV0dG9uVXBkYXRlLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yO1xuICAgICAgICBpZiAoYnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yKSB7XG4gICAgICAgICAgYnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yID0gdGV4dENvbG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgdGhlIHVwZGF0ZSBidXR0b24gY29sb3IgdG8gbWF0Y2ggdGhlIGJhY2tncm91bmQgY29sb3JcbiAgICAgICAgYnV0dG9uVXBkYXRlLm9ubW91c2VvdmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMuc3R5bGUuY29sb3IgPSBiYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgICAgdGhpcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0ZXh0Q29sb3I7XG4gICAgICAgIH07XG5cbiAgICAgICAgYnV0dG9uVXBkYXRlLm9ubW91c2VvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy5zdHlsZS5jb2xvciA9IHRleHRDb2xvcjtcbiAgICAgICAgICB0aGlzLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvcjtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgYnV0dG9uQ2xvc2Uuc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3I7XG5cbiAgICAgIGJ1dHRvbkNsb3NlLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBvdXRkYXRlZFVJLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBnZXRtZXNzYWdlID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgIHZhciBtZXNzYWdlcyA9IGxhbmd1YWdlTWVzc2FnZXNbbGFuZ10gfHwgbGFuZ3VhZ2VNZXNzYWdlcy5lbjtcblxuICAgICAgdmFyIHVwZGF0ZU1lc3NhZ2VzID0ge1xuICAgICAgICAnd2ViJzogJzxwPicgKyBtZXNzYWdlcy51cGRhdGUud2ViICsgJzxhIGlkPVwiYnV0dG9uVXBkYXRlQnJvd3NlclwiIGhyZWY9XCInICsgbWVzc2FnZXMudXJsICsgJ1wiPicgKyBtZXNzYWdlcy5jYWxsVG9BY3Rpb24gKyAnPC9hPjwvcD4nLFxuICAgICAgICAnZ29vZ2xlUGxheSc6ICc8cD4nICsgbWVzc2FnZXMudXBkYXRlLmdvb2dsZVBsYXkgK1xuICAgICAgICAnPGEgaWQ9XCJidXR0b25VcGRhdGVCcm93c2VyXCIgaHJlZj1cImh0dHBzOi8vcGxheS5nb29nbGUuY29tL3N0b3JlL2FwcHMvZGV0YWlscz9pZD1jb20uYW5kcm9pZC5jaHJvbWVcIj4nICsgbWVzc2FnZXMuY2FsbFRvQWN0aW9uICsgJzwvYT48L3A+JyxcbiAgICAgICAgJ2FwcFN0b3JlJzogJzxwPicgKyBtZXNzYWdlcy51cGRhdGVbdXBkYXRlU291cmNlXSArICc8L3A+J1xuICAgICAgfTtcblxuICAgICAgdmFyIHVwZGF0ZU1lc3NhZ2UgPSB1cGRhdGVNZXNzYWdlc1t1cGRhdGVTb3VyY2VdO1xuXG4gICAgICByZXR1cm4gJzxoNj4nICsgbWVzc2FnZXMub3V0T2ZEYXRlICsgJzwvaDY+JyArIHVwZGF0ZU1lc3NhZ2UgK1xuICAgICAgICAnPHAgY2xhc3M9XCJsYXN0XCI+PGEgaHJlZj1cIiNcIiBpZD1cImJ1dHRvbkNsb3NlVXBkYXRlQnJvd3NlclwiIHRpdGxlPVwiJyArIG1lc3NhZ2VzLmNsb3NlICsgJ1wiPsOXPC9hPjwvcD4nO1xuICAgIH07XG5cblx0XHQvLyBDaGVjayBpZiBicm93c2VyIGlzIHN1cHBvcnRlZFxuICAgIGlmIChpc0Jyb3dzZXJPdXRPZkRhdGUoKSB8fCAhIGlzUHJvcGVydHlTdXBwb3J0ZWQocmVxdWlyZWRDc3NQcm9wZXJ0eSkgfHwgaXNBbmRyb2lkQnV0Tm90Q2hyb21lKSB7XG5cblx0XHRcdC8vIFRoaXMgaXMgYW4gb3V0ZGF0ZWQgYnJvd3NlclxuICAgICAgaWYgKGRvbmUgJiYgb3V0ZGF0ZWRVSS5zdHlsZS5vcGFjaXR5ICE9PSAnMScpIHtcbiAgICAgICAgZG9uZSA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IDEwMDsgaSsrKSB7XG4gICAgICAgICAgc2V0VGltZW91dChtYWtlRmFkZUluRnVuY3Rpb24oaSksIGkgKiA4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgaW5zZXJ0Q29udGVudEhlcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3V0ZGF0ZWQnKTtcbiAgICAgIGluc2VydENvbnRlbnRIZXJlLmlubmVySFRNTCA9IGdldG1lc3NhZ2UobGFuZ3VhZ2UpO1xuICAgICAgc3RhcnRTdHlsZXNBbmRFdmVudHMoKTtcbiAgICB9XG4gIH07XG5cblx0Ly8gTG9hZCBtYWluIHdoZW4gRE9NIHJlYWR5LlxuICB2YXIgb2xkT25sb2FkID0gd2luZG93Lm9ubG9hZDtcbiAgaWYgKHR5cGVvZiB3aW5kb3cub25sb2FkICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgd2luZG93Lm9ubG9hZCA9IG1haW47XG4gIH1cbiAgZWxzZSB7XG4gICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChvbGRPbmxvYWQpIHtcbiAgICAgICAgb2xkT25sb2FkKCk7XG4gICAgICB9XG4gICAgICBtYWluKCk7XG4gICAgfTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJiclwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCJPIHNldSBuYXZlZ2Fkb3IgZXN0JmFhY3V0ZTsgZGVzYXR1YWxpemFkbyFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIkF0dWFsaXplIG8gc2V1IG5hdmVnYWRvciBwYXJhIHRlciB1bWEgbWVsaG9yIGV4cGVyaSZlY2lyYztuY2lhIGUgdmlzdWFsaXphJmNjZWRpbDsmYXRpbGRlO28gZGVzdGUgc2l0ZS4gXCIsXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG4gICAgfSxcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2JyXCIsXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBdHVhbGl6ZSBvIHNldSBuYXZlZ2Fkb3IgYWdvcmFcIixcbiAgICBcImNsb3NlXCI6IFwiRmVjaGFyXCJcbiAgfSxcbiAgXCJjblwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCLmgqjnmoTmtY/op4jlmajlt7Lov4fml7ZcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIuimgeato+W4uOa1j+iniOacrOe9keermeivt+WNh+e6p+aCqOeahOa1j+iniOWZqOOAglwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9jblwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwi546w5Zyo5Y2H57qnXCIsXG4gICAgXCJjbG9zZVwiOiBcIuWFs+mXrVwiXG4gIH0sXG4gIFwiY3pcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwiVsOhxaEgcHJvaGzDrcW+ZcSNIGplIHphc3RhcmFsw70hXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCJQcm8gc3Byw6F2bsOpIHpvYnJhemVuw60gdMSbY2h0byBzdHLDoW5layBha3R1YWxpenVqdGUgc3bFr2ogcHJvaGzDrcW+ZcSNLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vY3pcIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkFrdHVhbGl6b3ZhdCBueW7DrSBzdsWvaiBwcm9obMOtxb5lxI1cIixcbiAgICBcImNsb3NlXCI6IFwiWmF2xZnDrXRcIlxuICB9LFxuICBcImRlXCI6IHtcbiAgICBcIm91dE9mRGF0ZVwiOiBcIklociBCcm93c2VyIGlzdCB2ZXJhbHRldCFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIkJpdHRlIGFrdHVhbGlzaWVyZW4gU2llIElocmVuIEJyb3dzZXIsIHVtIGRpZXNlIFdlYnNpdGUga29ycmVrdCBkYXJ6dXN0ZWxsZW4uIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9kZVwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiRGVuIEJyb3dzZXIgamV0enQgYWt0dWFsaXNpZXJlbiBcIixcbiAgICBcImNsb3NlXCI6IFwiU2NobGllw59lblwiXG4gIH0sXG4gIFwiZWVcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwiU2ludSB2ZWViaWxlaGl0c2VqYSBvbiB2YW5hbmVudWQhXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCJQYWx1biB1dWVuZGEgb21hIHZlZWJpbGVoaXRzZWphdCwgZXQgbsOkaGEgbGVoZWvDvGxnZSBrb3JyZWt0c2VsdC4gXCIsXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG4gICAgfSxcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2VlXCIsXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJVdWVuZGEgb21hIHZlZWJpbGVoaXRzZWphdCBrb2hlXCIsXG4gICAgXCJjbG9zZVwiOiBcIlN1bGdlXCJcbiAgfSxcbiAgXCJlblwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCJZb3VyIGJyb3dzZXIgaXMgb3V0LW9mLWRhdGUhXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCJVcGRhdGUgeW91ciBicm93c2VyIHRvIHZpZXcgdGhpcyB3ZWJzaXRlIGNvcnJlY3RseS4gXCIsXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG4gICAgfSxcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL1wiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBkYXRlIG15IGJyb3dzZXIgbm93XCIsXG4gICAgXCJjbG9zZVwiOiBcIkNsb3NlXCJcbiAgfSxcbiAgXCJlc1wiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCLCoVR1IG5hdmVnYWRvciBlc3TDoSBhbnRpY3VhZG8hXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCJBY3R1YWxpemEgdHUgbmF2ZWdhZG9yIHBhcmEgdmVyIGVzdGEgcMOhZ2luYSBjb3JyZWN0YW1lbnRlLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vZXNcIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkFjdHVhbGl6YXIgbWkgbmF2ZWdhZG9yIGFob3JhXCIsXG4gICAgXCJjbG9zZVwiOiBcIkNlcnJhclwiXG4gIH0sXG4gIFwiZmFcIjoge1xuICAgIFwicmlnaHRUb0xlZnRcIjogdHJ1ZSxcbiAgICBcIm91dE9mRGF0ZVwiOiBcItmF2LHZiNix2q/YsSDYtNmF2Kcg2YXZhtiz2YjYriDYtNiv2Ycg2KfYs9iqIVwiLFxuICAgIFwidXBkYXRlXCI6IHtcbiAgICAgIFwid2ViXCI6IFwi2KzZh9iqINmF2LTYp9mH2K/ZhyDYtdit24zYrSDYp9uM2YYg2YjYqNiz2KfbjNiq2Iwg2YXYsdmI2LHar9ix2KrYp9mGINix2Kcg2KjYsdmI2LIg2LHYs9in2YbbjCDZhtmF2KfbjNuM2K8uIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcItmH2YXbjNmGINit2KfZhNinINmF2LHZiNix2q/YsdmFINix2Kcg2KjYsdmI2LIg2qnZhlwiLFxuICAgIFwiY2xvc2VcIjogXCJDbG9zZVwiXG4gIH0sXG4gIFwiZmlcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwiU2VsYWltZXNpIG9uIHZhbmhlbnR1bnV0IVwiLFxuICAgIFwidXBkYXRlXCI6IHtcbiAgICAgIFwid2ViXCI6IFwiTGF0YWEgYWphbnRhc2FpbmVuIHNlbGFpbiBuJmF1bWw7aGQmYXVtbDtrc2VzaSB0JmF1bWw7bSZhdW1sO24gc2l2dW4gb2lrZWluLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJQJmF1bWw7aXZpdCZhdW1sOyBzZWxhaW1lbmkgbnl0IFwiLFxuICAgIFwiY2xvc2VcIjogXCJTdWxqZVwiXG4gIH0sXG4gIFwiZnJcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwiVm90cmUgbmF2aWdhdGV1ciBlc3QgZMOpc3VldCFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIk1ldHRleiDDoCBqb3VyIHZvdHJlIG5hdmlnYXRldXIgcG91ciBhZmZpY2hlciBjb3JyZWN0ZW1lbnQgY2Ugc2l0ZSBXZWIuIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9mclwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiTWV0dHJlIMOgIGpvdXIgbWFpbnRlbmFudCBcIixcbiAgICBcImNsb3NlXCI6IFwiRmVybWVyXCJcbiAgfSxcbiAgXCJodVwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCJBIGLDtm5nw6lzesWRamUgZWxhdnVsdCFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIkZpcnNzw610c2UgdmFneSBjc2Vyw6lsamUgbGUgYSBiw7ZuZ8Opc3rFkWrDqXQuIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9odVwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQSBiw7ZuZ8Opc3rFkW0gZnJpc3PDrXTDqXNlIFwiLFxuICAgIFwiY2xvc2VcIjogXCJDbG9zZVwiXG4gIH0sXG4gIFwiaWRcIjp7XG4gICAgXCJvdXRPZkRhdGVcIjogXCJCcm93c2VyIHlhbmcgQW5kYSBndW5ha2FuIHN1ZGFoIGtldGluZ2dhbGFuIHphbWFuIVwiLFxuICAgIFwidXBkYXRlXCI6IHtcbiAgICAgIFwid2ViXCI6IFwiUGVyYmFoYXJ1aWxhaCBicm93c2VyIEFuZGEgYWdhciBiaXNhIG1lbmplbGFqYWhpIHdlYnNpdGUgaW5pIGRlbmdhbiBueWFtYW4uIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlBlcmJhaGFydWkgYnJvd3NlciBzZWthcmFuZyBcIixcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxuICB9LFxuICBcIml0XCI6IHtcbiAgICBcIm91dE9mRGF0ZVwiOiBcIklsIHR1byBicm93c2VyIG5vbiAmZWdyYXZlOyBhZ2dpb3JuYXRvIVwiLFxuICAgIFwidXBkYXRlXCI6IHtcbiAgICAgIFwid2ViXCI6IFwiQWdnaW9ybmFsbyBwZXIgdmVkZXJlIHF1ZXN0byBzaXRvIGNvcnJldHRhbWVudGUuIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9pdFwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQWdnaW9ybmEgb3JhXCIsXG4gICAgXCJjbG9zZVwiOiBcIkNoaXVkaVwiXG4gIH0sXG4gIFwibHRcIjp7XG4gICAgXCJvdXRPZkRhdGVcIjogXCJKxatzxbMgbmFyxaF5a2zEl3MgdmVyc2lqYSB5cmEgcGFzZW51c2khXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCJBdG5hdWppbmtpdGUgc2F2byBuYXLFoXlrbMSZLCBrYWQgZ2FsxJd0dW3El3RlIHBlcsW+acWrcsSXdGkgxaFpxIUgc3ZldGFpbsSZIHRpbmthbWFpLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBdG5hdWppbnRpIG5hcsWheWtsxJkgXCIsXG4gICAgXCJjbG9zZVwiOiBcIkNsb3NlXCJcbiAgfSxcbiAgXCJubFwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCJKZSBnZWJydWlrdCBlZW4gb3VkZSBicm93c2VyIVwiLFxuICAgIFwidXBkYXRlXCI6IHtcbiAgICAgIFwid2ViXCI6IFwiVXBkYXRlIGplIGJyb3dzZXIgb20gZGV6ZSB3ZWJzaXRlIGNvcnJlY3QgdGUgYmVraWprZW4uIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9ubFwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBkYXRlIG1pam4gYnJvd3NlciBudSBcIixcbiAgICBcImNsb3NlXCI6IFwiU2x1aXRlblwiXG4gIH0sXG4gIFwicGxcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBqZXN0IHByemVzdGFyemHFgmEhXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCJaYWt0dWFsaXp1aiBzd29qxIUgcHJ6ZWdsxIVkYXJrxJksIGFieSBwb3ByYXduaWUgd3nFm3dpZXRsacSHIHTEmSBzdHJvbsSZLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vcGxcIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlpha3R1YWxpenVqIHByemVnbMSFZGFya8SZIGp1xbwgdGVyYXpcIixcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxuICB9LFxuICBcInB0XCI6IHtcbiAgICBcIm91dE9mRGF0ZVwiOiBcIk8gc2V1IGJyb3dzZXIgZXN0JmFhY3V0ZTsgZGVzYXR1YWxpemFkbyFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIkF0dWFsaXplIG8gc2V1IGJyb3dzZXIgcGFyYSB0ZXIgdW1hIG1lbGhvciBleHBlcmkmZWNpcmM7bmNpYSBlIHZpc3VhbGl6YSZjY2VkaWw7JmF0aWxkZTtvIGRlc3RlIHNpdGUuIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9wdFwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQXR1YWxpemUgbyBzZXUgYnJvd3NlciBhZ29yYVwiLFxuICAgIFwiY2xvc2VcIjogXCJGZWNoYXJcIlxuICB9LFxuICBcInJvXCI6IHtcbiAgICBcIm91dE9mRGF0ZVwiOiBcIkJyb3dzZXJ1bCBlc3RlIMOubnZlY2hpdCFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIkFjdHVhbGl6YcibaSBicm93c2VydWwgcGVudHJ1IGEgdml6dWFsaXphIGNvcmVjdCBhY2VzdCBzaXRlLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBY3R1YWxpemHIm2kgYnJvd3NlcnVsIGFjdW0hXCIsXG4gICAgXCJjbG9zZVwiOiBcIkNsb3NlXCJcbiAgfSxcbiAgXCJydVwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0YPRgdGC0LDRgNC10LshXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCLQntCx0L3QvtCy0LjRgtC1INCy0LDRiCDQsdGA0LDRg9C30LXRgCDQtNC70Y8g0L/RgNCw0LLQuNC70YzQvdC+0LPQviDQvtGC0L7QsdGA0LDQttC10L3QuNGPINGN0YLQvtCz0L4g0YHQsNC50YLQsC4gXCIsXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG4gICAgfSxcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL3J1XCIsXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCLQntCx0L3QvtCy0LjRgtGMINC80L7QuSDQsdGA0LDRg9C30LXRgCBcIixcbiAgICBcImNsb3NlXCI6IFwi0JfQsNC60YDRi9GC0YxcIlxuICB9LFxuICBcInNpXCI6IHtcbiAgICBcIm91dE9mRGF0ZVwiOiBcIlZhxaEgYnJza2FsbmlrIGplIHphc3RhcmVsIVwiLFxuICAgIFwidXBkYXRlXCI6IHtcbiAgICAgIFwid2ViXCI6IFwiWmEgcHJhdmlsZW4gcHJpa2F6IHNwbGV0bmUgc3RyYW5pIHBvc29kb2JpdGUgdmHFoSBicnNrYWxuaWsuIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9zaVwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiUG9zb2RvYmkgYnJza2FsbmlrIFwiLFxuICAgIFwiY2xvc2VcIjogXCJaYXByaVwiXG4gIH0sXG4gIFwic3ZcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwiRGluIHdlYmJsw6RzYXJlIHN0w7ZkanMgZWogbMOkbmdyZSFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcIlVwcGRhdGVyYSBkaW4gd2ViYmzDpHNhcmUgZsO2ciBhdHQgd2ViYnBsYXRzZW4gc2thIHZpc2FzIGtvcnJla3QuIFwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuICAgIH0sXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlVwcGRhdGVyYSBtaW4gd2ViYmzDpHNhcmUgbnVcIixcbiAgICBcImNsb3NlXCI6IFwiU3TDpG5nXCJcbiAgfSxcbiAgXCJ1YVwiOiB7XG4gICAgXCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0LfQsNGB0YLQsNGA0ZbQsiFcIixcbiAgICBcInVwZGF0ZVwiOiB7XG4gICAgICBcIndlYlwiOiBcItCe0L3QvtCy0ZbRgtGMINCy0LDRiCDQsdGA0LDRg9C30LXRgCDQtNC70Y8g0L/RgNCw0LLQuNC70YzQvdC+0LPQviDQstGW0LTQvtCx0YDQsNC20LXQvdC90Y8g0YbRjNC+0LPQviDRgdCw0LnRgtCwLiBcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vdWFcIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcItCe0L3QvtCy0LjRgtC4INC80ZbQuSDQsdGA0LDRg9C30LXRgCBcIixcbiAgICBcImNsb3NlXCI6IFwi0JfQsNC60YDQuNGC0LhcIlxuICB9XG59XG4iLCIvLyBVQVBhcnNlci5qcyB2MC42LjBcbi8vIExpZ2h0d2VpZ2h0IEphdmFTY3JpcHQtYmFzZWQgVXNlci1BZ2VudCBzdHJpbmcgcGFyc2VyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmFpc2FsbWFuL3VhLXBhcnNlci1qc1xuLy9cbi8vIENvcHlyaWdodCDCqSAyMDEyLTIwMTMgRmFpc2FsbWFuIDxmeXpsbWFuQGdtYWlsLmNvbT5cbi8vIER1YWwgbGljZW5zZWQgdW5kZXIgR1BMdjIgJiBNSVRcblxuKGZ1bmN0aW9uICh3aW5kb3csIHVuZGVmaW5lZCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBDb25zdGFudHNcbiAgICAvLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciBFTVBUWSAgICAgICA9ICcnLFxuICAgICAgICBVTktOT1dOICAgICA9ICc/JyxcbiAgICAgICAgRlVOQ19UWVBFICAgPSAnZnVuY3Rpb24nLFxuICAgICAgICBVTkRFRl9UWVBFICA9ICd1bmRlZmluZWQnLFxuICAgICAgICBPQkpfVFlQRSAgICA9ICdvYmplY3QnLFxuICAgICAgICBNQUpPUiAgICAgICA9ICdtYWpvcicsXG4gICAgICAgIE1PREVMICAgICAgID0gJ21vZGVsJyxcbiAgICAgICAgTkFNRSAgICAgICAgPSAnbmFtZScsXG4gICAgICAgIFRZUEUgICAgICAgID0gJ3R5cGUnLFxuICAgICAgICBWRU5ET1IgICAgICA9ICd2ZW5kb3InLFxuICAgICAgICBWRVJTSU9OICAgICA9ICd2ZXJzaW9uJyxcbiAgICAgICAgQVJDSElURUNUVVJFPSAnYXJjaGl0ZWN0dXJlJyxcbiAgICAgICAgQ09OU09MRSAgICAgPSAnY29uc29sZScsXG4gICAgICAgIE1PQklMRSAgICAgID0gJ21vYmlsZScsXG4gICAgICAgIFRBQkxFVCAgICAgID0gJ3RhYmxldCc7XG5cblxuICAgIC8vLy8vLy8vLy8vXG4gICAgLy8gSGVscGVyXG4gICAgLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgdXRpbCA9IHtcbiAgICAgICAgaGFzIDogZnVuY3Rpb24gKHN0cjEsIHN0cjIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHIyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzdHIxLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcbiAgICAgICAgfSxcbiAgICAgICAgbG93ZXJpemUgOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBNYXAgaGVscGVyXG4gICAgLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIG1hcHBlciA9IHtcblxuICAgICAgICByZ3ggOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcmVnZXhlcyBtYXBzXG4gICAgICAgICAgICBmb3IgKHZhciByZXN1bHQsIGkgPSAwLCBqLCBrLCBwLCBxLCBtYXRjaGVzLCBtYXRjaCwgYXJncyA9IGFyZ3VtZW50czsgaSA8IGFyZ3MubGVuZ3RoOyBpICs9IDIpIHtcblxuICAgICAgICAgICAgICAgIHZhciByZWdleCA9IGFyZ3NbaV0sICAgICAgIC8vIGV2ZW4gc2VxdWVuY2UgKDAsMiw0LC4uKVxuICAgICAgICAgICAgICAgICAgICBwcm9wcyA9IGFyZ3NbaSArIDFdOyAgIC8vIG9kZCBzZXF1ZW5jZSAoMSwzLDUsLi4pXG5cbiAgICAgICAgICAgICAgICAvLyBjb25zdHJ1Y3Qgb2JqZWN0IGJhcmVib25lc1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YocmVzdWx0KSA9PT0gVU5ERUZfVFlQRSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChwIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxID0gcHJvcHNbcF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHEpID09PSBPQkpfVFlQRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtxWzBdXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3FdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gdHJ5IG1hdGNoaW5nIHVhc3RyaW5nIHdpdGggcmVnZXhlc1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IGsgPSAwOyBqIDwgcmVnZXgubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IHJlZ2V4W2pdLmV4ZWModGhpcy5nZXRVQSgpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhbWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChwIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBtYXRjaGVzWysra107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcSA9IHByb3BzW3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGdpdmVuIHByb3BlcnR5IGlzIGFjdHVhbGx5IGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihxKSA9PT0gT0JKX1RZUEUgJiYgcS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHFbMV0pID09IEZVTkNfVFlQRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBtb2RpZmllZCBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtxWzBdXSA9IHFbMV0uY2FsbCh0aGlzLCBtYXRjaCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBnaXZlbiB2YWx1ZSwgaWdub3JlIHJlZ2V4IG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3FbMF1dID0gcVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB3aGV0aGVyIGZ1bmN0aW9uIG9yIHJlZ2V4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHFbMV0pID09PSBGVU5DX1RZUEUgJiYgIShxWzFdLmV4ZWMgJiYgcVsxXS50ZXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb24gKHVzdWFsbHkgc3RyaW5nIG1hcHBlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbcVswXV0gPSBtYXRjaCA/IHFbMV0uY2FsbCh0aGlzLCBtYXRjaCwgcVsyXSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhbml0aXplIG1hdGNoIHVzaW5nIGdpdmVuIHJlZ2V4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3FbMF1dID0gbWF0Y2ggPyBtYXRjaC5yZXBsYWNlKHFbMV0sIHFbMl0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHEubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbcVswXV0gPSBtYXRjaCA/IHFbM10uY2FsbCh0aGlzLCBtYXRjaC5yZXBsYWNlKHFbMV0sIHFbMl0pKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtxXSA9IG1hdGNoID8gbWF0Y2ggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZighIW1hdGNoZXMpIGJyZWFrOyAvLyBicmVhayB0aGUgbG9vcCBpbW1lZGlhdGVseSBpZiBtYXRjaCBmb3VuZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBzdHIgOiBmdW5jdGlvbiAoc3RyLCBtYXApIHtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBtYXApIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhcnJheVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YobWFwW2ldKSA9PT0gT0JKX1RZUEUgJiYgbWFwW2ldLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiBpbiBtYXBbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1dGlsLmhhcyhtYXBbaV1bal0sIHN0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGkgPT09IFVOS05PV04pID8gdW5kZWZpbmVkIDogaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodXRpbC5oYXMobWFwW2ldLCBzdHIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoaSA9PT0gVU5LTk9XTikgPyB1bmRlZmluZWQgOiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBTdHJpbmcgbWFwXG4gICAgLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIG1hcHMgPSB7XG5cbiAgICAgICAgYnJvd3NlciA6IHtcbiAgICAgICAgICAgIG9sZHNhZmFyaSA6IHtcbiAgICAgICAgICAgICAgICBtYWpvciA6IHtcbiAgICAgICAgICAgICAgICAgICAgJzEnIDogWycvOCcsICcvMScsICcvMyddLFxuICAgICAgICAgICAgICAgICAgICAnMicgOiAnLzQnLFxuICAgICAgICAgICAgICAgICAgICAnPycgOiAnLydcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHZlcnNpb24gOiB7XG4gICAgICAgICAgICAgICAgICAgICcxLjAnICAgOiAnLzgnLFxuICAgICAgICAgICAgICAgICAgICAnMS4yJyAgIDogJy8xJyxcbiAgICAgICAgICAgICAgICAgICAgJzEuMycgICA6ICcvMycsXG4gICAgICAgICAgICAgICAgICAgICcyLjAnICAgOiAnLzQxMicsXG4gICAgICAgICAgICAgICAgICAgICcyLjAuMicgOiAnLzQxNicsXG4gICAgICAgICAgICAgICAgICAgICcyLjAuMycgOiAnLzQxNycsXG4gICAgICAgICAgICAgICAgICAgICcyLjAuNCcgOiAnLzQxOScsXG4gICAgICAgICAgICAgICAgICAgICc/JyAgICAgOiAnLydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV2aWNlIDoge1xuICAgICAgICAgICAgc3ByaW50IDoge1xuICAgICAgICAgICAgICAgIG1vZGVsIDoge1xuICAgICAgICAgICAgICAgICAgICAnRXZvIFNoaWZ0IDRHJyA6ICc3MzczS1QnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB2ZW5kb3IgOiB7XG4gICAgICAgICAgICAgICAgICAgICdIVEMnICAgICAgIDogJ0FQQScsXG4gICAgICAgICAgICAgICAgICAgICdTcHJpbnQnICAgIDogJ1NwcmludCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3MgOiB7XG4gICAgICAgICAgICB3aW5kb3dzIDoge1xuICAgICAgICAgICAgICAgIHZlcnNpb24gOiB7XG4gICAgICAgICAgICAgICAgICAgICdNRScgICAgICAgIDogJzQuOTAnLFxuICAgICAgICAgICAgICAgICAgICAnTlQgMy4xMScgICA6ICdOVDMuNTEnLFxuICAgICAgICAgICAgICAgICAgICAnTlQgNC4wJyAgICA6ICdOVDQuMCcsXG4gICAgICAgICAgICAgICAgICAgICcyMDAwJyAgICAgIDogJ05UIDUuMCcsXG4gICAgICAgICAgICAgICAgICAgICdYUCcgICAgICAgIDogWydOVCA1LjEnLCAnTlQgNS4yJ10sXG4gICAgICAgICAgICAgICAgICAgICdWaXN0YScgICAgIDogJ05UIDYuMCcsXG4gICAgICAgICAgICAgICAgICAgICc3JyAgICAgICAgIDogJ05UIDYuMScsXG4gICAgICAgICAgICAgICAgICAgICc4JyAgICAgICAgIDogJ05UIDYuMicsXG4gICAgICAgICAgICAgICAgICAgICdSVCcgICAgICAgIDogJ0FSTSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJlZ2V4IG1hcFxuICAgIC8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIHJlZ2V4ZXMgPSB7XG5cbiAgICAgICAgYnJvd3NlciA6IFtbXG5cbiAgICAgICAgICAgIC8vIFByZXN0byBiYXNlZFxuICAgICAgICAgICAgLyhvcGVyYVxcc21pbmkpXFwvKChcXGQrKT9bXFx3XFwuLV0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIE1pbmlcbiAgICAgICAgICAgIC8ob3BlcmFcXHNbbW9iaWxldGFiXSspLit2ZXJzaW9uXFwvKChcXGQrKT9bXFx3XFwuLV0rKS9pLCAgICAgICAgICAgICAgICAvLyBPcGVyYSBNb2JpL1RhYmxldFxuICAgICAgICAgICAgLyhvcGVyYSkuK3ZlcnNpb25cXC8oKFxcZCspP1tcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgPiA5LjgwXG4gICAgICAgICAgICAvKG9wZXJhKVtcXC9cXHNdKygoXFxkKyk/W1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgPCA5LjgwXG5cbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OLCBNQUpPUl0sIFtcblxuICAgICAgICAgICAgL1xccyhvcHIpXFwvKChcXGQrKT9bXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIFdlYmtpdFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEnXSwgVkVSU0lPTiwgTUFKT1JdLCBbXG5cbiAgICAgICAgICAgIC8vIE1peGVkXG4gICAgICAgICAgICAvKGtpbmRsZSlcXC8oKFxcZCspP1tcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLaW5kbGVcbiAgICAgICAgICAgIC8obHVuYXNjYXBlfG1heHRob258bmV0ZnJvbnR8amFzbWluZXxibGF6ZXIpW1xcL1xcc10/KChcXGQrKT9bXFx3XFwuXSspKi9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMdW5hc2NhcGUvTWF4dGhvbi9OZXRmcm9udC9KYXNtaW5lL0JsYXplclxuXG4gICAgICAgICAgICAvLyBUcmlkZW50IGJhc2VkXG4gICAgICAgICAgICAvKGF2YW50XFxzfGllbW9iaWxlfHNsaW18YmFpZHUpKD86YnJvd3Nlcik/W1xcL1xcc10/KChcXGQrKT9bXFx3XFwuXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2YW50L0lFTW9iaWxlL1NsaW1Ccm93c2VyL0JhaWR1XG4gICAgICAgICAgICAvKD86bXN8XFwoKShpZSlcXHMoKFxcZCspP1tcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW50ZXJuZXQgRXhwbG9yZXJcblxuICAgICAgICAgICAgLy8gV2Via2l0L0tIVE1MIGJhc2VkXG4gICAgICAgICAgICAvKHJla29ucSkoKD86XFwvKVtcXHdcXC5dKykqL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJla29ucVxuICAgICAgICAgICAgLyhjaHJvbWl1bXxmbG9ja3xyb2NrbWVsdHxtaWRvcml8ZXBpcGhhbnl8c2lsa3xza3lmaXJlfG92aWJyb3dzZXJ8Ym9sdClcXC8oKFxcZCspP1tcXHdcXC4tXSspL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21pdW0vRmxvY2svUm9ja01lbHQvTWlkb3JpL0VwaXBoYW55L1NpbGsvU2t5ZmlyZS9Cb2x0XG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTiwgTUFKT1JdLCBbXG5cbiAgICAgICAgICAgIC8oeWFicm93c2VyKVxcLygoXFxkKyk/W1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFlhbmRleFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnWWFuZGV4J10sIFZFUlNJT04sIE1BSk9SXSwgW1xuXG4gICAgICAgICAgICAvKGNvbW9kb19kcmFnb24pXFwvKChcXGQrKT9bXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21vZG8gRHJhZ29uXG4gICAgICAgICAgICBdLCBbW05BTUUsIC9fL2csICcgJ10sIFZFUlNJT04sIE1BSk9SXSwgW1xuXG4gICAgICAgICAgICAvKGNocm9tZXxvbW5pd2VifGFyb3JhfFt0aXplbm9rYV17NX1cXHM/YnJvd3NlcilcXC92PygoXFxkKyk/W1xcd1xcLl0rKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZS9PbW5pV2ViL0Fyb3JhL1RpemVuL05va2lhXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTiwgTUFKT1JdLCBbXG5cbiAgICAgICAgICAgIC8oZG9sZmluKVxcLygoXFxkKyk/W1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbHBoaW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0RvbHBoaW4nXSwgVkVSU0lPTiwgTUFKT1JdLCBbXG5cbiAgICAgICAgICAgIC8oKD86YW5kcm9pZC4rKWNybW98Y3Jpb3MpXFwvKChcXGQrKT9bXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBmb3IgQW5kcm9pZC9pT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0Nocm9tZSddLCBWRVJTSU9OLCBNQUpPUl0sIFtcblxuICAgICAgICAgICAgL3ZlcnNpb25cXC8oKFxcZCspP1tcXHdcXC5dKykuKz9tb2JpbGVcXC9cXHcrXFxzKHNhZmFyaSkvaSAgICAgICAgICAgICAgICAgLy8gTW9iaWxlIFNhZmFyaVxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIE1BSk9SLCBbTkFNRSwgJ01vYmlsZSBTYWZhcmknXV0sIFtcblxuICAgICAgICAgICAgL3ZlcnNpb25cXC8oKFxcZCspP1tcXHdcXC5dKykuKz8obW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpL2kgICAgICAgICAgICAgIC8vIFNhZmFyaSAmIFNhZmFyaSBNb2JpbGVcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBNQUpPUiwgTkFNRV0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdC4rPyhtb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkoKFxcL1tcXHdcXC5dKykpL2kgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDwgMy4wXG4gICAgICAgICAgICBdLCBbTkFNRSwgW01BSk9SLCBtYXBwZXIuc3RyLCBtYXBzLmJyb3dzZXIub2xkc2FmYXJpLm1ham9yXSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMuYnJvd3Nlci5vbGRzYWZhcmkudmVyc2lvbl1dLCBbXG5cbiAgICAgICAgICAgIC8oa29ucXVlcm9yKVxcLygoXFxkKyk/W1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtvbnF1ZXJvclxuICAgICAgICAgICAgLyh3ZWJraXR8a2h0bWwpXFwvKChcXGQrKT9bXFx3XFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OLCBNQUpPUl0sIFtcblxuICAgICAgICAgICAgLy8gR2Vja28gYmFzZWRcbiAgICAgICAgICAgIC8obmF2aWdhdG9yfG5ldHNjYXBlKVxcLygoXFxkKyk/W1xcd1xcLi1dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5ldHNjYXBlXG4gICAgICAgICAgICBdLCBbW05BTUUsICdOZXRzY2FwZSddLCBWRVJTSU9OLCBNQUpPUl0sIFtcbiAgICAgICAgICAgIC8oc3dpZnRmb3gpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpZnRmb3hcbiAgICAgICAgICAgIC8oaWNld2Vhc2VsfGNhbWlub3xjaGltZXJhfGZlbm5lY3xtYWVtb1xcc2Jyb3dzZXJ8bWluaW1vfGNvbmtlcm9yKVtcXC9cXHNdPygoXFxkKyk/W1xcd1xcLlxcK10rKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJY2V3ZWFzZWwvQ2FtaW5vL0NoaW1lcmEvRmVubmVjL01hZW1vL01pbmltby9Db25rZXJvclxuICAgICAgICAgICAgLyhmaXJlZm94fHNlYW1vbmtleXxrLW1lbGVvbnxpY2VjYXR8aWNlYXBlfGZpcmViaXJkfHBob2VuaXgpXFwvKChcXGQrKT9bXFx3XFwuLV0rKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94L1NlYU1vbmtleS9LLU1lbGVvbi9JY2VDYXQvSWNlQXBlL0ZpcmViaXJkL1Bob2VuaXhcbiAgICAgICAgICAgIC8obW96aWxsYSlcXC8oKFxcZCspP1tcXHdcXC5dKykuK3J2XFw6LitnZWNrb1xcL1xcZCsvaSwgICAgICAgICAgICAgICAgICAgIC8vIE1vemlsbGFcblxuICAgICAgICAgICAgLy8gT3RoZXJcbiAgICAgICAgICAgIC8odWNcXHM/YnJvd3Nlcnxwb2xhcmlzfGx5bnh8ZGlsbG98aWNhYnxkb3Jpc3xhbWF5YXx3M218bmV0c3VyZilbXFwvXFxzXT8oKFxcZCspP1tcXHdcXC5dKykvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVUNCcm93c2VyL1BvbGFyaXMvTHlueC9EaWxsby9pQ2FiL0RvcmlzL0FtYXlhL3czbS9OZXRTdXJmXG4gICAgICAgICAgICAvKGxpbmtzKVxcc1xcKCgoXFxkKyk/W1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGlua3NcbiAgICAgICAgICAgIC8oZ29icm93c2VyKVxcLz8oKFxcZCspP1tcXHdcXC5dKykqL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvQnJvd3NlclxuICAgICAgICAgICAgLyhpY2VcXHM/YnJvd3NlcilcXC92PygoXFxkKyk/W1xcd1xcLl9dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElDRSBCcm93c2VyXG4gICAgICAgICAgICAvKG1vc2FpYylbXFwvXFxzXSgoXFxkKyk/W1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW9zYWljXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTiwgTUFKT1JdXG4gICAgICAgIF0sXG5cbiAgICAgICAgY3B1IDogW1tcblxuICAgICAgICAgICAgLyg/OihhbWR8eCg/Oig/Ojg2fDY0KVtfLV0pP3x3b3d8d2luKTY0KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgLy8gQU1ENjRcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnYW1kNjQnXV0sIFtcblxuICAgICAgICAgICAgLygoPzppWzM0Nl18eCk4NilbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUEzMlxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdpYTMyJ11dLCBbXG5cbiAgICAgICAgICAgIC8oKD86cHBjfHBvd2VycGMpKD86NjQpPykoPzpcXHNtYWN8O3xcXCkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3dlclBDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgL293ZXIvLCAnJywgdXRpbC5sb3dlcml6ZV1dLCBbXG5cbiAgICAgICAgICAgIC8oc3VuNFxcdylbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTUEFSQ1xuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdzcGFyYyddXSwgW1xuXG4gICAgICAgICAgICAvKGlhNjQoPz07KXw2OGsoPz1cXCkpfGFybSg/PXZcXGQrOyl8KD86aXJpeHxtaXBzfHNwYXJjKSg/OjY0KT8oPz07KXxwYS1yaXNjKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBNjQsIDY4SywgQVJNLCBJUklYLCBNSVBTLCBTUEFSQywgUEEtUklTQ1xuICAgICAgICAgICAgXSwgW0FSQ0hJVEVDVFVSRSwgdXRpbC5sb3dlcml6ZV1cbiAgICAgICAgXSxcblxuICAgICAgICBkZXZpY2UgOiBbW1xuXG4gICAgICAgICAgICAvXFwoKGlwYWR8cGxheWJvb2spO1tcXHdcXHNcXCk7LV0rKHJpbXxhcHBsZSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUGFkL1BsYXlCb29rXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFZFTkRPUiwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oaHApLisodG91Y2hwYWQpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgVG91Y2hQYWRcbiAgICAgICAgICAgIC8oa2luZGxlKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2luZGxlXG4gICAgICAgICAgICAvXFxzKG5vb2spW1xcd1xcc10rYnVpbGRcXC8oXFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9va1xuICAgICAgICAgICAgLyhkZWxsKVxccyhzdHJlYVtrcHJcXHNcXGRdKltcXGRrb10pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVsbCBTdHJlYWtcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL1xcKChpcFtob25lZF0rKTsuKyhhcHBsZSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBvZC9pUGhvbmVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgVkVORE9SLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhibGFja2JlcnJ5KVtcXHMtXT8oXFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnlcbiAgICAgICAgICAgIC8oYmxhY2tiZXJyeXxiZW5xfHBhbG0oPz1cXC0pfHNvbnllcmljc3NvbnxhY2VyfGFzdXN8ZGVsbHxodWF3ZWl8bWVpenV8bW90b3JvbGEpW1xcc18tXT8oW1xcdy1dKykqL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJlblEvUGFsbS9Tb255LUVyaWNzc29uL0FjZXIvQXN1cy9EZWxsL0h1YXdlaS9NZWl6dS9Nb3Rvcm9sYVxuICAgICAgICAgICAgLyhocClcXHMoW1xcd1xcc10rXFx3KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgaVBBUVxuICAgICAgICAgICAgLyhhc3VzKS0/KFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXN1c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL1xcKChiYjEwKTtcXHMoXFx3KykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja0JlcnJ5IDEwXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0JsYWNrQmVycnknXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKCh0cmFuc2ZvW3ByaW1lXFxzXXs0LDEwfVxcc1xcdyt8ZWVlcGN8c2xpZGVyXFxzXFx3KykpL2kgICAgICAgLy8gQXN1cyBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0FzdXMnXSwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKHNvbnkpXFxzKHRhYmxldFxcc1twc10pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU29ueSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8obmludGVuZG8pXFxzKFt3aWRzM3VdKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5pbnRlbmRvXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvKChwbGF5c3RhdGlvbilcXHNbM3BvcnRhYmxldmldKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGF5c3RhdGlvblxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdTb255J10sIE1PREVMLCBbVFlQRSwgQ09OU09MRV1dLCBbXG5cbiAgICAgICAgICAgIC8oc3ByaW50XFxzKFxcdyspKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTcHJpbnQgUGhvbmVzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2Uuc3ByaW50LnZlbmRvcl0sIFtNT0RFTCwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2Uuc3ByaW50Lm1vZGVsXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oaHRjKVs7X1xccy1dKyhbXFx3XFxzXSsoPz1cXCkpfFxcdyspKi9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIVENcbiAgICAgICAgICAgIC8oenRlKS0oXFx3KykqL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFpURVxuICAgICAgICAgICAgLyhhbGNhdGVsfGdlZWtzcGhvbmV8aHVhd2VpfGxlbm92b3xuZXhpYW58cGFuYXNvbmljfCg/PTtcXHMpc29ueSlbX1xccy1dPyhbXFx3LV0rKSovaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGNhdGVsL0dlZWtzUGhvbmUvSHVhd2VpL0xlbm92by9OZXhpYW4vUGFuYXNvbmljL1NvbnlcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIFtNT0RFTCwgL18vZywgJyAnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9cXHMoKG1pbGVzdG9uZXxkcm9pZFsyeF0/KSlbZ2xvYmFcXHNdKlxcc2J1aWxkXFwvL2ksICAgICAgICAgICAgICAgICAgIC8vIE1vdG9yb2xhXG4gICAgICAgICAgICAvKG1vdClbXFxzLV0/KFxcdyspKi9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkLitcXHMoKG16NjBcXGR8eG9vbVtcXHMyXXswLDJ9KSlcXHNidWlsZFxcLy9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKygoc2NoLWlbODldMFxcZHxzaHctbTM4MHN8Z3QtcFxcZHs0fXxndC1uODAwMHxzZ2gtdDhbNTZdOSkpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbICAgICAgICAgICAgICAgICAgLy8gU2Ftc3VuZ1xuICAgICAgICAgICAgLygoc1tjZ3BdaC1cXHcrfGd0LVxcdyt8Z2FsYXh5XFxzbmV4dXMpKS9pLFxuICAgICAgICAgICAgLyhzYW1bc3VuZ10qKVtcXHMtXSooXFx3Ky0/W1xcdy1dKikqL2ksXG4gICAgICAgICAgICAvc2VjLSgoc2doXFx3KykpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvKHNpZSktKFxcdyspKi9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaWVtZW5zXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ1NpZW1lbnMnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKG1hZW1vfG5va2lhKS4qKG45MDB8bHVtaWFcXHNcXGQrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9raWFcbiAgICAgICAgICAgIC8obm9raWEpW1xcc18tXT8oW1xcdy1dKykqL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnTm9raWEnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZFxcczNcXC5bXFxzXFx3LTtdezEwfSgoYVxcZHszfSkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWNlclxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdBY2VyJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWRcXHMzXFwuW1xcc1xcdy07XXsxMH0obGc/KS0oWzA2Y3Y5XXszLDR9KS9pICAgICAgICAgICAgICAgICAgICAgLy8gTEdcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnTEcnXSwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgLygobmV4dXNcXHM0KSkvaSxcbiAgICAgICAgICAgIC8obGcpW2U7XFxzLVxcL10rKFxcdyspKi9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0xHJ10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhtb2JpbGV8dGFibGV0KTsuK3J2XFw6LitnZWNrb1xcLy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVuaWRlbnRpZmlhYmxlXG4gICAgICAgICAgICBdLCBbVFlQRSwgVkVORE9SLCBNT0RFTF1cbiAgICAgICAgXSxcblxuICAgICAgICBlbmdpbmUgOiBbW1xuXG4gICAgICAgICAgICAvKHByZXN0bylcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXN0b1xuICAgICAgICAgICAgLyh3ZWJraXR8dHJpZGVudHxuZXRmcm9udHxuZXRzdXJmfGFtYXlhfGx5bnh8dzNtKVxcLyhbXFx3XFwuXSspL2ksICAgICAvLyBXZWJLaXQvVHJpZGVudC9OZXRGcm9udC9OZXRTdXJmL0FtYXlhL0x5bngvdzNtXG4gICAgICAgICAgICAvKGtodG1sfHRhc21hbnxsaW5rcylbXFwvXFxzXVxcKD8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS0hUTUwvVGFzbWFuL0xpbmtzXG4gICAgICAgICAgICAvKGljYWIpW1xcL1xcc10oWzIzXVxcLltcXGRcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaUNhYlxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9ydlxcOihbXFx3XFwuXSspLiooZ2Vja28pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2Vja29cbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBOQU1FXVxuICAgICAgICBdLFxuXG4gICAgICAgIG9zIDogW1tcblxuICAgICAgICAgICAgLy8gV2luZG93cyBiYXNlZFxuICAgICAgICAgICAgLyh3aW5kb3dzKVxcc250XFxzNlxcLjI7XFxzKGFybSkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyBSVFxuICAgICAgICAgICAgLyh3aW5kb3dzXFxzcGhvbmUoPzpcXHNvcykqfHdpbmRvd3NcXHNtb2JpbGV8d2luZG93cylbXFxzXFwvXT8oW250Y2VcXGRcXC5cXHNdK1xcdykvaVxuICAgICAgICAgICAgXSwgW05BTUUsIFtWRVJTSU9OLCBtYXBwZXIuc3RyLCBtYXBzLm9zLndpbmRvd3MudmVyc2lvbl1dLCBbXG4gICAgICAgICAgICAvKHdpbig/PTN8OXxuKXx3aW5cXHM5eFxccykoW250XFxkXFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1dpbmRvd3MnXSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMub3Mud2luZG93cy52ZXJzaW9uXV0sIFtcblxuICAgICAgICAgICAgLy8gTW9iaWxlL0VtYmVkZGVkIE9TXG4gICAgICAgICAgICAvXFwoKGJiKSgxMCk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja0JlcnJ5IDEwXG4gICAgICAgICAgICBdLCBbW05BTUUsICdCbGFja0JlcnJ5J10sIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKGJsYWNrYmVycnkpXFx3KlxcLz8oW1xcd1xcLl0rKSovaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja2JlcnJ5XG4gICAgICAgICAgICAvKHRpemVuKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRpemVuXG4gICAgICAgICAgICAvKGFuZHJvaWR8d2Vib3N8cGFsbVxcb3N8cW54fGJhZGF8cmltXFxzdGFibGV0XFxzb3N8bWVlZ28pW1xcL1xccy1dPyhbXFx3XFwuXSspKi9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFuZHJvaWQvV2ViT1MvUGFsbS9RTlgvQmFkYS9SSU0vTWVlR29cbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyhzeW1iaWFuXFxzP29zfHN5bWJvc3xzNjAoPz07KSlbXFwvXFxzLV0/KFtcXHdcXC5dKykqL2kgICAgICAgICAgICAgICAgIC8vIFN5bWJpYW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1N5bWJpYW4nXSwgVkVSU0lPTl0sW1xuICAgICAgICAgICAgL21vemlsbGEuK1xcKG1vYmlsZTsuK2dlY2tvLitmaXJlZm94L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRmlyZWZveCBPUyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBDb25zb2xlXG4gICAgICAgICAgICAvKG5pbnRlbmRvfHBsYXlzdGF0aW9uKVxccyhbd2lkczNwb3J0YWJsZXZ1XSspL2ksICAgICAgICAgICAgICAgICAgICAvLyBOaW50ZW5kby9QbGF5c3RhdGlvblxuXG4gICAgICAgICAgICAvLyBHTlUvTGludXggYmFzZWRcbiAgICAgICAgICAgIC8obWludClbXFwvXFxzXFwoXT8oXFx3KykqL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pbnRcbiAgICAgICAgICAgIC8oam9saXxba3hsbl0/dWJ1bnR1fGRlYmlhbnxbb3Blbl0qc3VzZXxnZW50b298YXJjaHxzbGFja3dhcmV8ZmVkb3JhfG1hbmRyaXZhfGNlbnRvc3xwY2xpbnV4b3N8cmVkaGF0fHplbndhbGspW1xcL1xccy1dPyhbXFx3XFwuLV0rKSovaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSm9saS9VYnVudHUvRGViaWFuL1NVU0UvR2VudG9vL0FyY2gvU2xhY2t3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZlZG9yYS9NYW5kcml2YS9DZW50T1MvUENMaW51eE9TL1JlZEhhdC9aZW53YWxrXG4gICAgICAgICAgICAvKGh1cmR8bGludXgpXFxzPyhbXFx3XFwuXSspKi9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1cmQvTGludXhcbiAgICAgICAgICAgIC8oZ251KVxccz8oW1xcd1xcLl0rKSovaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR05VXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjcm9zKVxcc1tcXHddK1xccyhbXFx3XFwuXStcXHcpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWl1bSBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQ2hyb21pdW0gT1MnXSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICAvKHN1bm9zKVxccz8oW1xcd1xcLl0rXFxkKSovaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTb2xhcmlzJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIEJTRCBiYXNlZFxuICAgICAgICAgICAgL1xccyhbZnJlbnRvcGMtXXswLDR9YnNkfGRyYWdvbmZseSlcXHM/KFtcXHdcXC5dKykqL2kgICAgICAgICAgICAgICAgICAgLy8gRnJlZUJTRC9OZXRCU0QvT3BlbkJTRC9QQy1CU0QvRHJhZ29uRmx5XG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvKGlwW2hvbmVhZF0rKSg/Oi4qb3NcXHMqKFtcXHddKykqXFxzbGlrZVxcc21hY3w7XFxzb3BlcmEpL2kgICAgICAgICAgICAgLy8gaU9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdpT1MnXSwgW1ZFUlNJT04sIC9fL2csICcuJ11dLCBbXG5cbiAgICAgICAgICAgIC8obWFjXFxzb3NcXHN4KVxccz8oW1xcd1xcc1xcLl0rXFx3KSovaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hYyBPU1xuICAgICAgICAgICAgXSwgW05BTUUsIFtWRVJTSU9OLCAvXy9nLCAnLiddXSwgW1xuXG4gICAgICAgICAgICAvLyBPdGhlclxuICAgICAgICAgICAgLyhoYWlrdSlcXHMoXFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhaWt1XG4gICAgICAgICAgICAvKGFpeClcXHMoKFxcZCkoPz1cXC58XFwpfFxccylbXFx3XFwuXSopKi9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBSVhcbiAgICAgICAgICAgIC8obWFjaW50b3NofG1hYyg/PV9wb3dlcnBjKXxwbGFuXFxzOXxtaW5peHxiZW9zfG9zXFwvMnxhbWlnYW9zfG1vcnBob3N8cmlzY1xcc29zKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGFuOS9NaW5peC9CZU9TL09TMi9BbWlnYU9TL01vcnBoT1MvUklTQ09TXG4gICAgICAgICAgICAvKHVuaXgpXFxzPyhbXFx3XFwuXSspKi9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVOSVhcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXVxuICAgICAgICBdXG4gICAgfTtcblxuICAgIHZhciBVQVBhcnNlciA9IGZ1bmN0aW9uIFVBUGFyc2VyICh1YXN0cmluZykge1xuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVUFQYXJzZXIpKSByZXR1cm4gbmV3IFVBUGFyc2VyKHVhc3RyaW5nKS5nZXRSZXN1bHQoKTtcblxuICAgICAgICB2YXIgdWEgPSB1YXN0cmluZyB8fCAoKHdpbmRvdyAmJiB3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KSA/IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50IDogRU1QVFkpO1xuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBVQVBhcnNlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVUFQYXJzZXIodWFzdHJpbmcpLmdldFJlc3VsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2V0QnJvd3NlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBwZXIucmd4LmFwcGx5KHRoaXMsIHJlZ2V4ZXMuYnJvd3Nlcik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0Q1BVID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcHBlci5yZ3guYXBwbHkodGhpcywgcmVnZXhlcy5jcHUpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldERldmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBwZXIucmd4LmFwcGx5KHRoaXMsIHJlZ2V4ZXMuZGV2aWNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRFbmdpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwcGVyLnJneC5hcHBseSh0aGlzLCByZWdleGVzLmVuZ2luZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0T1MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwcGVyLnJneC5hcHBseSh0aGlzLCByZWdleGVzLm9zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRSZXN1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYnJvd3NlciA6IHRoaXMuZ2V0QnJvd3NlcigpLFxuICAgICAgICAgICAgICAgIGVuZ2luZSAgOiB0aGlzLmdldEVuZ2luZSgpLFxuICAgICAgICAgICAgICAgIG9zICAgICAgOiB0aGlzLmdldE9TKCksXG4gICAgICAgICAgICAgICAgZGV2aWNlICA6IHRoaXMuZ2V0RGV2aWNlKCksXG4gICAgICAgICAgICAgICAgY3B1ICAgICA6IHRoaXMuZ2V0Q1BVKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0VUEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdWE7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2V0VUEgPSBmdW5jdGlvbiAodWFzdHJpbmcpIHtcbiAgICAgICAgICAgIHVhID0gdWFzdHJpbmc7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zZXRVQSh1YSk7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gVUFQYXJzZXI7XG59KSh0aGlzKTtcbiIsInZhciBvdXRkYXRlZEJyb3dzZXJGb3JrID0gcmVxdWlyZShcIm91dGRhdGVkLWJyb3dzZXItcmV3b3JrXCIpO1xuXG5vdXRkYXRlZEJyb3dzZXJGb3JrKHtcbiAgICBicm93c2VyU3VwcG9ydDoge1xuICAgICAgICAnSUUnOiA5LFxuICAgICAgICAnU2FmYXJpJzogN1xuICAgIH1cbn0pO1xuIl19
