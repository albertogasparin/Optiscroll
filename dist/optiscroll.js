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
  scrollbarsInteractivity: true,
  autoUpdate: true,
  classPrefix: 'optiscroll',
  trackTransitions: 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s'
};



OptiScroll.Instance = function ( element, options ) {
  this.element = element;
  this.scrollElement = element.children[0];
  
  // instance variables
  this.settings = Utils.extendObj( Utils.extendObj({}, OptiScroll.defaults), options || {});
  
  this.cache = { v: {}, h: {}  };
  this.scrollbars = { v: {}, h: {} };

  this.init();
};



OptiScroll.Instance.prototype.init = function () {
  var self = this,
      createScrollbars = G.nativeScrollbarSize || this.settings.forcedScrollbars;

  if(this.settings.autoUpdate) {
    // add for timed check
    G.instances.push( this );
  }

  if(createScrollbars) {
    Helpers.hideNativeScrollbars.call(this);
    Helpers.createScrollbarElements.call(this);
  } 

  if(G.isTouch && this.settings.fixTouchPageBounce) {
    this.element.classList.add( this.settings.classPrefix+'-touchfix' );
  }

  // calculate scrollbars
  this.checkScrollSize();

  this.bindEvents();

  if(!G.checkTimer) {
    Helpers.checkLoop();
  }

};

  

OptiScroll.Instance.prototype.bindEvents = function () {
  var self = this;

  // scroll event binding
  this.scrollEventListener = function (ev) { Events.scroll.call(self, ev); };
  this.scrollElement.addEventListener('scroll', this.scrollEventListener);

  // overflow events bindings (non standard)
  // to update scrollbars immediately 
  this.overflowEventListener = function (ev) { self.checkScrollSize() };
  this.scrollElement.addEventListener('overflow', this.overflowEventListener); // Moz
  this.scrollElement.addEventListener('underflow', this.overflowEventListener); // Moz
  this.scrollElement.addEventListener('overflowchanged', this.overflowEventListener); // Webkit

  if(G.isTouch) {

    this.touchstartEventListener = function (ev) { Events.touchstart.call(self, ev); };
    this.scrollElement.addEventListener('touchstart', this.touchstartEventListener);

    this.touchmoveEventListener = function (ev) { Events.touchmove.call(self, ev); };
    this.scrollElement.addEventListener('touchmove', this.touchmoveEventListener);
  }

};




OptiScroll.Instance.prototype.checkScrollSize = function () {
  var oldcH = this.cache.clientHeight,
      sH = this.scrollElement.scrollHeight,
      cH = this.scrollElement.clientHeight,
      sW = this.scrollElement.scrollWidth,
      cW = this.scrollElement.clientWidth;
  
  if( sH !== this.cache.scrollHeight || cH !== this.cache.clientHeight || 
    sW !== this.cache.scrollWidth || cW !== this.cache.clientWidth ) {
    
    // if the element is no more in the DOM
    if(sH === 0 && cH === 0 && this.element.parentNode === null) {
      this.destroy()
      return false;
    }

    this.cache.scrollHeight = sH;
    this.cache.clientHeight = cH;
    this.cache.scrollWidth = sW;
    this.cache.clientWidth = cW;

    if( oldcH !== undefined ) {
      // don't fire on init
      Helpers.fireCustomEvent.call(this, 'sizechange');
    }

    // this will update the scrollbar
    // and check if bottom is reached
    Events.scrollStop.call(this);
  }
};



OptiScroll.Instance.prototype.updateScrollbars = function () {
  var sTop = this.scrollElement.scrollTop,
      sLeft = this.scrollElement.scrollLeft,
      trackMin = this.settings.minTrackSize || 0,
      trackMax = this.settings.maxTrackSize || 100,
      newVDim, newHDim;

  newVDim = Utils.calculateScrollbarDimentions(sTop, this.cache.clientHeight, this.cache.scrollHeight, trackMin, trackMax);
  newHDim = Utils.calculateScrollbarDimentions(sLeft, this.cache.clientWidth, this.cache.scrollWidth, trackMin, trackMax);

  if(newVDim.size === 1 && this.scrollbars.v.enabled) {
    Helpers.disableScrollbar.call(this, 'v');
  }

  if(newVDim.size < 1 && !this.scrollbars.v.enabled) {
    Helpers.enableScrollbar.call(this, 'v');
  }

  if(newHDim.size === 1 && this.scrollbars.h.enabled) {
    Helpers.disableScrollbar.call(this, 'h');
  }

  if(newHDim.size < 1 && !this.scrollbars.h.enabled) {
    Helpers.enableScrollbar.call(this, 'h');
  }

  if( this.scrollbars.dom ) {

    if( this.cache.v.size !== newVDim.size ) {
      this.scrollbars.v.track.style.height = newVDim.size * 100 + '%';
    }

    if( this.cache.h.size !== newHDim.size ) {
      this.scrollbars.h.track.style.width = newHDim.size * 100 + '%';
    }

    if(G.cssTransform) {

      if(G.isTouch) {
        Helpers.animateTracks.call(this);
      }

      this.scrollbars.v.track.style[G.cssTransform] = 'translate(0, '+ ((1 / newVDim.size) * newVDim.position * 100) + '%' +')';
      this.scrollbars.h.track.style[G.cssTransform] = 'translate('+ ((1 / newHDim.size) * newHDim.position * 100) + '%' +', 0)';
    } else { // IE9
      this.scrollbars.v.track.style.top = newVDim.position * 100 + '%';
      this.scrollbars.v.track.style.left = newHDim.position * 100 + '%';
    }
  }

  // update cache values
  this.cache.v = Utils.extendObj(this.cache.v, newVDim);
  this.cache.h = Utils.extendObj(this.cache.h, newHDim);
};

  


  /**
   * Animate scrollTo
   * ~~~
   * $(el).optiScroll('scrollTo', 'left', 100, 200) // scrolls x,y in 200ms
   * ~~~
   */
  OptiScroll.Instance.prototype.scrollTo = function (destX, destY, duration, disableEvents) {
    var self = this,
        startTime, startX, startY, endX, endY;

    GS.pauseCheck = true;
    // force update
    this.checkScrollSize();

    startX = endX = this.scrollElement.scrollLeft;
    startY = endY = this.scrollElement.scrollTop;
    
    if (typeof destX === 'string') { // left or right
      endX = (destX === 'left') ? 0 : this.cache.scrollWidth - this.cache.clientWidth;
    } else if (typeof destX === 'number') {
      endX = destX;
    }

    if (typeof destY === 'string') { // top or bottom
      endY = (destY === 'top') ? 0 : this.cache.scrollHeight - this.cache.clientHeight;
    } else if (typeof destY === 'number') {
      endY = destY;
    }

    this.disableScrollEvent = disableEvents;

    if(duration === 0) {
      this.scrollElement.scrollLeft = endX;
      this.scrollElement.scrollTop = endY;
      animationTimeout( function () { self.disableScrollEvent = false; }); // restore
    } else {
      Helpers.animateScroll.call(this, startX, endX, startY, endY, duration || 'auto');
    }
    
  };


  OptiScroll.Instance.prototype.scrollIntoView = function (elem, duration, delta) {
    var eDim, sDim,
        leftEdge, topEdge, rightEdge, bottomEdge,
        startTime, startX, startY, endX, endY;

    GS.pauseCheck = true;
    // force update
    this.checkScrollSize();

    if(typeof elem === 'string') { // selector
      elem = this.scrollElement.querySelector(elem);
    }

    if(elem.length && elem.jquery) { // jquery element
      elem = elem[0];
    }

    if(typeof delta === 'number') { // same delta for all
      delta = { top:delta, right:delta, bottom:delta, left:delta };
    }

    delta = delta || {};
    eDim = elem.getBoundingClientRect();
    sDim = this.scrollElement.getBoundingClientRect();

    startX = endX = this.scrollElement.scrollLeft;
    startY = endY = this.scrollElement.scrollTop;
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
        this.scrollElement.scrollLeft = endX;
        this.scrollElement.scrollTop = endY;
      } else {
        Helpers.animateScroll.call(this, startX, endX, startY, endY, duration || 'auto');
      }
    }
  };


  



  OptiScroll.Instance.prototype.destroy = function () {
    // remove instance from global timed check
    var index = G.instances.indexOf( this );
    if (index > -1) {
      G.instances.splice(index, 1);
    }

    // unbind events
    this.scrollElement.removeEventListener('scroll', this.scrollEventListener);
    this.scrollElement.removeEventListener('overflow', this.overflowEventListener);
    this.scrollElement.removeEventListener('underflow', this.overflowEventListener);
    this.scrollElement.removeEventListener('overflowchanged', this.overflowEventListener);

    this.scrollElement.removeEventListener('touchstart', this.touchstartEventListener);
    this.scrollElement.removeEventListener('touchmove', this.touchmoveEventListener);

    // remove scrollbars elements
    if(this.scrollbars.dom) {
      this.element.removeChild(this.scrollbars.v.el);
      this.element.removeChild(this.scrollbars.h.el);
      this.scrollbars = null;
    }
    
    // restore style
    this.scrollElement.removeAttribute('style');
  };


  
  



  


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






var Helpers = OptiScroll.Helpers = {};


Helpers.createScrollbarElements = function () {
  var vScrollbar = this.scrollbars.v.el = document.createElement('div'),
      vTrack = this.scrollbars.v.track = document.createElement('b'),
      hScrollbar = this.scrollbars.h.el = document.createElement('div'),
      hTrack = this.scrollbars.h.track = document.createElement('b');

  vScrollbar.className = this.settings.classPrefix+'-v';
  vTrack.className = this.settings.classPrefix+'-vtrack';
  vScrollbar.appendChild(vTrack);
  this.element.appendChild(vScrollbar);

  hScrollbar.className = this.settings.classPrefix+'-h';
  hTrack.className = this.settings.classPrefix+'-htrack';
  hScrollbar.appendChild(hTrack);
  this.element.appendChild(hScrollbar);

  this.scrollbars.dom = true;
};



Helpers.hideNativeScrollbars = function () {
  var self = this;

  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    this.scrollElement.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      this.scrollElement.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        self.scrollElement.style.display = 'block'; 
      });
    } else {
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
    }
    
  } else {
    // force scrollbars and hide them
    this.scrollElement.style.overflow = 'scroll';
    this.scrollElement.style.right = -G.nativeScrollbarSize + 'px';
    this.scrollElement.style.bottom = -G.nativeScrollbarSize + 'px';
  }
};



Helpers.checkEdges = function (isOnScrollStop) {
  var cache, edge, scrollFixPosition;
  
  // vertical (top - bottom) edges
  if(this.scrollbars.v.enabled) {
    cache = this.cache.v;
    edge = Utils.detectEdge(cache, this.cache.scrollHeight, !isOnScrollStop);

    if(edge !== false) {
      cache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        Helpers.fireCustomEvent.call(this, 'scrollreachedge');
        Helpers.fireCustomEvent.call(this, 'scrollreach'+ (cache.lastEdge ? 'bottom':'top'));
      }

      if(edge !== -1 && !isOnScrollStop && this.settings.fixTouchPageBounce) {
        scrollFixPosition = cache.lastEdge ? cache.position * this.cache.scrollHeight - 1 : 1;
        this.scrollTo(false, scrollFixPosition, 0, true);
      }
    }
  }

  // horizontal (left - right) edges
  if(this.scrollbars.h.enabled) {
    cache = this.cache.h;
    edge = Utils.detectEdge(cache, this.cache.scrollWidth, !isOnScrollStop);

    if(edge !== false) {
      cache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        Helpers.fireCustomEvent.call(this, 'scrollreachedge');
        Helpers.fireCustomEvent.call(this, 'scrollreach'+ (cache.lastEdge ? 'right':'left'));
      }

      if(edge !== -1 && !isOnScrollStop && this.settings.fixTouchPageBounce) {
        scrollFixPosition = cache.lastEdge ? cache.position * this.cache.scrollWidth - 1 : 1;
        this.scrollTo(scrollFixPosition, false, 0, true);
      }
    }
  }
  
};



Helpers.animateScroll = function (startX, endX, startY, endY, duration) {
  var self = this,
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
      self.scrollElement.scrollTop = (easedTime * (endY - startY)) + startY;
    }
    if( endX !== startX ) {
      self.scrollElement.scrollLeft = (easedTime * (endX - startX)) + startX;
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



Helpers.fireCustomEvent = function (eventName) {
  var eventData = Utils.exposedData(this.cache),
      cEvent = new CustomEvent(eventName, { detail: eventData });
  
  this.element.dispatchEvent(cEvent);
};




Helpers.enableScrollbar = function (which) {
  var sb = this.scrollbars[which];
  sb.enabled = true;
  if(this.scrollbars.dom)
    sb.track.style[G.cssTransition] = this.settings.trackTransitions;
  this.element.classList.add( which+'track-on' );
};



Helpers.disableScrollbar = function (which) {
  var sb = this.scrollbars[which];
  sb.enabled = false;
  this.element.classList.remove( which+'track-on' );
};



Helpers.animateTracks = function () {
  var dashedProp = G.cssTransform == 'transform' ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase();
  
  this.scrollbars.v.track.style[G.cssTransition] = this.settings.trackTransitions+', '+ dashedProp + ' 0.2s linear 0s';
  this.scrollbars.h.track.style[G.cssTransition] = this.settings.trackTransitions+', '+ dashedProp + ' 0.2s linear 0s';
};





// Global height checker
// looped to listen element changes
Helpers.checkLoop = function () {
  
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
      Helpers.checkLoop();
    }, GS.checkFrequency);
  }
};






var Events = OptiScroll.Events = {};


Events.scroll = function (ev) {
  var self = this,
      now = getTime();

  if(this.disableScrollEvent) return;

  if (!GS.pauseCheck && !G.isTouch) {
    this.element.classList.add( this.settings.classPrefix+'-scrolling' );
  }
  GS.pauseCheck = true;

  if( !GS.scrollMinUpdateInterval || now - (this.cache.scrollNow || 0) >= GS.scrollMinUpdateInterval ) {

    if(this.scrollbars.dom) {
      self.updateScrollbars();
    }

    this.cache.scrollNow = now;
    
    clearTimeout(this.scrollStopTimer);
    this.scrollStopTimer = setTimeout(function () {
      Events.scrollStop.call(self);
    }, this.settings.scrollStopDelay);
  }

};



Events.touchstart = function (ev) {
  // clear scrollStop timer
  clearTimeout(this.scrollStopTimer);

  if(this.scrollbars.dom) { // restore track transition
    this.scrollbars.v.track.style[G.cssTransition] = this.settings.trackTransitions;
    this.scrollbars.h.track.style[G.cssTransition] = this.settings.trackTransitions;
  }
  
  if(this.settings.fixTouchPageBounce) {
    this.updateScrollbars();
    Helpers.checkEdges.call(this);
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
  this.updateScrollbars();

  // fire custom event
  Helpers.fireCustomEvent.call(this, 'scrollstop');

  Helpers.checkEdges.call(this, true);

  // restore check loop
  GS.pauseCheck = false;
};




var Utils = OptiScroll.Utils = {};




// Detect css3 support, thanks Modernizr
Utils.cssTest = function (prop) {
  var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
      el = document.createElement( 'test' ),
      props   = (prop + ' ' + ['Webkit','Moz','O','ms'].join(ucProp + ' ') + ucProp).split(' ');

  for ( var i in props ) {
    if ( el.style[ props[i] ] !== undefined ) return props[i];
  }
  return false;
}

  



// Get scrollbars width, thanks Google Closure Library
Utils.getScrollbarWidth = function () {
  var outerEl = document.createElement('div');
  outerEl.style.cssText = 'overflow:auto;width:50px;height:50px;' + 'position:absolute;left:-100px';

  var innerEl = document.createElement('div');
  innerEl.style.cssText = 'width:100px;height:100px';

  outerEl.appendChild(innerEl);
  document.documentElement.appendChild(outerEl);
  var width = outerEl.offsetWidth - outerEl.clientWidth;
  document.documentElement.removeChild(outerEl);
  return width;
}



Utils.calculateScrollbarDimentions = function (position, viewSize, scrollSize, min, max) {
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
    // sizeRatio += positionRatio;
    positionRatio = 0;
  }

  if(percent > 100) { // overscroll
    // sizeRatio += 1 - (positionRatio + sizeRatio); // Do not alter height because transition timings
    positionRatio = 1 - sizeRatio;
  }
  
  return { position: positionRatio, size: sizeRatio, percent: percent };
}



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
  var data = Utils.extendObj({}, obj);
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

  

Utils.extendObj = function (dest, src, merge) {
  for(var key in src) {
    if(!src.hasOwnProperty(key) || dest[key] !== undefined && merge) {
      continue;
    }
    dest[key] = src[key];
  }
  return dest;
}



// easeOutCubic function
Utils.easingFunction = function (t) { 
  return (--t) * t * t + 1; 
}




var getTime = Date.now || function() { return new Date().getTime(); };


var animationTimeout = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback){ window.setTimeout(callback, 1000/60); };



// Global variables

var G = {
  instances: [],
  checkTimer: null,
  isTouch: 'ontouchstart' in window,
  cssTransition: Utils.cssTest('transition'),
  cssTransform: Utils.cssTest('transform'),
  nativeScrollbarSize: Utils.getScrollbarWidth()
};

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