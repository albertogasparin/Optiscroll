var Events = OptiScroll.Events = {};


Events.scroll = function (ev, me) {
  var cache = me.cache,
      now = getTime();
  
  if(me.disableScrollEv) { return; }

  if (!G.pauseCheck) {
    me.fireCustomEvent('scrollstart');
  }
  G.pauseCheck = true;

  if( now - (cache.now || 0) >= GS.scrollMinUpdateInterval ) {

    _invoke(me.scrollbars, 'update');

    cache.now = now;
    
    clearTimeout(me.sTimer);
    me.sTimer = setTimeout(function () {
      Events.scrollStop(me);
    }, me.settings.scrollStopDelay);
  }

};



Events.touchstart = function (ev, me) {
  G.pauseCheck = false;
  if(me.settings.fixTouchPageBounce) {
    _invoke(me.scrollbars, 'update', [true]);
  }
  me.cache.now = getTime();
};



Events.touchend = function (ev, me) {
  // prevents touchmove generate scroll event to call
  // scrollstop  while the page is still momentum scrolling
  clearTimeout(me.sTimer);
};



Events.scrollStop = function (me) {
  // update position, cache and detect edge
  _invoke(me.scrollbars, 'update');

  // fire custom event
  me.fireCustomEvent('scrollstop');

  // restore check loop
  G.pauseCheck = false;
};


