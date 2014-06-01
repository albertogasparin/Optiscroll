var Events = {

  scroll: function (ev, me) {
    
    if (!G.pauseCheck) {
      me.fireCustomEvent('scrollstart');
    }
    G.pauseCheck = true;
    
    me.scrollbars.v.update();
    me.scrollbars.h.update();

    me.fireCustomEvent('scroll');
    
    clearTimeout(me.cache.timerStop);
    me.cache.timerStop = setTimeout(function () {
      Events.scrollStop(me);
    }, me.settings.scrollStopDelay);
  },


  touchstart: function (ev, me) {
    
    G.pauseCheck = false;
    me.scrollbars.v.update();
    me.scrollbars.h.update();
    
    if(me.settings.preventParentScroll) {
      Events.wheel(ev, me);
    }
  },


  touchend: function (ev, me) {
    // prevents touchmove generate scroll event to call
    // scrollstop  while the page is still momentum scrolling
    clearTimeout(me.cache.timerStop);
  },


  scrollStop: function (me) {
    // fire custom event
    me.fireCustomEvent('scrollstop');

    // restore check loop
    G.pauseCheck = false;
  },


  wheel: function (ev, me) {
    var cache = me.cache,
        cacheV = cache.v, cacheH = cache.h;

    if(cacheV.enabled && cacheV.percent % 100 === 0) {
      me.scrollEl.scrollTop = cacheV.percent ? (cache.scrollH - cache.clientH - 1) : 1;
    }
    if(cacheH.enabled && cacheH.percent % 100 === 0) {
      me.scrollEl.scrollLeft = cacheH.percent ? (cache.scrollW - cache.clientW - 1) : 1;
    }
  }


};
