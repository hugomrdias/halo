(function (window, document, m, enquire, u) {
    "use strict";

    var html = document.documentElement,
        body = document.body;

    function Nav(options) {
        this.options = {
            sidebar           : document.querySelector('.Sidebar'),
            overlay           : document.querySelector('.Sidebar-overlay'),
            button            : document.querySelector('.Header-brand'),
            content           : document.querySelector('.Content'),
            class             : 'is-openNav',
            mq                : "screen and (max-width: 1025px)",
            transitionDuration: 300
        };
        u.extend(this.options, options);
        this.navWidth = this.options.sidebar.offsetWidth;
        this.navStyle = this.options.sidebar.style;
        this.overlayStyle = this.options.overlay.style;
        this.isOpen = false;
        this.inTransition = false;
        this.momentum = this.options.transitionDuration;
        this.touchStartTime = 0;
        this.currentTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchX = 0;
        this.deltaXAbs = 0;
        this.deltaYAbs = 0;
        this.x = 0;
        this.y = 0;
        this.scrolling = false;
        this.dragging = false;
        this.initiated = 0;
        this.scrollTop = 0;
        this.rafRequest = null;
        this.isClick = true;

        //events
        //enquire.register(this.options.mq, {
        //    match  : this.events.bind(this),
        //    unmatch: this.events.bind(this, true)
        //});

        var mql = window.matchMedia(this.options.mq);

        if (mql.matches) {
            this.events();
        } else {
            this.events(true);
        }

        mql.addListener(function (m) {
            if (m.matches) {
                this.events();
            } else {
                this.events(true);
            }
        }.bind(this));
    }

    Nav.prototype = {

        close: function () {
            this.isOpen = false;

            if (u.support.hasTransitions) {
                this.rafRequest = u.raf(function () {
                    this.transition(this.options.transitionDuration);
                    this.translate(0, 0);
                    this.overlayStyle.opacity = 0;
                    this.overlayStyle.pointerEvents = 'none';
                }.bind(this));
            } else {
                html.classList.remove(this.options.class);
                this.navStyle.left = -this.navWidth + 'px';
                this.overlayStyle.opacity = 0;
                this.overlayStyle.pointerEvents = 'none';
            }
        },

        open: function () {
            this.isOpen = true;
            if (u.support.hasTransitions) {
                this.rafRequest = u.raf(function () {
                    this.transition(this.options.transitionDuration);
                    this.translate(this.navWidth, 0);
                    this.overlayStyle.opacity = 1;
                    this.overlayStyle.pointerEvents = 'auto';
                }.bind(this));
            } else {
                html.classList.add(this.options.class);
                this.navStyle.left = 0;
                this.overlayStyle.opacity = 1;
                this.overlayStyle.pointerEvents = 'auto';
            }
        },

        toggle: function () {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        onTransitionEnd: function (e) {
            if (e.currentTarget === this.options.sidebar) {
                this.transition(0, 0);
                if (this.isOpen) {
                    html.classList.add(this.options.class);
                } else {
                    html.classList.remove(this.options.class);

                }
            }
        },

        onTouchStart: function (e) {
            // React to left mouse button only
            if (u.eventType[e.type] !== 1) {
                if (e.button !== 0) {
                    return;
                }
            }

            if (this.initiated && u.eventType[e.type] !== this.initiated) {
                return;
            }
            var touches = e.touches ? e.touches[0] : e;

            this.initiated = u.eventType[e.type];
            this.isClick = true;
            this.dragging = false;

            this.touchStartTime = u.getTime();
            this.touchStartX = touches.pageX;
            this.touchStartY = touches.pageY;
            this.touchX = touches.pageX;

            console.log('start', touches.pageX, touches.pageY, this.initiated);
        },

        onTouchMove: function (e) {
            if (u.eventType[e.type] !== this.initiated) {
                //console.log('diferent event type ignore');
                return;
            }
            var touches = e.touches ? e.touches[0] : e,
                newX,
                distX;

            this.deltaXAbs = Math.abs(touches.pageX - this.touchStartX);
            this.deltaYAbs = Math.abs(touches.pageY - this.touchStartY);
            this.scrolling = this.initiated !== 2 && this.deltaYAbs > this.deltaXAbs;

            if (this.scrolling && !this.dragging) {
                console.log('scrolling move');
                return;
            }
            // 1 to 1 movement
            distX = touches.pageX - this.touchX;
            this.touchX = touches.pageX;
            newX = this.x + distX;

            // boundaries
            if (newX > 0 && newX < this.navWidth) {
                if (this.deltaXAbs > 10) { // start dragg only after 10 px everything else will be clicks
                    this.translate(newX, 0);
                    this.dragging = true;
                    this.isClick = false;
                }
            }
            e.preventDefault();
            e.stopPropagation();
        },

        onTouchEnd: function (e) {
            console.log('touchend: dragging - ' + this.dragging + ' click - ' + this.isClick);

            // sync event types
            if (u.eventType[e.type] !== this.initiated) {
                return;
            }
            this.currentTime = u.getTime();
            var duration = this.currentTime - this.touchStartTime,
                currentTarget = e.target;

            // Scrolling
            if (this.scrolling && !this.dragging) {
                console.log('scrolling end');
                this.scrolling = false;
                return;
            }

            // Dragging  - to transition the sidebar need to have moved
            if (this.dragging) {
                // flick
                if (duration < 200 && this.deltaXAbs > 35) {
                    var distance = this.deltaXAbs,
                        speed = distance / duration;
                    this.momentum = (this.navWidth - distance) / speed;
                    this.toggle();
                } else if (this.x > (this.navWidth / 2)) {
                    this.open();
                } else if (this.x <= (this.navWidth / 2)) {
                    this.close();
                }
            } else if (this.isClick) {
                console.log('click emulated');
                u.click(e);
                if (currentTarget != this.options.sidebar && !currentTarget.classList.contains('.notoggle')) {
                    this.toggle();
                }
            }
            e.preventDefault();
            e.stopPropagation();
            this.dragging = false;
            this.initiated = 0;
        },

        transition: function (time, easing) {
            time = time || 0;
            easing = easing || 'cubic-bezier(0.1, 0.57, 0.1, 1)';
            if (this.momentum) {
                time = this.momentum;
                this.momentum = false;
            }
            this.inTransition = time > 0;
            this.navStyle[u.style.transitionDuration] = time + 'ms';
            this.navStyle[u.style.transitionTimingFunction] = easing;
            // overlay
            this.overlayStyle[u.style.transitionDuration] = time + 'ms';
            this.overlayStyle[u.style.transitionTimingFunction] = easing;

        },

        translate: function (x, y) {
            this.navStyle[u.style.transform] = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
            this.x = x;
            this.y = y;
        },

        handleEvent: function (e) {
            // stop everything while transition is running
            if (this.inTransition && e.type !== u.events.transitionEnd) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            switch (e.type) {
                case u.events.transitionEnd:
                    this.onTransitionEnd(e);
                    break;
                case 'touchstart':
                case 'MSPointerDown':
                case 'mousedown':
                    if (e.currentTarget === this.options.sidebar) {
                        this.onTouchStart(e);
                    }
                    if (e.currentTarget === this.options.button || e.currentTarget === this.options.overlay) {
                        e.stopPropagation();
                        e.preventDefault();
                        this.toggle();
                    }
                    break;
                case "click":
                    e.stopPropagation();
                    e.preventDefault();
                    this.toggle();
                    break;
                case 'touchmove':
                case 'MSPointerMove':
                case 'mousemove':
                    this.onTouchMove(e);
                    break;
                case 'touchend':
                case 'MSPointerUp':
                case 'mouseup':
                case 'touchcancel':
                case 'MSPointerCancel':
                case 'mousecancel':
                    this.onTouchEnd(e);
                    break;
            }
        },
        block      : function (e) {
            if (!e._constructed) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        events     : function (remove) {
            var type = remove ? "removeEventListener" : "addEventListener";

            this.options.overlay[type](u.events.fastClick, this);
            this.options.button[type](u.events.fastClick, this);

            this.options.sidebar[type](u.events.transitionEnd, this);
            this.options.sidebar[type]("click", this.block);

            if (u.support.hasTouch) {
                console.log('register touch');
                // block click if we are using touchstart
                this.options.button[type]("click", this.block);
                this.options.overlay[type]("click", this.block);

                this.options.sidebar[type]("touchstart", this);
                this.options.sidebar[type]("touchmove", this);
                this.options.sidebar[type]("touchcancel", this);
                this.options.sidebar[type]("touchend", this);
            }

            if (u.support.hasPointer || u.support.hasMSPointer) {
                console.log('register pointer');
                if (u.support.hasPointer) {
                    this.options.sidebar[type]("pointerdown", this);
                    this.options.sidebar[type]("pointermove", this);
                    this.options.sidebar[type]("pointercancel", this);
                    this.options.sidebar[type]("pointerup", this);
                } else {
                    this.options.sidebar[type]("MSPointerDown", this);
                    this.options.sidebar[type]("MSPointerMove", this);
                    this.options.sidebar[type]("MSPointerCancel", this);
                    this.options.sidebar[type]("MSPointerUp", this);
                }
            } else {
                console.log('register mouse');
                this.options.sidebar[type]("mousedown", this);
                this.options.sidebar[type]("mousemove", this);
                this.options.sidebar[type]("mousecancel", this);
                this.options.sidebar[type]("mouseup", this);
            }
        }
    };

    // auto setup nav

    window.nav = new Nav();

})(window, window.document, window.Modernizr, window.enquire, window.HaloUtils);
