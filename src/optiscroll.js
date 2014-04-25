
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


