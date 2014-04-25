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
  maxTrackSize: 90,
  minTrackSize: 5,
  draggableTracks: true,
  autoUpdate: true,
  classPrefix: 'optiscroll',
  trackTransitions: 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s'
};



OptiScroll.Instance = function ( element, options ) {
  this.element = element;
  this.scrollElement = element.children[0];
  
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
    Utils.hideNativeScrollbars(this.scrollElement);
    _invoke(this.scrollbars, 'create');
  } 

  if(G.isTouch && this.settings.fixTouchPageBounce) {
    this.element.classList.add( this.settings.classPrefix+'-touchfix' );
  }

  // calculate scrollbars
  this.checkScrollSize();

  this.bindEvents();

  if(!G.checkTimer) {
    Utils.checkLoop();
  }

};

  

OptiScroll.Instance.prototype.bindEvents = function () {
  var self = this,
      scrollElement = this.scrollElement;

  // scroll event binding
  this.scrollEventListener = function (ev) { Events.scroll.call(self, ev); };
  scrollElement.addEventListener('scroll', this.scrollEventListener);

  // overflow events bindings (non standard)
  // to update scrollbars immediately 
  this.overflowEventListener = function (ev) { self.checkScrollSize() };
  scrollElement.addEventListener('overflow', this.overflowEventListener); // Moz
  scrollElement.addEventListener('underflow', this.overflowEventListener); // Moz
  scrollElement.addEventListener('overflowchanged', this.overflowEventListener); // Webkit

  if(G.isTouch) {

    this.touchstartEventListener = function (ev) { Events.touchstart.call(self, ev); };
    scrollElement.addEventListener('touchstart', this.touchstartEventListener);

    this.touchmoveEventListener = function (ev) { Events.touchmove.call(self, ev); };
    scrollElement.addEventListener('touchmove', this.touchmoveEventListener);
  }

};




OptiScroll.Instance.prototype.checkScrollSize = function () {
  var oldcH = this.cache.clientHeight,
      scrollElement = this.scrollElement,
      cache = this.cache,
      sH = scrollElement.scrollHeight,
      cH = scrollElement.clientHeight,
      sW = scrollElement.scrollWidth,
      cW = scrollElement.clientWidth;
  
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
 * ~~~
 * $(el).optiScroll('scrollTo', 'left', 100, 200) // scrolls x,y in 200ms
 * ~~~
 */
OptiScroll.Instance.prototype.scrollTo = function (destX, destY, duration, disableEvents) {
  var self = this,
      scrollElement = this.scrollElement,
      cache = this.cache,
      startTime, startX, startY, endX, endY;

  GS.pauseCheck = true;
  // force update
  this.checkScrollSize();

  startX = endX = scrollElement.scrollLeft;
  startY = endY = scrollElement.scrollTop;
  
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
    scrollElement.scrollLeft = endX;
    scrollElement.scrollTop = endY;
    animationTimeout( function () { self.disableScrollEvent = false; }); // restore
  } else {
    this.animateScroll(startX, endX, startY, endY, duration || 'auto');
  }
  
};


OptiScroll.Instance.prototype.scrollIntoView = function (elem, duration, delta) {
  var scrollElement = this.scrollElement,
      eDim, sDim,
      leftEdge, topEdge, rightEdge, bottomEdge,
      startTime, startX, startY, endX, endY;

  GS.pauseCheck = true;
  // force update
  this.checkScrollSize();

  if(typeof elem === 'string') { // selector
    elem = scrollElement.querySelector(elem);
  }

  if(elem.length && elem.jquery) { // jquery element
    elem = elem[0];
  }

  if(typeof delta === 'number') { // same delta for all
    delta = { top:delta, right:delta, bottom:delta, left:delta };
  }

  delta = delta || {};
  eDim = elem.getBoundingClientRect();
  sDim = scrollElement.getBoundingClientRect();

  startX = endX = scrollElement.scrollLeft;
  startY = endY = scrollElement.scrollTop;
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
      scrollElement.scrollLeft = endX;
      scrollElement.scrollTop = endY;
    } else {
      this.animateScroll(startX, endX, startY, endY, duration || 'auto');
    }
  }
};


  



OptiScroll.Instance.prototype.destroy = function () {
  var scrollElement = this.scrollElement,
      scrollbars = this.scrollbars,
      index = G.instances.indexOf( this );

  // remove instance from global timed check
  if (index > -1) {
    G.instances.splice(index, 1);
  }

  // unbind events
  scrollElement.removeEventListener('scroll', this.scrollEventListener);
  scrollElement.removeEventListener('overflow', this.overflowEventListener);
  scrollElement.removeEventListener('underflow', this.overflowEventListener);
  scrollElement.removeEventListener('overflowchanged', this.overflowEventListener);

  scrollElement.removeEventListener('touchstart', this.touchstartEventListener);
  scrollElement.removeEventListener('touchmove', this.touchmoveEventListener);

  // remove scrollbars elements
  if(scrollbars.dom) {
    this.element.removeChild(scrollbars.v.el);
    this.element.removeChild(scrollbars.h.el);
    scrollbars = null;
  }
  
  // restore style
  scrollElement.removeAttribute('style');
};




OptiScroll.Instance.prototype.animateScroll = function (startX, endX, startY, endY, duration) {
  var self = this,
      scrollElement = this.scrollElement,
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
      scrollElement.scrollTop = (easedTime * (endY - startY)) + startY;
    }
    if( endX !== startX ) {
      scrollElement.scrollLeft = (easedTime * (endX - startX)) + startX;
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

  if (!GS.pauseCheck && !G.isTouch) {
    this.element.classList.add( this.settings.classPrefix+'-scrolling' );
  }
  GS.pauseCheck = true;

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
  var scrollbars = this.scrollbars;
  
  // clear scrollStop timer
  clearTimeout(this.scrollStopTimer);

  // if(scrollbars.dom) { // restore track transition
  //   scrollbars.v.track.style[G.cssTransition] = this.settings.trackTransitions;
  //   scrollbars.h.track.style[G.cssTransition] = this.settings.trackTransitions;
  // }

  if(this.settings.fixTouchPageBounce) {
    _invoke(this.scrollbars, 'update');
    _invoke(this.scrollbars, 'checkEdges');
  }
  this.cache.scrollNow = getTime();
};



Events.touchmove = function (ev) {
  GS.pauseCheck = true; 
};



Events.scrollStop = function () {
  var eventData, cEvent;

  // prevents multiple 
  clearTimeout(this.scrollStopTimer);

  if(!G.isTouch) {
    this.element.classList.remove( this.settings.classPrefix+'-scrolling' );
  }

  // update position and cache
  _invoke(this.scrollbars, 'update');

  // fire custom event
  this.fireCustomEvent('scrollstop');

  // check if edge event needs to be fired
  _invoke(this.scrollbars, 'checkEdges', [true]);

  // restore check loop
  GS.pauseCheck = false;
};




var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      cssTransformDashed = (G.cssTransform == 'transform') ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase(),

      parentElement = instance.element,
      scrollElement = instance.scrollElement,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      clientSize = isVertical ? 'clientHeight' : 'clientWidth',
      scrollSize = isVertical ? 'scrollHeight' : 'scrollWidth',
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      elementSize = isVertical ? 'height' : 'width',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],

      enabled = false,
      scrollbarEl = null,
      trackEl = null,
      dragData = null;

  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(enabled) {
        parentElement.classList.add( which+'track-on' );
      } else {
        parentElement.classList.remove( which+'track-on' );
      }

      if(trackEl && enabled) {
        trackEl.style[G.cssTransition] = settings.trackTransitions;
      }
    },


    create: function () {
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix+'-'+which;
      trackEl.className = settings.classPrefix+'-'+which+'track';
      scrollbarEl.appendChild(trackEl);
      parentElement.appendChild(scrollbarEl);

      if(settings.draggableTracks) {
        this.bind();
      }
    },


    update: function () {
      var trackMin = settings.minTrackSize || 0,
          trackMax = settings.maxTrackSize || 100,
          newDim, newRelPos;

      newDim = this.calc(scrollElement[scrollProp], cache[clientSize], cache[scrollSize], trackMin, trackMax);
      newRelPos = ((1 / newDim.size) * newDim.position * 100);

      if(newDim.size === 1 && enabled) {
        this.toggle(false);
      }

      if(newDim.size < 1 && !enabled) {
        this.toggle(true);
      }

      if(trackEl && enabled) {
        if(scrollbarCache.size !== newDim.size) {
          trackEl.style[elementSize] = newDim.size * 100 + '%';
        }

        if(G.isTouch) {
          this.animateTrack();
        }

        if(isVertical) {
          if(G.cssTransform) {
            trackEl.style[G.cssTransform] = 'translate(0, '+ newRelPos + '%' +')';
          } else { // IE9
            trackEl.style.top = newDim.position * 100 + '%';
          }
        } else {
          if(G.cssTransform) {
            trackEl.style[G.cssTransform] = 'translate('+ newRelPos + '%' +', 0)';
          } else { // IE9
            trackEl.style.left = newDim.position * 100 + '%';
          }
        }

      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);
    },


    animateTrack: function () {
      trackEl.style[G.cssTransition] = settings.trackTransitions+', '+ cssTransformDashed + ' 0.2s linear 0s';
    },


    bind: function () {
      var self = this;

      var dragStart = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev;
        dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollElement[scrollProp] };
      }

      var dragMove = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev,
            delta, deltaRatio;
        if(!dragData) return;

        ev.preventDefault();
        delta = isVertical ? evData.pageY - dragData.y : evData.pageX - dragData.x;
        deltaRatio = delta / cache[clientSize];
        
        scrollElement[scrollProp] = dragData.scroll + deltaRatio * cache[scrollSize];
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


    checkEdges: function (isOnScrollStop) {
      var edge = Utils.detectEdge(scrollbarCache, cache[scrollSize], !isOnScrollStop);

      if(!enabled || edge === false) 
        return;

      scrollbarCache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        instance.fireCustomEvent('scrollreachedge');
        instance.fireCustomEvent('scrollreach'+ evNames[scrollbarCache.lastEdge] );
      }

      if(edge !== -1 && !isOnScrollStop && settings.fixTouchPageBounce) {
        scrollFixPosition = scrollbarCache.lastEdge ? scrollbarCache.position * cache[scrollSize] - 1 : 1;
        instance.scrollTo( isVertical ? false : scrollFixPosition, isVertical ? scrollFixPosition : false , 0, true);
      }
    }


  };

};

var Utils = OptiScroll.Utils = {};



Utils.hideNativeScrollbars = function (scrollElement) {
  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    scrollElement.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      scrollElement.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        scrollElement.style.display = 'block'; 
      });
    } else {
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
    }
    
  } else {
    // force scrollbars and hide them
    scrollElement.style.overflow = 'scroll';
    scrollElement.style.right = -G.nativeScrollbarSize + 'px';
    scrollElement.style.bottom = -G.nativeScrollbarSize + 'px';
  }
};



Utils.detectEdge = function (cache, fullSize, ignoreLast) {
  var toStartEdge, toEndEdge;

  toStartEdge = cache.position * fullSize;
  toEndEdge = fullSize - (cache.position + cache.size) * fullSize;

  // overscroll - ignore
  if((toStartEdge < 0 && cache.lastEdge === 0) || (toEndEdge < 0 && cache.lastEdge === 1)) {
    return false; 
  }
  
  // start edge reached && was not there already
  if(toStartEdge <= 1 && toStartEdge > -1 && (cache.lastEdge !== 0 || ignoreLast) ) {
    return 0;
  }

  // end edge reached && was not there already
  if(toEndEdge <= 1 && toEndEdge > -1 && toStartEdge > 1 && (cache.lastEdge !== 1 || ignoreLast) ) {
    return 1;
  }

  // not next to an edge
  if(!ignoreLast && toStartEdge > 1 && toEndEdge > 1) {
    return -1;
  }

  return false;
}



Utils.exposedData = function (obj) {
  var data = _extend({}, obj);
  // px conversion
  data.scrollTop = obj.v.position * obj.scrollHeight;
  data.scrollBottom = (1 - obj.v.position) * obj.scrollHeight;
  data.scrollLeft = obj.h.position * obj.scrollWidth;
  data.scrollRight = (1 - obj.h.position) * obj.scrollWidth;

  return data;
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

  if(!GS.pauseCheck) { // check size only if not scrolling
    G.instances.forEach(function (instance) {
      instance.checkScrollSize();
    });
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
  instances: [],
  checkTimer: null,
  isTouch: 'ontouchstart' in window,
  cssTransition: cssTest('transition'),
  cssTransform: cssTest('transform'),
  nativeScrollbarSize: getScrollbarWidth()
};




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

// ClassList polyfill by Remy
// https://github.com/remy/polyfills

(function (window, document) {

  if (typeof window.Element === "undefined" || "classList" in document.documentElement) return;

  var prototype = Array.prototype,
      push = prototype.push,
      splice = prototype.splice,
      join = prototype.join;

  function DOMTokenList(el) {
    this.el = el;
    // The className needs to be trimmed and split on whitespace
    // to retrieve a list of classes.
    var classes = el.className.replace(/^\s+|\s+$/g,'').split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      push.call(this, classes[i]);
    }
  };

  DOMTokenList.prototype = {
    add: function(token) {
      if(this.contains(token)) return;
      push.call(this, token);
      this.el.className = this.toString();
    },
    contains: function(token) {
      return this.el.className.indexOf(token) != -1;
    },
    item: function(index) {
      return this[index] || null;
    },
    remove: function(token) {
      if (!this.contains(token)) return;
      for (var i = 0; i < this.length; i++) {
        if (this[i] == token) break;
      }
      splice.call(this, i, 1);
      this.el.className = this.toString();
    },
    toString: function() {
      return join.call(this, ' ');
    },
    toggle: function(token) {
      if (!this.contains(token)) {
        this.add(token);
      } else {
        this.remove(token);
      }

      return this.contains(token);
    }
  };

  window.DOMTokenList = DOMTokenList;

  function defineElementGetter (obj, prop, getter) {
    if (Object.defineProperty) {
      Object.defineProperty(obj, prop, { get : getter });
    } else {
      obj.__defineGetter__(prop, getter);
    }
  }

  defineElementGetter(Element.prototype, 'classList', function () {
    return new DOMTokenList(this);
  });

})(window, document);


// CustomEvent polyfill for IE9
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
if (!window.CustomEvent)
  (function (win, doc) {
    function CustomEvent ( event, params ) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = doc.createEvent( 'CustomEvent' );
      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
      return evt;
     }

    CustomEvent.prototype = win.Event.prototype;

    win.CustomEvent = CustomEvent;
  })(window, document);

if ( !Array.prototype.forEach ) { 
  Array.prototype.forEach = function(fn, scope) { 
    for(var i = 0, len = this.length; i < len; ++i) { fn.call(scope, this[i], i, this); } 
  }; 
}