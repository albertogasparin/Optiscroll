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


