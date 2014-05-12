var Events = {

  scrollTimer: null,
  stopTimer: null,

  scroll: function (ev, me) {
    var cache = me.cache,
        now = getTime();
    
    if(me.disableScrollEv) { return; }

    if (!G.pauseCheck) {
      me.fireCustomEvent('scrollstart');
    }
    G.pauseCheck = true;
    
    if( !cache.now || now > cache.now + GS.scrollMinUpdateInterval ) {
      cache.now = now;
      
      clearTimeout(me.timerScroll);
      me.timerScroll = setTimeout(function () {
        _invoke(me.scrollbars, 'update');
      }, GS.scrollMinUpdateInterval);

      clearTimeout(me.timerStop);
      me.timerStop = setTimeout(function () {
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
    clearTimeout(me.timerStop);
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
