var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      parentEl = instance.element,
      scrollEl = instance.scrollEl,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      sizeProp = isVertical ? 'H' : 'W',
      clientSize = 'client' + sizeProp,
      scrollSize = 'scroll' + sizeProp,
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],

      enabled = false,
      scrollbarEl = null,
      trackEl = null;

  var events = {
    dragData: null,

    dragStart: function (ev) {
      var evData = ev.touches ? ev.touches[0] : ev;
      events.dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollEl[scrollProp] };
      events.bind(true);
    },

    dragMove: function (ev) {
      var evData = ev.touches ? ev.touches[0] : ev,
          delta, deltaRatio;
      
      ev.preventDefault();
      delta = isVertical ? evData.pageY - events.dragData.y : evData.pageX - events.dragData.x;
      deltaRatio = delta / cache[clientSize];
      
      scrollEl[scrollProp] = events.dragData.scroll + deltaRatio * cache[scrollSize];
    },

    dragEnd: function () {
      events.dragData = null;
      events.bind(false);
    },

    bind: function (on) {
      var method = (on ? 'add' : 'remove') + 'EventListener',
          type = G.isTouch ? ['touchmove', 'touchend'] : ['mousemove', 'mouseup'];

      document[method](type[0], events.dragMove);
      document[method](type[1], events.dragEnd);
    },

  };
  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(trackEl) {
        toggleClass(parentEl, 'has-' + which + 'track', enabled);
      }

      // expose enabled
      scrollbarCache.enabled = enabled;
    },


    create: function () {
      var evType = G.isTouch ? 'touchstart' : 'mousedown';
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix + which;
      trackEl.className = settings.classPrefix + which + 'track';
      scrollbarEl.appendChild(trackEl);
      parentEl.appendChild(scrollbarEl);

      if(settings.draggableTracks) {
        trackEl.addEventListener(evType, events.dragStart);
      }
    },


    update: function () {
      var me = this,
          newSize, oldSize,
          newDim, newRelPos, deltaPos;

      // if scrollbar is disabled and no scroll
      if(!enabled && cache[clientSize] === cache[scrollSize]) {
        return;
      }

      newDim = this.calc();
      newSize = newDim.size;
      oldSize = scrollbarCache.size;
      newRelPos = (1 / newSize) * newDim.position * 100;
      deltaPos = Math.abs(newDim.position - (scrollbarCache.position || 0)) * cache[clientSize];

      if(newSize === 1 && enabled) {
        me.toggle(false);
      }

      if(newSize < 1 && !enabled) {
        me.toggle(true);
      }

      if(trackEl && enabled) {
        me.style(newRelPos, deltaPos, newSize, oldSize);
      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);

      if(enabled) {
        me.fireEdgeEv();
      }
      
    },


    style: function (newRelPos, deltaPos, newSize, oldSize) {
      if(newSize !== oldSize) {
        trackEl.style[ isVertical ? 'height' : 'width' ] = newSize * 100 + '%';
      }
      trackEl.style[G.cssTransform] = 'translate(' + (isVertical ? '0%,' + newRelPos + '%' : newRelPos + '%' + ',0%') + ')';
    },


    calc: function () {
      var position = scrollEl[scrollProp],
          viewS = cache[clientSize], 
          scrollS = cache[scrollSize], 
          sizeRatio = viewS / scrollS,
          sizeDiff = scrollS - viewS,
          positionRatio, percent;

      if(sizeRatio >= 1 || !scrollS) { // no scrollbars needed
        return { position: 0, size: 1, percent: 0 };
      }

      percent = 100 * position / sizeDiff;

      // prevent overscroll effetcs (negative percent) 
      // and keep 1px tolerance near the edges
      if(position <= 1) { percent = 0; }
      if(position >= sizeDiff - 1) { percent = 100; }
      
      // Capped size based on min/max track percentage 
      sizeRatio = Math.max(sizeRatio, settings.minTrackSize / 100);
      sizeRatio = Math.min(sizeRatio, settings.maxTrackSize / 100);

      positionRatio = (1 - sizeRatio) * (percent / 100);

      return { position: positionRatio, size: sizeRatio, percent: percent };
    },


    fireEdgeEv: function () {
      var percent = scrollbarCache.percent;

      if(scrollbarCache.was !== percent && percent % 100 === 0) {
        instance.fireCustomEvent('scrollreachedge');
        instance.fireCustomEvent('scrollreach' + evNames[percent / 100]);
      }

      scrollbarCache.was = percent;
    },


    remove: function () {
      // remove parent custom classes
      this.toggle(false);
      // remove elements
      if(scrollbarEl) {
        scrollbarEl.parentNode.removeChild(scrollbarEl);
        scrollbarEl = null;
      }
    },

  };

};
