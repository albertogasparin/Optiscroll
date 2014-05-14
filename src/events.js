var Events = {

  scrollTimer: null,
  stopTimer: null,

  scroll: function (ev, me) {
    var cache = me.cache,
        now = getTime(),
        waitBeforeUpdate = 'matchMedia' in window ? GS.scrollMinUpdateInterval : 0; // IE9 fix
    
    if(me.disableScrollEv) { return; }

    if (!G.pauseCheck) {
      me.fireCustomEvent('scrollstart');
    }
    G.pauseCheck = true;
    
    if( !cache.now || now > cache.now + GS.scrollMinUpdateInterval ) {
      cache.now = now;
      
      clearTimeout(cache.timerScroll);
      cache.timerScroll = setTimeout(function () {
        _invoke(me.scrollbars, 'update');
      }, waitBeforeUpdate);

      clearTimeout(cache.timerStop);
      cache.timerStop = setTimeout(function () {
        Events.scrollStop(me);
      }, me.settings.scrollStopDelay);
    }
  },


  touchstart: function (ev, me) {
    G.pauseCheck = false;
    if(me.settings.preventParentScroll) {
      _invoke(me.scrollbars, 'update', [true]);
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
    percentY = cache.v.percent + deltaY / cache.scrollH;

    if( //(deltaX && (percentX <= 0 || percentX >= 100)) || 
        (deltaY && (percentY <= 0 || percentY >= 100))) {
      ev.preventDefault();
    }
    ev.stopPropagation();
  }


};
