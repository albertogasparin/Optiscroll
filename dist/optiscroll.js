/**
 * OptiScroll.js v0.8.2
 * Alberto Gasparin
 */


;(function ( window, document, undefined ) {
  'use strict';


/**
 * OptiScroll, use this to create instances
 * ```
 * var scrolltime = new OptiScroll(element);
 * ```
 */
var OptiScroll = function OptiScroll(element, options) {
  return new OptiScroll.Instance(element, options || {});
};


  
var GS = OptiScroll.globalSettings = {
  scrollMinUpdateInterval: 1000 / 60, // 60 FPS
  checkFrequency: 1000,
  pauseCheck: false
};

var D = OptiScroll.defaults = {
  fixTouchPageBounce: true,
  forcedScrollbars: false,
  scrollStopDelay: 300,
  maxTrackSize: 95,
  minTrackSize: 5,
  draggableTracks: true,
  autoUpdate: true,
  classPrefix: 'optiscroll'
};



OptiScroll.Instance = function ( element, options ) {
  this.element = element;
  this.scrollEl = element.children[0];
  
  // instance variables
  this.settings = _extend( _extend({}, OptiScroll.defaults), options || {});
  
  this.cache = {};
  
  this.init();
};



OptiScroll.Instance.prototype.init = function () {
  var self = this,
      createScrollbars = G.nativeScrollbarSize || this.settings.forcedScrollbars;

  if(this.settings.autoUpdate) {
    // add for timed check
    G.instances.push( this );
  }

  this.scrollbars = { 
    v: new Scrollbar('v', this), 
    h: new Scrollbar('h', this) 
  };

  if(createScrollbars) {
    Utils.hideNativeScrollbars(this.scrollEl);
    _invoke(this.scrollbars, 'create');
  } 

  if(G.isTouch && this.settings.fixTouchPageBounce) {
    this.element.classList.add( this.settings.classPrefix+'-touchfix' );
  }

  // calculate scrollbars
  this.update();

  this.bindEvents();

  if(!G.checkTimer) {
    Utils.checkLoop();
  }

};

  

OptiScroll.Instance.prototype.bindEvents = function () {
  var self = this,
      listeners = this.listeners = {},
      scrollEl = this.scrollEl;

  // scroll event binding
  listeners.scroll = function (ev) { Events.scroll.call(self, ev); };
  scrollEl.addEventListener('scroll', listeners.scroll);

  // overflow events bindings (non standard)
  // to update scrollbars immediately 
  listeners.overflow = function (ev) { self.update() };
  scrollEl.addEventListener('overflow', listeners.overflow); // Moz
  scrollEl.addEventListener('underflow', listeners.overflow); // Moz
  scrollEl.addEventListener('overflowchanged', listeners.overflow); // Webkit

  if(G.isTouch) {

    listeners.touchstart = function (ev) { Events.touchstart.call(self, ev); };
    scrollEl.addEventListener('touchstart', listeners.touchstart);

    listeners.touchmove = function (ev) { Events.touchmove.call(self, ev); };
    scrollEl.addEventListener('touchmove', listeners.touchmove);
  }

};




OptiScroll.Instance.prototype.update = function () {
  var oldcH = this.cache.clientHeight,
      scrollEl = this.scrollEl,
      cache = this.cache,
      sH = scrollEl.scrollHeight,
      cH = scrollEl.clientHeight,
      sW = scrollEl.scrollWidth,
      cW = scrollEl.clientWidth;
  
  if( sH !== cache.scrollHeight || cH !== cache.clientHeight || 
    sW !== cache.scrollWidth || cW !== cache.clientWidth ) {
    
    // if the element is no more in the DOM
    if(sH === 0 && cH === 0 && this.element.parentNode === null) {
      this.destroy()
      return false;
    }

    cache.scrollHeight = sH;
    cache.clientHeight = cH;
    cache.scrollWidth = sW;
    cache.clientWidth = cW;

    if( oldcH !== undefined ) {
      // don't fire on init
      this.fireCustomEvent('sizechange');
    }

    // this will update the scrollbar
    // and check if bottom is reached
    Events.scrollStop.call(this);
  }
};




/**
 * Animate scrollTo
 * ```
 * $(el).optiScroll('scrollTo', 'left', 100, 200) // scrolls x,y in 200ms
 * ```
 */
OptiScroll.Instance.prototype.scrollTo = function (destX, destY, duration, disableEvents) {
  var self = this,
      scrollEl = this.scrollEl,
      cache = this.cache,
      startTime, startX, startY, endX, endY;

  G.pauseCheck = true;
  // force update
  this.update();

  startX = endX = scrollEl.scrollLeft;
  startY = endY = scrollEl.scrollTop;
  
  if (typeof destX === 'string') { // left or right
    endX = (destX === 'left') ? 0 : cache.scrollWidth - cache.clientWidth;
  } else if (typeof destX === 'number') {
    endX = destX;
  }

  if (typeof destY === 'string') { // top or bottom
    endY = (destY === 'top') ? 0 : cache.scrollHeight - cache.clientHeight;
  } else if (typeof destY === 'number') {
    endY = destY;
  }

  this.disableScrollEvent = disableEvents;

  if(duration === 0) {
    scrollEl.scrollLeft = endX;
    scrollEl.scrollTop = endY;
    animationTimeout( function () { self.disableScrollEvent = false; }); // restore
  } else {
    this.animateScroll(startX, endX, startY, endY, duration || 'auto');
  }
  
};


OptiScroll.Instance.prototype.scrollIntoView = function (elem, duration, delta) {
  var scrollEl = this.scrollEl,
      eDim, sDim,
      leftEdge, topEdge, rightEdge, bottomEdge,
      startTime, startX, startY, endX, endY;

  G.pauseCheck = true;
  // force update
  this.update();

  if(typeof elem === 'string') { // selector
    elem = scrollEl.querySelector(elem);
  }

  if(elem.length && elem.jquery) { // jquery element
    elem = elem[0];
  }

  if(typeof delta === 'number') { // same delta for all
    delta = { top:delta, right:delta, bottom:delta, left:delta };
  }

  delta = delta || {};
  eDim = elem.getBoundingClientRect();
  sDim = scrollEl.getBoundingClientRect();

  startX = endX = scrollEl.scrollLeft;
  startY = endY = scrollEl.scrollTop;
  leftEdge = startX + eDim.left - sDim.left - (delta.left || 0);
  topEdge = startY + eDim.top - sDim.top - (delta.top || 0);
  rightEdge = startX + eDim.left - sDim.left + eDim.width - sDim.width + (delta.right || 0);
  bottomEdge = startY + eDim.top - sDim.top + eDim.height - sDim.height + (delta.bottom || 0);

  if(leftEdge < startX || rightEdge > startX) {
    endX = (leftEdge < startX) ? leftEdge : rightEdge;
  }

  if(topEdge < startY || bottomEdge > startY) {
    endY = (topEdge < startY) ? topEdge : bottomEdge;
  }

  if(endX < 0) { endX = 0; }
  if(endY < 0) { endY = 0; }
  
  // animate only if element is out of view
  if(endX !== startX || endY !== startY) { 

    if(duration === 0) {
      scrollEl.scrollLeft = endX;
      scrollEl.scrollTop = endY;
    } else {
      this.animateScroll(startX, endX, startY, endY, duration || 'auto');
    }
  }
};


  



OptiScroll.Instance.prototype.destroy = function () {
  var scrollEl = this.scrollEl,
      listeners = this.listeners,
      index = G.instances.indexOf( this );

  // remove instance from global timed check
  if (index > -1) {
    G.instances.splice(index, 1);
  }

  // unbind events
  scrollEl.removeEventListener('scroll', listeners.scroll);
  scrollEl.removeEventListener('overflow', listeners.overflow);
  scrollEl.removeEventListener('underflow', listeners.overflow);
  scrollEl.removeEventListener('overflowchanged', listeners.overflow);

  scrollEl.removeEventListener('touchstart', listeners.touchstart);
  scrollEl.removeEventListener('touchmove', listeners.touchmove);

  // remove scrollbars elements
  _invoke(this.scrollbars, 'remove');
  
  // restore style
  scrollEl.removeAttribute('style');
};




OptiScroll.Instance.prototype.animateScroll = function (startX, endX, startY, endY, duration) {
  var self = this,
      scrollEl = this.scrollEl,
      startTime = getTime();
  
  if(duration === 'auto') { 
    // 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms
    duration = Math.pow( Math.max( Math.abs(endX - startX), Math.abs(endY - startY) ), 0.62) * 15;
  }

  if(typeof duration !== 'number') { // if duration was 'asd'
    duration = 500;
  }

  var scrollAnimation = function () {
    var time = Math.min(1, ((getTime() - startTime) / duration)),
        easedTime = easingFunction(time);
    
    if( endY !== startY ) {
      scrollEl.scrollTop = (easedTime * (endY - startY)) + startY;
    }
    if( endX !== startX ) {
      scrollEl.scrollLeft = (easedTime * (endX - startX)) + startX;
    }

    if(time < 1) {
      animationTimeout(scrollAnimation);
    } else {
      self.disableScrollEvent = false;
      // now the internal scroll event will fire
    }
  };
  
  animationTimeout(scrollAnimation);
};





OptiScroll.Instance.prototype.fireCustomEvent = function (eventName) {
  var eventData = Utils.exposedData(this.cache),
      cEvent = new CustomEvent(eventName, { detail: eventData });
  
  this.element.dispatchEvent(cEvent);
};




var Events = OptiScroll.Events = {};


Events.scroll = function (ev) {
  var self = this,
      cache = this.cache,
      now = getTime();

  if(this.disableScrollEvent) return;

  if (!G.pauseCheck && !G.isTouch) {
    this.element.classList.add( this.settings.classPrefix+'-scrolling' );
  }
  G.pauseCheck = true;

  if( !GS.scrollMinUpdateInterval || now - (cache.scrollNow || 0) >= GS.scrollMinUpdateInterval ) {

    _invoke(this.scrollbars, 'update');

    cache.scrollNow = now;
    
    clearTimeout(this.scrollStopTimer);
    this.scrollStopTimer = setTimeout(function () {
      Events.scrollStop.call(self);
    }, this.settings.scrollStopDelay);
  }

};



Events.touchstart = function (ev) {
  // clear scrollStop timer
  clearTimeout(this.scrollStopTimer);

  if(this.settings.fixTouchPageBounce) {
    _invoke(this.scrollbars, 'update', [true]);
  }
  this.cache.scrollNow = getTime();
};



Events.touchmove = function (ev) {
  G.pauseCheck = true; 
};



Events.scrollStop = function () {
  var eventData, cEvent;

  // prevents multiple 
  clearTimeout(this.scrollStopTimer);

  if(!G.isTouch) {
    this.element.classList.remove( this.settings.classPrefix+'-scrolling' );
  }

  // update position, cache and detect edge
  _invoke(this.scrollbars, 'update');

  // fire custom event
  this.fireCustomEvent('scrollstop');

  // restore check loop
  G.pauseCheck = false;
};




var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      parentEl = instance.element,
      scrollEl = instance.scrollEl,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      sizeProp = isVertical ? 'Height' : 'Width',
      clientSize = 'client'+sizeProp,
      scrollSize = 'scroll'+sizeProp,
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],

      enabled = false,
      scrollbarEl = null,
      trackEl = null,
      dragData = null,
      animated = false;

  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(enabled) {
        parentEl.classList.add( which+'track-on' );
      } else {
        parentEl.classList.remove( which+'track-on' );
      }

      if(trackEl && enabled) {
        trackEl.style[G.cssTransition] = G.trackTransitions;
      }
    },


    create: function () {
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix+'-'+which;
      trackEl.className = settings.classPrefix+'-'+which+'track';
      scrollbarEl.appendChild(trackEl);
      parentEl.appendChild(scrollbarEl);

      if(settings.draggableTracks) {
        this.bind();
      }
    },


    update: function (isOnTouch) {
      var trackMin = settings.minTrackSize || 0,
          trackMax = settings.maxTrackSize || 100,
          newDim, newRelPos, deltaPos;

      newDim = this.calc(scrollEl[scrollProp], cache[clientSize], cache[scrollSize], trackMin, trackMax);
      newRelPos = ((1 / newDim.size) * newDim.position * 100);
      deltaPos = Math.abs(newDim.position - scrollbarCache.position) * cache[clientSize];

      if(newDim.size === 1 && enabled) {
        this.toggle(false);
      }

      if(newDim.size < 1 && !enabled) {
        this.toggle(true);
      }

      if(trackEl && enabled) {
        if(scrollbarCache.size !== newDim.size) {
          trackEl.style[sizeProp.toLowerCase()] = newDim.size * 100 + '%';
        }

        if( G.isTouch && deltaPos > 20 ) {
          this.animateTrack();
        } else if (animated) {
          this.removeTrackAnimation();
        }

        if(G.cssTransform) {
          trackEl.style[G.cssTransform] = 'translate(' + (isVertical ?  '0,'+newRelPos+'%' : newRelPos+'%'+',0') +')';
        } else { // IE9
          trackEl.style[evNames[0]] = newDim.position * 100 + '%';
        }

      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);

      this.checkEdges(isOnTouch);
    },


    animateTrack: function () {
      animated = true;
      trackEl.style[G.cssTransition] = G.trackTransitions+', '+ G.cssTransformDashed + ' 0.2s linear 0s';
    },


    removeTrackAnimation: function () {
      animated = false;
      trackEl.style[G.cssTransition] = G.trackTransitions;
    },


    bind: function () {
      var self = this;

      var dragStart = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev;
        dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollEl[scrollProp] };
      }

      var dragMove = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev,
            delta, deltaRatio;
        if(!dragData) return;

        ev.preventDefault();
        delta = isVertical ? evData.pageY - dragData.y : evData.pageX - dragData.x;
        deltaRatio = delta / cache[clientSize];
        
        scrollEl[scrollProp] = dragData.scroll + deltaRatio * cache[scrollSize];
      }

      var dragEnd = function (ev) {
        dragData = null;
      }

      trackEl.addEventListener('mousedown', dragStart);
      trackEl.addEventListener('touchstart', dragStart);

      scrollbarEl.addEventListener('mousemove', dragMove);
      scrollbarEl.addEventListener('touchmove', dragMove);

      scrollbarEl.addEventListener('mouseup', dragEnd);
      scrollbarEl.addEventListener('touchend', dragEnd);
    },

    calc: function (position, viewSize, scrollSize, min, max) {
      var minTrackR = min / 100,
          maxTrackR = max / 100,
          sizeRatio, positionRatio, percent;

      sizeRatio = viewSize / scrollSize;

      if(sizeRatio === 1 || scrollSize === 0) { // no scrollbars needed
        return { position: 0, size: 1, percent: 0 };
      }

      positionRatio = position / scrollSize;
      percent = 100 * position / (scrollSize - viewSize);

      if( sizeRatio > maxTrackR ) {
        positionRatio += (sizeRatio - maxTrackR) * (percent / 100);
        sizeRatio = maxTrackR;
      }

      if( sizeRatio < minTrackR ) {
        positionRatio += (sizeRatio - minTrackR) * (percent / 100);
        sizeRatio = minTrackR;
      }

      if(percent < 0) { // overscroll
        positionRatio = 0;
      }

      if(percent > 100) { // overscroll
        positionRatio = 1 - sizeRatio;
      }
      
      return { position: positionRatio, size: sizeRatio, percent: percent };
    },


    checkEdges: function (isOnTouch) {
      var percent = scrollbarCache.percent, scrollFixPosition;

      if(!enabled) return;

      if(scrollbarCache.was !== percent && percent % 100 === 0 && !isOnTouch) {
        instance.fireCustomEvent('scrollreachedge');
        instance.fireCustomEvent('scrollreach'+ evNames[percent/100] );
      }

      if(percent % 100 === 0 && isOnTouch && settings.fixTouchPageBounce) {
        scrollFixPosition = percent ? scrollbarCache.position * cache[scrollSize] - 1 : 1;
        instance.scrollTo( isVertical ? false : scrollFixPosition, isVertical ? scrollFixPosition : false , 0, true);
      }

      // if(percent > 0 && percent < 100) // update only if not overscroll
        scrollbarCache.was = percent;
    },


    remove: function () {
      if(scrollbarEl) {
        parentEl.removeChild(scrollbarEl);
      }
    }


  };

};

var Utils = OptiScroll.Utils = {};



Utils.hideNativeScrollbars = function (scrollEl) {
  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    scrollEl.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      scrollEl.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        scrollEl.style.display = 'block'; 
      });
    } else {
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
    }
    
  } else {
    // force scrollbars and hide them
    scrollEl.style.overflow = 'scroll';
    scrollEl.style.right = -G.nativeScrollbarSize + 'px';
    scrollEl.style.bottom = -G.nativeScrollbarSize + 'px';
  }
};




Utils.exposedData = function (obj) {
  return {
    // scrollbars data
    scrollbarV: _extend({}, obj.v),
    scrollbarH: _extend({}, obj.h),

    // scroll position
    scrollTop: obj.v.position * obj.scrollHeight,
    scrollLeft: obj.h.position * obj.scrollWidth,
    scrollBottom: (1 - obj.v.position) * obj.scrollHeight,
    scrollRight: (1 - obj.h.position) * obj.scrollWidth,

    // element size
    scrollWidth: obj.scrollWidth,
    scrollHeight: obj.scrollHeight,
    clientWidth: obj.clientWidth,
    clientHeight: obj.clientHeight
  };
};




Utils.addCssRule = function (selector, rules) {
  var styleSheet = document.getElementById('scroll-sheet');

  if ( !styleSheet ) {
    styleSheet = document.createElement("style");
    styleSheet.appendChild(document.createTextNode("")); // WebKit hack
    styleSheet.id = 'scroll-sheet';
    document.head.appendChild(styleSheet);
  } 

  if(styleSheet.sheet.insertRule) {
    styleSheet.sheet.insertRule(selector + "{" + rules + "}", 0);
  } else {
    styleSheet.sheet.addRule(selector, rules);
  }
}




// Global height checker
// looped to listen element changes
Utils.checkLoop = function () {
  
  if(!G.instances.length) {
    G.checkTimer = null;
    return;
  }

  if(!G.pauseCheck) { // check size only if not scrolling
    _invoke(G.instances, 'update');
  }
  
  if(GS.checkFrequency) {
    G.checkTimer = setTimeout(function () {
      Utils.checkLoop();
    }, GS.checkFrequency);
  }
};






// easeOutCubic function
Utils.easingFunction = function (t) { 
  return (--t) * t * t + 1; 
}








// Global variables
var G = {
  isTouch: 'ontouchstart' in window,
  cssTransition: cssTest('transition'),
  cssTransform: cssTest('transform'),
  cssTransformDashed: '',
  trackTransitions: 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s',
  nativeScrollbarSize: getScrollbarWidth(),

  instances: [],
  checkTimer: null,
  pauseCheck: false
};

G.cssTransformDashed = (G.cssTransform == 'transform') ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase();



var getTime = Date.now || function() { return new Date().getTime(); };


var animationTimeout = (function () {
  return window.requestAnimationFrame 
    || window.webkitRequestAnimationFrame 
    || window.mozRequestAnimationFrame 
    || window.msRequestAnimationFrame 
    || window.oRequestAnimationFrame 
    || function(callback){ window.setTimeout(callback, 1000/60); };
})();



// Get scrollbars width, thanks Google Closure Library
function getScrollbarWidth () {
  var htmlEl = document.documentElement,
      outerEl, innerEl, width = 0;

  outerEl = document.createElement('div');
  outerEl.style.cssText = 'overflow:auto;width:50px;height:50px;' + 'position:absolute;left:-100px';

  innerEl = document.createElement('div');
  innerEl.style.cssText = 'width:100px;height:100px';

  outerEl.appendChild(innerEl);
  htmlEl.appendChild(outerEl);
  width = outerEl.offsetWidth - outerEl.clientWidth;
  htmlEl.removeChild(outerEl);

  return width;
}


// Detect css3 support, thanks Modernizr
function cssTest (prop) {
  var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
      el = document.createElement( 'test' ),
      props   = (prop + ' ' + ['Webkit','Moz','O','ms'].join(ucProp + ' ') + ucProp).split(' ');

  for ( var i in props ) {
    if ( el.style[ props[i] ] !== undefined ) return props[i];
  }
  return false;
}



function _extend (dest, src, merge) {
  for(var key in src) {
    if(!src.hasOwnProperty(key) || dest[key] !== undefined && merge) {
      continue;
    }
    dest[key] = src[key];
  }
  return dest;
}


function _invoke (collection, fn, args) {
  var i, j, key;
  if(collection.length) {
    for(i = 0, j = collection.length; i < j; i++) {
      if(collection[i][fn]) 
        collection[i][fn].apply(collection[i], args);
    }
  } else {
    for (key in collection) {
      if(collection.hasOwnProperty(key) && collection[key][fn])
        collection[key][fn].apply(collection[key], args);
    }
  }
}

/*
 * Minimal classList shim for IE 9
 * By Devon Govett
 * https://gist.github.com/devongovett/1381839
 * MIT LICENSE
 */
 
if (!("classList" in document.documentElement) && Object.defineProperty && typeof HTMLElement !== 'undefined') {
  Object.defineProperty(HTMLElement.prototype, 'classList', {
    get: function() {
      var self = this;
      function update(fn) {
        return function(value) {
          var classes = self.className.split(/\s+/),
              index = classes.indexOf(value);

          fn(classes, index, value);
          self.className = classes.join(" ");
        }
      }

      var ret = {                    
        add: update(function(classes, index, value) {
            ~index || classes.push(value);
        }),

        remove: update(function(classes, index) {
            ~index && classes.splice(index, 1);
        })
      };

      return ret;
    }
  });
}

// CustomEvent polyfill for IE9
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent

(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   };

  CustomEvent.prototype = window.Event.prototype;

  if (!('CustomEvent' in window))
    window.CustomEvent = CustomEvent;
})();

  // AMD export
  if(typeof define == 'function' && define.amd) {
    define(function(){
      return OptiScroll;
    });
  }
  
  // commonjs export
  if(typeof module !== 'undefined' && module.exports) {
    module.exports = OptiScroll;
  }
  
  window.OptiScroll = OptiScroll;

})(window, document);