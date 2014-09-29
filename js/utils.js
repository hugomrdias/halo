(function (window, document, m) {
    "use strict";
    if (!m) {
        throw new Error('Modernizr not available');
    }

    function extend(target, obj) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                target[i] = obj[i];
            }
        }
    }

    function getTotalWidthOrHeight(name, el) {
        var cssExpand = ['Top', 'Right', 'Bottom', 'Left'],
            elStyles = window.getComputedStyle(el),
            isWidth = name === 'width',
            attrCount = isWidth ? 1 : 0,
            val = 0;

        for (; attrCount < 4; attrCount += 2) {
            val += parseInt(elStyles['margin' + cssExpand[attrCount]], 10);
        }

        return val + (isWidth ? el.offsetWidth : el.offsetHeight);
    }

    var utils = {
        ccsomPrefixes: 'Webkit Moz O ms', // https://github.com/Modernizr/Modernizr/blob/master/src/omPrefixes.js
        cssPrefixes  : ' -webkit- -moz- -o- -ms- '.split(' '),
        domPredixes  : 'Webkit Moz O ms'.toLocaleLowerCase().split(' '),
        extend       : extend,
        getTime      : Date.now || function getTime() {
            return new Date().getTime();
        },
        getHeight    : function (el) {
            return getTotalWidthOrHeight('height', el);
        },
        getWidth     : function (el) {
            return getTotalWidthOrHeight('width', el);
        }
    }

    utils.support = {
        hasTouch      : 'ontouchstart' in window,
        hasMSPointer  : window.navigator.msPointerEnabled,
        hasPointer    : window.navigator.pointerEnabled,
        hasTransitions: m.csstransitions,
        matrix        : !!(window.WebKitCSSMatrix || window.MSCSSMatrix)
    }

    utils.style = {
        transform               : m.prefixed('transform'),
        transition              : m.prefixed('transition'),
        transitionTimingFunction: m.prefixed('transitionTimingFunction'),
        transitionDuration      : m.prefixed('transitionDuration'),
        transitionProperty      : m.prefixed('transitionProperty'),
        transitionDelay         : m.prefixed('transitionDelay')
    }

    utils.events = {
        fastClick    : utils.support.hasTouch ? 'touchstart' : 'click',
        transitionEnd: (function () {
            var props = {
                'WebkitTransition': 'webkitTransitionEnd',
                'OTransition'     : 'oTransitionEnd',
                'msTransition'    : 'MSTransitionEnd',
                'transition'      : 'transitionend'
            };
            return props.hasOwnProperty(utils.style.transition) ? props[utils.style.transition] : false;
        }.call())
    };

    utils.eventType = {
        touchstart : 1,
        touchmove  : 1,
        touchend   : 1,
        touchcancel: 1,

        mousedown  : 2,
        mousemove  : 2,
        mouseup    : 2,
        mousecancel: 2,

        MSPointerDown  : 3,
        MSPointerMove  : 3,
        MSPointerUp    : 3,
        MSPointerCancel: 3,

        pointerdown  : 4,
        pointermove  : 4,
        pointerup    : 4,
        pointercancel: 4
    };

    utils.raf = (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    }).bind(window);

    utils.tap = function (e, eventName) {
        var ev = document.createEvent('Event');
        ev.initEvent(eventName, true, true);
        ev.pageX = e.pageX;
        ev.pageY = e.pageY;
        e.target.dispatchEvent(ev);
    };

    utils.click = function (e) {
        var target = e.target,
            ev;

        if (!(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName)) {
            ev = document.createEvent('MouseEvents');
            ev.initMouseEvent('click', true, true, e.view, 1,
                target.screenX, target.screenY, target.clientX, target.clientY,
                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                0, null);

            ev._constructed = true;
            target.dispatchEvent(ev);
        }
    };

    window.HaloUtils = utils;
})
(window, window.document, window.Modernizr);

