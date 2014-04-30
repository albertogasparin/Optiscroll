var Events = OptiScroll.Events = {};


Events.scroll = function (ev) {
  var me = this,
      cache = me.cache,
      now = getTime();
  
  if(me.disableScrollEv) return;

  if (!G.pauseCheck) {
    me.fireCustomEvent('scrollstart');
  }
  G.pauseCheck = true;

  if( now - (cache.now || 0) >= GS.scrollMinUpdateInterval ) {

    _invoke(me.scrollbars, 'update');

    cache.now = now;
    
    clearTimeout(me.sTimer);
    me.sTimer = setTimeout(function () {
      Events.scrollStop.call(me);
    }, me.settings.scrollStopDelay);
  }

};



Events.touchstart = function (ev) {
  var me = this;

  G.pauseCheck = false;
  if(me.settings.fixTouchPageBounce) {
    _invoke(me.scrollbars, 'update', [true]);
  }
  me.cache.now = getTime();
};



Events.touchend = function (ev) {
  // prevents touchmove generate scroll event to call
  // scrollstop  while the page is still momentum scrolling
  clearTimeout(this.sTimer);
};



Events.scrollStop = function () {
  var me = this,
      eventData, cEvent;

  // update position, cache and detect edge
  _invoke(me.scrollbars, 'update');

  // fire custom event
  me.fireCustomEvent('scrollstop');

  // restore check loop
  G.pauseCheck = false;
};


