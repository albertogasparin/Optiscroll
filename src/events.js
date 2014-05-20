var Events = {

  scroll: function (ev, me) {
    if(me.disableScrollEv) { return; }

    if (!G.pauseCheck) {
      me.fireCustomEvent('scrollstart');
    }
    G.pauseCheck = true;
    
    _invoke(me.scrollbars, 'update');
    
    clearTimeout(me.cache.timerStop);
    me.cache.timerStop = setTimeout(function () {
      Events.scrollStop(me);
    }, me.settings.scrollStopDelay);
  },


  touchstart: function (ev, me) {
    var cache = me.cache,
        cacheV = cache.v, cacheH = cache.h;

    G.pauseCheck = false;
    _invoke(me.scrollbars, 'update', [true]);
    
    if(me.settings.preventParentScroll) {
      if(cacheV.enabled && cacheV.percent % 100 === 0) {
        me.scrollTo( false, cacheV.percent ? (cacheV.position * cache.scrollH - 1) : 1, 0, true);
      }
      if(cacheH.enabled && cacheH.percent % 100 === 0) {
        me.scrollTo( cacheH.percent ? (cacheH.position * cache.scrollW - 1) : 1, false, 0, true);
      }
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
    // prevents scrolling only on Y axis 
    // due to complexity on getting scroll direction
    var cache = me.cache,
        // deltaX = ev.deltaX || -ev.wheelDeltaX/3 || 0,
        deltaY = ev.deltaY || -ev.wheelDeltaY/3 || 0,
        // percentX, 
        percentY;
    
    // fix Firefox returning float numbers
    // deltaX = deltaX > 0 ? Math.ceil(deltaX) : Math.floor(deltaX);
    deltaY = deltaY > 0 ? Math.ceil(deltaY) : Math.floor(deltaY);

    // percentX = cache.h.percent + deltaX / cache.scrollW;
    percentY = ~~cache.v.percent + deltaY / cache.scrollH;

    if( //(deltaX && (percentX <= 0 || percentX >= 100)) || 
        (deltaY && (percentY <= 0 || percentY >= 100))) {
      ev.preventDefault();
    }
    ev.stopPropagation();
  }


};
