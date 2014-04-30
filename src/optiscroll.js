
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
      createScrollbars = G.nativeScrollbarSize || me.settings.forcedScrollbars;

  if(me.settings.autoUpdate) {
    // add for timed check
    G.instances.push( me );
  }

  me.scrollbars = { 
    v: new Scrollbar('v', me), 
    h: new Scrollbar('h', me) 
  };

  if(createScrollbars) {
    Utils.hideNativeScrollbars(me.scrollEl);
    _invoke(me.scrollbars, 'create');
  } 

  if(G.isTouch && me.settings.fixTouchPageBounce) {
    me.element.classList.add( me.settings.classPrefix+'-touchfix' );
  }

  // calculate scrollbars
  me.update();

  me.bindEvents();

  if(!G.checkTimer) {
    Utils.checkLoop();
  }

};

  

OptiScroll.Instance.prototype.bindEvents = function () {
  var me = this,
      listeners = me.listeners = {},
      scrollEl = me.scrollEl;

  // scroll event binding
  listeners.scroll = function (ev) { Events.scroll.call(me, ev); };

  // overflow events bindings (non standard, moz + webkit)
  // to update scrollbars immediately 
  listeners.overflow = listeners.underflow = listeners.overflowchanged = function (ev) { me.update() };

  if(G.isTouch) {
    listeners.touchstart = function (ev) { Events.touchstart.call(me, ev); };
    listeners.touchend = function (ev) { Events.touchend.call(me, ev); };
  }

  for (ev in listeners) {
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
    if(sH === 0 && cH === 0 && me.element.parentNode === null) {
      me.destroy()
      return false;
    }

    cache.scrollH = sH;
    cache.clientH = cH;
    cache.scrollW = sW;
    cache.clientW = cW;

    if( oldcH !== undefined ) {
      // don't fire on init
      me.fireCustomEvent('sizechange');
    }

    // this will update the scrollbar
    // and check if bottom is reached
    Events.scrollStop.call(me);
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
  rightEdge = startX + eDim.left - sDim.left + eDim.width - sDim.width + (delta.right || 0);
  bottomEdge = startY + eDim.top - sDim.top + eDim.height - sDim.height + (delta.bottom || 0);

  if(leftEdge < startX || rightEdge > startX) {
    endX = (leftEdge < startX) ? leftEdge : rightEdge;
  }

  if(topEdge < startY || bottomEdge > startY) {
    endY = (topEdge < startY) ? topEdge : bottomEdge;
  }

  // if(endX < 0) { endX = 0; }
  // if(endY < 0) { endY = 0; }
  
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
      index = G.instances.indexOf( me ),
      ev;

  // remove instance from global timed check
  if (index > -1) {
    G.instances.splice(index, 1);
  }

  // unbind events
  for (ev in listeners) {
    scrollEl.removeEventListener(ev, listeners[ev]);
  }

  // remove scrollbars elements
  _invoke(me.scrollbars, 'remove');
  
  // restore style
  scrollEl.removeAttribute('style');
};




OptiScroll.Instance.prototype.fireCustomEvent = function (eventName) {
  var eventData = Utils.exposedData(this.cache),
      cEvent = new CustomEvent(eventName, { detail: eventData });
  
  this.element.dispatchEvent(cEvent);
};


