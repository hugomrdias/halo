/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

window.matchMedia || (window.matchMedia = function () {
    "use strict";

    // For browsers that support matchMedium api such as IE 9 and webkit
    var styleMedia = (window.styleMedia || window.media);

    // For those that don't support matchMedium
    if (!styleMedia) {
        var style = document.createElement('style'),
            script = document.getElementsByTagName('script')[0],
            info = null;

        style.type = 'text/css';
        style.id = 'matchmediajs-test';

        script.parentNode.insertBefore(style, script);

        // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
        info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

        styleMedia = {
            matchMedium: function (media) {
                var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                if (style.styleSheet) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }

                // Test if media query is true or false
                return info.width === '1px';
            }
        };
    }

    return function (media) {
        return {
            matches: styleMedia.matchMedium(media || 'all'),
            media  : media || 'all'
        };
    };
}());

/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
(function () {
    // Bail out for browsers that have addListener support
    if (window.matchMedia && window.matchMedia('all').addListener) {
        return false;
    }

    var localMatchMedia = window.matchMedia,
        hasMediaQueries = localMatchMedia('only all').matches,
        isListening = false,
        timeoutID = 0,    // setTimeout for debouncing 'handleChange'
        queries = [],   // Contains each 'mql' and associated 'listeners' if 'addListener' is used
        handleChange = function (evt) {
            // Debounce
            clearTimeout(timeoutID);

            timeoutID = setTimeout(function () {
                for (var i = 0, il = queries.length; i < il; i++) {
                    var mql = queries[i].mql,
                        listeners = queries[i].listeners || [],
                        matches = localMatchMedia(mql.media).matches;

                    // Update mql.matches value and call listeners
                    // Fire listeners only if transitioning to or from matched state
                    if (matches !== mql.matches) {
                        mql.matches = matches;

                        for (var j = 0, jl = listeners.length; j < jl; j++) {
                            listeners[j].call(window, mql);
                        }
                    }
                }
            }, 30);
        };

    window.matchMedia = function (media) {
        var mql = localMatchMedia(media),
            listeners = [],
            index = 0;

        mql.addListener = function (listener) {
            // Changes would not occur to css media type so return now (Affects IE <= 8)
            if (!hasMediaQueries) {
                return;
            }

            // Set up 'resize' listener for browsers that support CSS3 media queries (Not for IE <= 8)
            // There should only ever be 1 resize listener running for performance
            if (!isListening) {
                isListening = true;
                window.addEventListener('resize', handleChange, true);
            }

            // Push object only if it has not been pushed already
            if (index === 0) {
                index = queries.push({
                    mql      : mql,
                    listeners: listeners
                });
            }

            listeners.push(listener);
        };

        mql.removeListener = function (listener) {
            for (var i = 0, il = listeners.length; i < il; i++) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                }
            }
        };

        return mql;
    };
}());


// https://github.com/jonathantneal/svg4everybody/blob/master/svg4everybody.js
(function (document, uses, requestAnimationFrame, CACHE, IE9TO11) {
    function embed(svg, g) {
        if (g) {
            var
                viewBox = g.getAttribute('viewBox'),
                fragment = document.createDocumentFragment(),
                clone = g.cloneNode(true);

            if (viewBox) {
                svg.setAttribute('viewBox', viewBox);
            }

            while (clone.childNodes.length) {
                fragment.appendChild(clone.childNodes[0]);
            }

            svg.appendChild(fragment);
        }
    }

    function onload() {
        var xhr = this, x = document.createElement('x'), s = xhr.s;

        x.innerHTML = xhr.responseText;

        xhr.onload = function () {
            s.splice(0).map(function (array) {
                embed(array[0], x.querySelector('#' + array[1].replace(/(\W)/g, '\\$1')));
            });
        };

        xhr.onload();
    }

    function onframe() {
        var use;

        while ((use = uses[0])) {
            var
                svg = use.parentNode,
                url = use.getAttribute('xlink:href').split('#'),
                url_root = url[0],
                url_hash = url[1];

            svg.removeChild(use);

            if (url_root.length) {
                var xhr = CACHE[url_root] = CACHE[url_root] || new XMLHttpRequest();

                if (!xhr.s) {
                    xhr.s = [];

                    xhr.open('GET', url_root);

                    xhr.onload = onload;

                    xhr.send();
                }

                xhr.s.push([svg, url_hash]);

                if (xhr.readyState === 4) {
                    xhr.onload();
                }

            } else {
                embed(svg, document.getElementById(url_hash));
            }
        }

        requestAnimationFrame(onframe);
    }

    if (IE9TO11) {
        onframe();
    }
})(
    document,
    document.getElementsByTagName('use'),
    window.requestAnimationFrame || window.setTimeout,
    {},
    /Trident\/[567]\b/.test(navigator.userAgent) || (navigator.userAgent.match(/AppleWebKit\/(\d+)/) || [])[1] < 537
);

