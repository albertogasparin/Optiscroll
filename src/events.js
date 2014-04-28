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


