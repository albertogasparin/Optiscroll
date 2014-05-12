/*
 * CustomEvent polyfill for IE9
 * By MDN
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
 * MIT LICENSE
 */

typeof window.CustomEvent === 'function' || (function (window) {

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;

})(window);

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
  scrollMinUpdateInterval: 1000 / 40, // 40 FPS
  checkFrequency: 1000,
  pauseCheck: false
};

OptiScroll.defaults = {
  fixTouchPageBounce: true,
  forceScrollbars: false,
  scrollStopDelay: 300,
  maxTrackSize: 95,
  minTrackSize: 5,
  draggableTracks: true,
  autoUpdate: true,
  classPrefix: 'optiscroll'
};



OptiScroll.Instance = function ( element, options ) {
  var me = this;
  
  me.element = element;
  me.scrollEl = element.children[0];
  
  // instance variables
  me.settings = _extend( _extend({}, OptiScroll.defaults), options || {});
  
  me.cache = {};
  
  me.init();
};



OptiScroll.Instance.prototype.init = function () {
  var me = this,
      settings = me.settings;

  // add instance to global array for timed check
  if(settings.autoUpdate) {
    G.instances.push( me );
  }

  // initialize scrollbars
  me.scrollbars = { 
    v: new Scrollbar('v', me), 
    h: new Scrollbar('h', me) 
  };

  // disable forced scrollbars if Firefox 
  // because we cannot hide native scrollbars yet
  if(G.nativeScrollbarSize === 0 && 'mozRequestAnimationFrame' in window) {
    settings.forceScrollbars = false;
  }

  // create DOM scrollbars only if they have size or if it's forced
  if(G.nativeScrollbarSize || settings.forceScrollbars) {
    Utils.hideNativeScrollbars(me.scrollEl);
    _invoke(me.scrollbars, 'create');
  } 

  if(G.isTouch && settings.fixTouchPageBounce) {
    toggleClass(me.element, settings.classPrefix+'-nobounce', true);
  }

  // calculate scrollbars
  me.update();

  // bind container events
  me.bind();

  // start the timed check if it is not already running
  if(settings.autoUpdate && !G.checkTimer) {
    Utils.checkLoop();
  }

};

  

OptiScroll.Instance.prototype.bind = function () {
  var me = this,
      listeners = me.listeners = {},
      scrollEl = me.scrollEl;

  // scroll event binding
  listeners.scroll = function (ev) { Events.scroll(ev, me); };

  // overflow events bindings (non standard, moz + webkit)
  // to update scrollbars immediately 
  listeners.overflow = listeners.underflow = listeners.overflowchanged = function (ev) { me.update(); };

  if(G.isTouch) {
    listeners.touchstart = function (ev) { Events.touchstart(ev, me); };
    listeners.touchend = function (ev) { Events.touchend(ev, me); };
  }

  for (var ev in listeners) {
    scrollEl.addEventListener(ev, listeners[ev]);
  }

};




OptiScroll.Instance.prototype.update = function () {
  var me = this,
      oldcH = me.cache.clientH,
      scrollEl = me.scrollEl,
      cache = me.cache,
      sH = scrollEl.scrollHeight,
      cH = scrollEl.clientHeight,
      sW = scrollEl.scrollWidth,
      cW = scrollEl.clientWidth;
  
  if( sH !== cache.scrollH || cH !== cache.clientH || 
    sW !== cache.scrollW || cW !== cache.clientW ) {
    
    // if the element is no more in the DOM
    if(sH === 0 && cH === 0 && !document.body.contains(me.element)) {
      me.destroy();
      return false;
    }

    cache.scrollH = sH;
    cache.clientH = cH;
    cache.scrollW = sW;
    cache.clientW = cW;

    // only fire if cache was defined
    if( oldcH !== undefined ) {
      me.fireCustomEvent('sizechange');
    }

    // this will update the scrollbar
    // and check if bottom is reached
    _invoke(me.scrollbars, 'update');
  }
};




/**
 * Animate scrollTo
 * ```
 * $(el).optiScroll('scrollTo', 'left', 100, 200) // scrolls x,y in 200ms
 * ```
 */
OptiScroll.Instance.prototype.scrollTo = function (destX, destY, duration, disableEvents) {
  var me = this,
      cache = me.cache,
      startX, startY, endX, endY;

  G.pauseCheck = true;
  // force update
  me.update();

  startX = endX = me.scrollEl.scrollLeft;
  startY = endY = me.scrollEl.scrollTop;
  
  if (typeof destX === 'string') { // left or right
    endX = (destX === 'left') ? 0 : cache.scrollW - cache.clientW;
  } else if (typeof destX === 'number') {
    endX = destX;
  }

  if (typeof destY === 'string') { // top or bottom
    endY = (destY === 'top') ? 0 : cache.scrollH - cache.clientH;
  } else if (typeof destY === 'number') {
    endY = destY;
  }

  me.disableScrollEv = disableEvents;

  // animate
  me.animateScroll(startX, endX, startY, endY, duration);
  
};


OptiScroll.Instance.prototype.scrollIntoView = function (elem, duration, delta) {
  var me = this,
      scrollEl = me.scrollEl,
      eDim, sDim,
      leftEdge, topEdge, rightEdge, bottomEdge,
      startX, startY, endX, endY;

  G.pauseCheck = true;
  // force update
  me.update();

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
  rightEdge = startX + eDim.left - sDim.left + eDim.width - me.cache.clientW + (delta.right || 0);
  bottomEdge = startY + eDim.top - sDim.top + eDim.height - me.cache.clientH + (delta.bottom || 0);
  
  if(leftEdge < startX || rightEdge > startX) {
    endX = (leftEdge < startX) ? leftEdge : rightEdge;
  }

  if(topEdge < startY || bottomEdge > startY) {
    endY = (topEdge < startY) ? topEdge : bottomEdge;
  }
  
  // animate
  me.animateScroll(startX, endX, startY, endY, duration);
};




OptiScroll.Instance.prototype.animateScroll = function (startX, endX, startY, endY, duration) {
  var me = this,
      scrollEl = me.scrollEl,
      startTime = getTime();

  if(endX === startX && endY === startY) {
    return;
  }

  if(duration === 0) {
    scrollEl.scrollLeft = endX;
    scrollEl.scrollTop = endY;
    animationTimeout( function () { me.disableScrollEv = false; }); // restore
    return;
  }

  if(typeof duration !== 'number') { // undefined or auto
    // 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms
    duration = Math.pow( Math.max( Math.abs(endX - startX), Math.abs(endY - startY) ), 0.62) * 15;
  }

  var scrollAnimation = function () {
    var time = Math.min(1, ((getTime() - startTime) / duration)),
        easedTime = Utils.easingFunction(time);
    
    if( endY !== startY ) {
      scrollEl.scrollTop = (easedTime * (endY - startY)) + startY;
    }
    if( endX !== startX ) {
      scrollEl.scrollLeft = (easedTime * (endX - startX)) + startX;
    }

    if(time < 1) {
      animationTimeout(scrollAnimation);
    } else {
      me.disableScrollEv = false;
      // now the internal scroll event will fire
    }
  };
  
  animationTimeout(scrollAnimation);
};




OptiScroll.Instance.prototype.destroy = function () {
  var me = this,
      scrollEl = me.scrollEl,
      listeners = me.listeners,
      index = G.instances.indexOf( me );

  // unbind events
  for (var ev in listeners) {
    scrollEl.removeEventListener(ev, listeners[ev]);
  }

  // remove scrollbars elements
  _invoke(me.scrollbars, 'remove');
  
  // restore style
  scrollEl.removeAttribute('style');
  scrollEl.removeAttribute('data-scroll');

  // remove classes
  toggleClass(me.element, me.settings.classPrefix+'-nobounce', false);
  
  // defer instance removal from global array
  // to not affect checkLoop _invoke
  if (index > -1) {
    animationTimeout(function () {
      G.instances.splice(index, 1);
    });
  }
};




OptiScroll.Instance.prototype.fireCustomEvent = function (eventName) {
  var eventData = Utils.exposedData(this.cache),
      cEvent = new CustomEvent(eventName, { detail: eventData });
  
  this.element.dispatchEvent(cEvent);
};




var Events = {

  scrollTimer: null,
  stopTimer: null,

  scroll: function (ev, me) {
    var cache = me.cache,
        now = getTime(),
        waitBeforeUpdate = 'matchMedia' in window ? GS.scrollMinUpdateInterval : 0; // IE9 fix
    
    if(me.disableScrollEv) { return; }

    if (!G.pauseCheck) {
      me.fireCustomEvent('scrollstart');
    }
    G.pauseCheck = true;
    
    if( !cache.now || now > cache.now + GS.scrollMinUpdateInterval ) {
      cache.now = now;
      
      clearTimeout(cache.timerScroll);
      cache.timerScroll = setTimeout(function () {
        _invoke(me.scrollbars, 'update');
      }, waitBeforeUpdate);

      clearTimeout(cache.timerStop);
      cache.timerStop = setTimeout(function () {
        Events.scrollStop(me);
      }, me.settings.scrollStopDelay);
    }
  },


  touchstart: function (ev, me) {
    G.pauseCheck = false;
    if(me.settings.fixTouchPageBounce) {
      _invoke(me.scrollbars, 'update', [true]);
    }
  },


  touchend: function (ev, me) {
    // prevents touchmove generate scroll event to call
    // scrollstop  while the page is still momentum scrolling
    clearTimeout(me.cache.timerStop);
  },


  scrollStop: function (me) {
    // update position, cache and detect edge
    // _invoke(me.scrollbars, 'update');

    // fire custom event
    me.fireCustomEvent('scrollstop');

    // restore check loop
    G.pauseCheck = false;
  }


};


var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      parentEl = instance.element,
      scrollEl = instance.scrollEl,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      sizeProp = isVertical ? 'H' : 'W',
      clientSize = 'client'+sizeProp,
      scrollSize = 'scroll'+sizeProp,
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],
      trackTransition = 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s',

      enabled = false,
      scrollbarEl = null,
      trackEl = null,
      dragData = null,
      animated = false;

  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(trackEl) {
        toggleClass(parentEl, which+'track-on', enabled);

        if(enabled) {
          trackEl.style[G.cssTransition] = trackTransition;
        }
      }

      // expose enabled
      scrollbarCache.enabled = enabled;
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
      var me = this,
          trackMin = settings.minTrackSize || 0,
          trackMax = settings.maxTrackSize || 100,
          newDim, newRelPos, deltaPos;

      newDim = this.calc(scrollEl[scrollProp], cache[clientSize], cache[scrollSize], trackMin, trackMax);
      newRelPos = ((1 / newDim.size) * newDim.position * 100);
      deltaPos = Math.abs(newDim.position - scrollbarCache.position || 0) * cache[clientSize];

      if(newDim.size === 1 && enabled) {
        me.toggle(false);
      }

      if(newDim.size < 1 && !enabled) {
        me.toggle(true);
      }

      if(trackEl && enabled) {
        if(scrollbarCache.size !== newDim.size) {
          trackEl.style[ isVertical ? 'height':'width' ] = newDim.size * 100 + '%';
        }

        if(deltaPos) { // only if position has changed
          me.animateTrack( G.isTouch && deltaPos > 20 );
          trackEl.style[G.cssTransform] = 'translate(' + (isVertical ?  '0%,'+newRelPos+'%' : newRelPos+'%'+',0%') +')';
        }
      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);

      me.checkEdges(isOnTouch);
    },


    animateTrack: function (animatePos) {
      if(animatePos || animated) {
        trackEl.style[G.cssTransition] = trackTransition + (animatePos ? ', '+ G.cssTransformDashed + ' 0.2s linear 0s' : '');
      }
      animated = animatePos;
    },


    bind: function () {
      var on = 'addEventListener';

      var dragStart = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev;
        dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollEl[scrollProp] };
      }

      var dragMove = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev,
            delta, deltaRatio;
        
        if(!dragData) { return; }

        ev.preventDefault();
        delta = isVertical ? evData.pageY - dragData.y : evData.pageX - dragData.x;
        deltaRatio = delta / cache[clientSize];
        
        scrollEl[scrollProp] = dragData.scroll + deltaRatio * cache[scrollSize];
      }

      var dragEnd = function (ev) {
        dragData = null;
      }

      trackEl[on]('mousedown', dragStart);
      trackEl[on]('touchstart', dragStart);

      scrollbarEl[on]('mousemove', dragMove);
      scrollbarEl[on]('touchmove', dragMove);

      scrollbarEl[on]('mouseup', dragEnd);
      scrollbarEl[on]('touchend', dragEnd);
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

      if(!enabled) { return; }

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
      this.toggle(false);
      if(scrollbarEl && scrollbarEl.parentNode) {
        scrollbarEl.parentNode.removeChild(scrollbarEl);
      }
    }


  };

};

var Utils = {

  hideNativeScrollbars: function (scrollEl) {
    if( G.nativeScrollbarSize === 0 ) {
      // hide Webkit/touch scrollbars
      var time = getTime();
      scrollEl.setAttribute('data-scroll', time);
      
      // force scrollbars update on Webkit
      scrollEl.style.display = 'none';
      
      if( G.isTouch ) {
        Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');
      } else {
        Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
      }

      animationTimeout(function () { 
        scrollEl.style.display = 'block'; 
      });
      
    } else {
      // force scrollbars and hide them
      scrollEl.style.overflow = 'scroll';
      scrollEl.style.right = -G.nativeScrollbarSize + 'px';
      scrollEl.style.bottom = -G.nativeScrollbarSize + 'px';
    }
  },


  exposedData: function (obj) {
    var sH = obj.scrollH, sW = obj.scrollW;
    return {
      // scrollbars data
      scrollbarV: _extend({}, obj.v),
      scrollbarH: _extend({}, obj.h),

      // scroll position
      scrollTop: obj.v.position * sH,
      scrollLeft: obj.h.position * sW,
      scrollBottom: (1 - obj.v.position - obj.v.size) * sH,
      scrollRight: (1 - obj.h.position - obj.h.size) * sW,

      // element size
      scrollWidth: sW,
      scrollHeight: sH,
      clientWidth: obj.clientW,
      clientHeight: obj.clientH
    }
  },


  addCssRule: function (selector, rules) {
    var styleSheet = document.getElementById('scroll-sheet');

    if ( !styleSheet ) {
      styleSheet = document.createElement("style");
      styleSheet.id = 'scroll-sheet';
      document.head.appendChild(styleSheet);
    } 
    // do not use sheet.insertRule because FF throws an error
    // if the selector is not supported
    styleSheet.innerHTML += selector + "{" + rules + "} ";
  },


  // Global height checker
  // looped to listen element changes
  checkLoop: function () {
    
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
  },


  // easeOutCubic function
  easingFunction: function (t) { 
    return (--t) * t * t + 1; 
  }


};


// Global variables
var G = OptiScroll.G = {
  isTouch: 'ontouchstart' in window,
  cssTransition: cssTest('transition'),
  cssTransform: cssTest('transform'),
  nativeScrollbarSize: getScrollbarWidth(),

  instances: [],
  checkTimer: null,
  pauseCheck: false
};

G.cssTransformDashed = (G.cssTransform === 'transform') ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase();



var getTime = Date.now || function() { return new Date().getTime(); };


var animationTimeout = (function () {
  return window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.msRequestAnimationFrame || 
    function(callback){ window.setTimeout(callback, 1000/60); };
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
    if ( el.style[ props[i] ] !== undefined ) { return props[i]; }
  }
  return false;
}



function toggleClass (el, value, bool) {
  var classes = el.className.split(/\s+/),
      index = classes.indexOf(value);
  
  if(bool) {
    ~index || classes.push(value);
  } else {
    ~index && classes.splice(index, 1);
  }

  el.className = classes.join(" ");
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
  var i, j;
  if(collection.length) {
    for(i = 0, j = collection.length; i < j; i++) {
      collection[i][fn].apply(collection[i], args);
    }
  } else {
    for (i in collection) {
      collection[i][fn].apply(collection[i], args);
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

/**
 * jQuery plugin
 * create instance of OptiScroll
 * and when called again you can call functions
 * or change instance settings
 *
 * ~~~
 * $(el).optiScroll({ option })
 * $(el).optiScroll('method', arg) 
 * $(el).optiScroll({ newOptions }) 
 * ~~~
 */

(function ($) {
  
  $.fn.optiScroll = function(options) {
    var method, args;
    
    if( typeof options === 'string' ) {
      args = Array.prototype.slice.call(arguments);
      method = args.shift();
    }

    return this.each(function() {
      var el = $(this);
      var inst = el.data('optiScroll');

      // start new optiscroll instance
      if(!inst) {
        inst = new window.OptiScroll(this, options || {});
        el.data('optiScroll', inst);
      }
      // allow exec method on instance 
      else if( inst && typeof method === 'string' ) {
        if( inst[method] )
          inst[method].apply(inst, args);
      }
      // change the options
      else if(inst && options) {
        $.extend(inst.settings, options);
      }
    });
  };

})( jQuery || Zepto );