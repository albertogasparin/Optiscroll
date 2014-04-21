
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
      Helpers.fireCustomEvent.call(this, 'sizechange');
    }

    // this will update the scrollbar
    // and check if bottom is reached
    Events.scrollStop.call(this);
  }
};



OptiScroll.Instance.prototype.updateScrollbars = function () {
  var scrollElement = this.scrollElement,
      cache = this.cache,
      scrollbars = this.scrollbars,
      sTop = scrollElement.scrollTop,
      sLeft = scrollElement.scrollLeft,
      trackMin = this.settings.minTrackSize || 0,
      trackMax = this.settings.maxTrackSize || 100,
      newVDim, newHDim;

  newVDim = Utils.calculateScrollbarDimentions(sTop, cache.clientHeight, cache.scrollHeight, trackMin, trackMax);
  newHDim = Utils.calculateScrollbarDimentions(sLeft, cache.clientWidth, cache.scrollWidth, trackMin, trackMax);

  if(newVDim.size === 1 && scrollbars.v.enabled) {
    Helpers.disableScrollbar.call(this, 'v');
  }

  if(newVDim.size < 1 && !scrollbars.v.enabled) {
    Helpers.enableScrollbar.call(this, 'v');
  }

  if(newHDim.size === 1 && scrollbars.h.enabled) {
    Helpers.disableScrollbar.call(this, 'h');
  }

  if(newHDim.size < 1 && !scrollbars.h.enabled) {
    Helpers.enableScrollbar.call(this, 'h');
  }

  if( scrollbars.dom ) {

    if( cache.v.size !== newVDim.size ) {
      scrollbars.v.track.style.height = newVDim.size * 100 + '%';
    }

    if( cache.h.size !== newHDim.size ) {
      scrollbars.h.track.style.width = newHDim.size * 100 + '%';
    }

    if(G.cssTransform) {

      if(G.isTouch) {
        Helpers.animateTracks.call(this);
      }

      scrollbars.v.track.style[G.cssTransform] = 'translate(0, '+ ((1 / newVDim.size) * newVDim.position * 100) + '%' +')';
      scrollbars.h.track.style[G.cssTransform] = 'translate('+ ((1 / newHDim.size) * newHDim.position * 100) + '%' +', 0)';
    } else { // IE9
      scrollbars.v.track.style.top = newVDim.position * 100 + '%';
      scrollbars.v.track.style.left = newHDim.position * 100 + '%';
    }
  }

  // update cache values
  cache.v = Utils.extendObj(cache.v, newVDim);
  cache.h = Utils.extendObj(cache.h, newHDim);
};


var Scrollbar = function (which, instance) {

  var parentElement = instance.element,
      scrollElement = instance.scrollElement,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which],

      clientSize = (which == 'v') ? 'clientHeight' : 'clientWidth',
      scrollSize = (which == 'v') ? 'scrollHeight' : 'scrollWidth',
      scrollProp = (which == 'v') ? 'scrollTop' : 'scrollLeft',
      elementSize = (which == 'v') ? 'height' : 'width',

      enabled = false,
      scrollbarEl = null,
      trackEl = null;

  
  return {

    toggle: function toggleStatus (bool) {
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

    create: function createElements () {
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix+'-'+which;
      trackEl.className = settings.classPrefix+'-'+which+'track';
      scrollbarEl.appendChild(trackEl);
      parentElement.appendChild(scrollbarEl);
    },

    update: function update () {
      var edgeDist = scrollElement[scrollProp],
          trackMin = settings.minTrackSize || 0,
          trackMax = settings.maxTrackSize || 100,
          newDim, newRelPos;

      newDim = Utils.calculateScrollbarDimentions(edgeDist, cache[clientSize], cache[scrollSize], trackMin, trackMax);
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

        if(which == 'v') {
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
      scrollbarCache = Utils.extendObj(scrollbarCache, newDim);
    },


    animateTrack: function animateTrack () {
      var dashedProp = G.cssTransform == 'transform' ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase();
      trackElement.style[G.cssTransition] = settings.trackTransitions+', '+ dashedProp + ' 0.2s linear 0s';
    }

  };

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
      Helpers.animateScroll.call(this, startX, endX, startY, endY, duration || 'auto');
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
        Helpers.animateScroll.call(this, startX, endX, startY, endY, duration || 'auto');
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




