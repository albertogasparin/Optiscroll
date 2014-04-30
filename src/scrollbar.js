var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      parentEl = instance.element,
      scrollEl = instance.scrollEl,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      sizeProp = isVertical ? 'Height' : 'Width',
      clientSize = 'client'+sizeProp,
      scrollSize = 'scroll'+sizeProp,
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],
      trackTransition = 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s',

      enabled = false,
      scrollbarEl = null,
      trackEl = null,
      dragData = null,
      animated = false;

  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(trackEl) {
        parentEl.classList[ enabled ? 'add' : 'remove' ]( which+'track-on' );

        if(enabled) {
          trackEl.style[G.cssTransition] = trackTransition;
        }
      }
    },


    create: function () {
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix+'-'+which;
      trackEl.className = settings.classPrefix+'-'+which+'track';
      scrollbarEl.appendChild(trackEl);
      parentEl.appendChild(scrollbarEl);

      if(settings.draggableTracks) {
        this.bind();
      }
    },


    update: function (isOnTouch) {
      var trackMin = settings.minTrackSize || 0,
          trackMax = settings.maxTrackSize || 100,
          newDim, newRelPos, deltaPos;

      newDim = this.calc(scrollEl[scrollProp], cache[clientSize], cache[scrollSize], trackMin, trackMax);
      newRelPos = ((1 / newDim.size) * newDim.position * 100);
      deltaPos = Math.abs(newDim.position - scrollbarCache.position) * cache[clientSize];

      if(newDim.size === 1 && enabled) {
        this.toggle(false);
      }

      if(newDim.size < 1 && !enabled) {
        this.toggle(true);
      }

      if(trackEl && enabled) {
        if(scrollbarCache.size !== newDim.size) {
          trackEl.style[sizeProp.toLowerCase()] = newDim.size * 100 + '%';
        }

        this.animateTrack( G.isTouch && deltaPos > 20 );

        if(G.cssTransform) {
          trackEl.style[G.cssTransform] = 'translate(' + (isVertical ?  '0,'+newRelPos+'%' : newRelPos+'%'+',0') +')';
        } else { // IE9
          trackEl.style[evNames[0]] = newDim.position * 100 + '%';
        }

      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);

      this.checkEdges(isOnTouch);
    },


    animateTrack: function (animatePos) {
      if(animatePos || animated) {
        trackEl.style[G.cssTransition] = trackTransition + (animatePos ? ', '+ G.cssTransformDashed + ' 0.2s linear 0s' : '');
      }
      animated = animatePos;
    },


    bind: function () {
      var self = this;

      var dragStart = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev;
        dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollEl[scrollProp] };
      }

      var dragMove = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev,
            delta, deltaRatio;
        if(!dragData) return;

        ev.preventDefault();
        delta = isVertical ? evData.pageY - dragData.y : evData.pageX - dragData.x;
        deltaRatio = delta / cache[clientSize];
        
        scrollEl[scrollProp] = dragData.scroll + deltaRatio * cache[scrollSize];
      }

      var dragEnd = function (ev) {
        dragData = null;
      }

      trackEl.addEventListener('mousedown', dragStart);
      trackEl.addEventListener('touchstart', dragStart);

      scrollbarEl.addEventListener('mousemove', dragMove);
      scrollbarEl.addEventListener('touchmove', dragMove);

      scrollbarEl.addEventListener('mouseup', dragEnd);
      scrollbarEl.addEventListener('touchend', dragEnd);
    },

    calc: function (position, viewSize, scrollSize, min, max) {
      var minTrackR = min / 100,
          maxTrackR = max / 100,
          sizeRatio, positionRatio, percent;

      sizeRatio = viewSize / scrollSize;

      if(sizeRatio === 1 || scrollSize === 0) { // no scrollbars needed
        return { position: 0, size: 1, percent: 0 };
      }

      positionRatio = position / scrollSize;
      percent = 100 * position / (scrollSize - viewSize);

      if( sizeRatio > maxTrackR ) {
        positionRatio += (sizeRatio - maxTrackR) * (percent / 100);
        sizeRatio = maxTrackR;
      }

      if( sizeRatio < minTrackR ) {
        positionRatio += (sizeRatio - minTrackR) * (percent / 100);
        sizeRatio = minTrackR;
      }

      if(percent < 0) { // overscroll
        positionRatio = 0;
      }

      if(percent > 100) { // overscroll
        positionRatio = 1 - sizeRatio;
      }
      
      return { position: positionRatio, size: sizeRatio, percent: percent };
    },


    checkEdges: function (isOnTouch) {
      var percent = scrollbarCache.percent, scrollFixPosition;

      if(!enabled) return;

      if(scrollbarCache.was !== percent && percent % 100 === 0 && !isOnTouch) {
        instance.fireCustomEvent('scrollreachedge');
        instance.fireCustomEvent('scrollreach'+ evNames[percent/100] );
      }

      if(percent % 100 === 0 && isOnTouch && settings.fixTouchPageBounce) {
        scrollFixPosition = percent ? scrollbarCache.position * cache[scrollSize] - 1 : 1;
        instance.scrollTo( isVertical ? false : scrollFixPosition, isVertical ? scrollFixPosition : false , 0, true);
      }

      // if(percent > 0 && percent < 100) // update only if not overscroll
        scrollbarCache.was = percent;
    },


    remove: function () {
      if(scrollbarEl) {
        this.toggle(false);
        parentEl.removeChild(scrollbarEl);
      }
    }


  };

};