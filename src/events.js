var Events = OptiScroll.Events = {};


Events.scroll = function (ev) {
  var self = this,
      cache = this.cache,
      now = getTime();
  
  if(this.disableScrollEv) return;

  if (!G.pauseCheck) {
    this.fireCustomEvent('scrollstart');
  }
  G.pauseCheck = true;

  if( now - (cache.now || 0) >= GS.scrollMinUpdateInterval ) {

    _invoke(this.scrollbars, 'update');

    cache.now = now;
    
    clearTimeout(this.sTimer);
    this.sTimer = setTimeout(function () {
      Events.scrollStop.call(self);
    }, this.settings.scrollStopDelay);
  }

};



Events.touchstart = function (ev) {
  G.pauseCheck = false;
  if(this.settings.fixTouchPageBounce) {
    _invoke(this.scrollbars, 'update', [true]);
  }
  this.cache.now = getTime();
};



Events.touchend = function (ev) {
  // prevents touchmove generate scroll event to call
  // scrollstop  while the page is still momentum scrolling
  clearTimeout(this.sTimer);
};



Events.scrollStop = function () {
  var eventData, cEvent;

  // update position, cache and detect edge
  _invoke(this.scrollbars, 'update');

  // fire custom event
  this.fireCustomEvent('scrollstop');

  // restore check loop
  G.pauseCheck = false;
};


