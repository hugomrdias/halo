(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['halo-utils'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./halo-utils'));
    } else {
        root.HaloSidebar = factory(root.HaloUtils);
    }
}(this, function (u) {

    var window = this,
        document = window.document,
        html = document.documentElement,
        body = document.body;

    function Nav(options) {
        this.options = {
            button            : document.querySelector('.Header-title'),
            sidebar           : document.querySelector('.Sidebar'),
            content           : document.querySelector('.Content'),
            class             : 'is-openNav',
            mq                : "screen and (max-width: 1025px)",
            transitionDuration: 400,
            easing            : 'ease'//'cubic-bezier(0.1, 0.57, 0.1, 1)'
        };

        u.extend(this.options, options);

        this.options.overlay = document.createElement('div');
        this.options.overlay.classList.add('halo-Sidebar-overlay');
        body.appendChild(this.options.overlay);
        this.options.content.classList.add('halo-Sidebar-content');
        this.options.sidebar.classList.add('halo-Sidebar');

        this.navWidth = parseInt(window.getComputedStyle(this.options.sidebar).getPropertyValue('width').replace('px',
            ''), 10);
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
        this.scrolling = false;
        this.dragging = false;
        this.initiated = 0;
        this.isClick = true;

        this.mq();

    }

    Nav.prototype = {
        mq: function () {
            var mql = window.matchMedia(this.options.mq);

            if (mql.matches) {
                this.events();
                this.isOpen = false;
                html.classList.remove(this.options.class);
            } else {
                this.events(true);
                this.clean();
                this.isOpen = true;
                html.classList.add(this.options.class);
            }

            mql.addListener(function (m) {
                if (m.matches) {
                    this.events();
                    this.isOpen = false;
                    html.classList.remove(this.options.class);
                } else {
                    this.events(true);
                    this.clean();
                    this.isOpen = true;
                    html.classList.add(this.options.class);
                }
            }.bind(this));
        },

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

        clean: function () {
            this.navStyle.left = '';
            this.navStyle[u.style.transform] = '';
            this.navStyle[u.style.transitionDuration] = '';
            this.navStyle[u.style.transitionTimingFunction] = '';

            this.overlayStyle.opacity = '';
            this.overlayStyle.pointerEvents = '';
            this.overlayStyle[u.style.transitionDuration] = '';
            this.overlayStyle[u.style.transitionTimingFunction] = '';
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
        },

        onTouchMove: function (e) {
            if (u.eventType[e.type] !== this.initiated) {
                return;
            }
            var touches = e.touches ? e.touches[0] : e,
                newX,
                distX;

            this.deltaXAbs = Math.abs(touches.pageX - this.touchStartX);
            this.deltaYAbs = Math.abs(touches.pageY - this.touchStartY);
            this.scrolling = this.initiated !== 2 && this.deltaYAbs > this.deltaXAbs;

            if (this.scrolling && !this.dragging) {
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
                    e.preventDefault();
                    //e.stopPropagation();
                }

            }
        },

        onTouchEnd: function (e) {

            // sync event types
            if (u.eventType[e.type] !== this.initiated) {
                return;
            }
            this.currentTime = u.getTime();
            var duration = this.currentTime - this.touchStartTime,
                currentTarget = e.target;

            // Scrolling
            if (this.scrolling && !this.dragging) {
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
                this.dragging = false;
            } else if (this.isClick) {
                u.click(e);
                if (currentTarget != this.options.sidebar && !currentTarget.classList.contains('.notoggle')) {
                    this.toggle();
                }
            }
            //e.preventDefault();
            //e.stopPropagation();
            this.initiated = 0;
        },

        transition: function (time, easing) {
            time = time || 0;
            easing = easing || this.options.easing;
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

        translate: function (x) {
            this.navStyle[u.style.transform] = 'translate3d(' + x + 'px, 0, 0)';
            this.x = x;
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
                        console.log('fast click');
                        e.stopPropagation();
                        e.preventDefault();
                        this.toggle();
                    }
                    break;
                case "click":
                    console.log('click');
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

        block: function (e) {
            if (!e._constructed) {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        events: function (remove) {
            var type = remove ? "removeEventListener" : "addEventListener";

            this.options.sidebar[type](u.events.transitionEnd, this);
            this.options.sidebar[type]("click", this.block);

            if (u.support.hasTouch) {
                console.log('register touch');
                this.options.button[type]("touchstart", this);
                this.options.overlay[type]("touchstart", this);

                this.options.button[type]("click", this.block);
                this.options.overlay[type]("click", this.block);

                this.options.sidebar[type]("touchstart", this);
                this.options.sidebar[type]("touchmove", this);
                this.options.sidebar[type]("touchcancel", this);
                this.options.sidebar[type]("touchend", this);
            } else if (u.support.hasPointer || u.support.hasMSPointer) {
                console.log('register pointer');
                this.options.overlay[type]("click", this);
                this.options.button[type]("click", this);

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
                this.options.overlay[type]("click", this);
                this.options.button[type]("click", this);

                this.options.sidebar[type]("mousedown", this);
                this.options.sidebar[type]("mousemove", this);
                this.options.sidebar[type]("mousecancel", this);
                this.options.sidebar[type]("mouseup", this);
            }
        }
    };

    return Nav;
}));
