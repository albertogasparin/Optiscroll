
/**
 * OptiScroll, use this to create instances
 * ```
 * var scrolltime = new OptiScroll(element);
 * ```
 */
var OptiScroll = function OptiScroll(element, options) {
  return new OptiScroll.Instance(element, options || {});
};


  
  

OptiScroll.defaults = {
  fixTouchPageBounce: true,
  trackTransitions: 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s',
  forcedScrollbars: false,
  scrollStopDelay: 200,
  maxTrackSize: 90,
  minTrackSize: 5,
  scrollbarsInteractivity: false,
  classPrefix: 'optiscroll'
};

var GS = OptiScroll.globalSettings = {
  scrollMinUpdateInterval: 1000 / 60, // 60 FPS
  checkFrequency: 1000,
  pauseCheck: false
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

  // add for timed check
  G.instances.push( this );

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




