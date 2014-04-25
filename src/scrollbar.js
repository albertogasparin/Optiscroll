var Scrollbar = function (which, instance) {

  var isVertical = (which === 'v'),
      cssTransformDashed = (G.cssTransform == 'transform') ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase(),

      parentElement = instance.element,
      scrollElement = instance.scrollElement,
      settings = instance.settings,
      cache = instance.cache,
      scrollbarCache = cache[which] = {},

      clientSize = isVertical ? 'clientHeight' : 'clientWidth',
      scrollSize = isVertical ? 'scrollHeight' : 'scrollWidth',
      scrollProp = isVertical ? 'scrollTop' : 'scrollLeft',
      elementSize = isVertical ? 'height' : 'width',
      evNames = isVertical ? ['top','bottom'] : ['left','right'],

      enabled = false,
      scrollbarEl = null,
      trackEl = null,
      dragData = null,
      animated = false;

  
  return {


    toggle: function (bool) {
      enabled = bool;

      if(enabled) {
        parentElement.classList.add( which+'track-on' );
      } else {
        parentElement.classList.remove( which+'track-on' );
      }

      if(trackEl && enabled) {
        trackEl.style[G.cssTransition] = settings.trackTransitions;
      }
    },


    create: function () {
      scrollbarEl = document.createElement('div');
      trackEl = document.createElement('b');

      scrollbarEl.className = settings.classPrefix+'-'+which;
      trackEl.className = settings.classPrefix+'-'+which+'track';
      scrollbarEl.appendChild(trackEl);
      parentElement.appendChild(scrollbarEl);

      if(settings.draggableTracks) {
        this.bind();
      }
    },


    update: function () {
      var trackMin = settings.minTrackSize || 0,
          trackMax = settings.maxTrackSize || 100,
          newDim, newRelPos, deltaPos;

      newDim = this.calc(scrollElement[scrollProp], cache[clientSize], cache[scrollSize], trackMin, trackMax);
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
          trackEl.style[elementSize] = newDim.size * 100 + '%';
        }

        if( G.isTouch && deltaPos > 20 ) {
          this.animateTrack();
        } else if (animated) {
          this.removeTrackAnimation();
        }

        if(isVertical) {
          if(G.cssTransform) {
            trackEl.style[G.cssTransform] = 'translate(0, '+ newRelPos + '%' +')';
          } else { // IE9
            trackEl.style.top = newDim.position * 100 + '%';
          }
        } else {
          if(G.cssTransform) {
            trackEl.style[G.cssTransform] = 'translate('+ newRelPos + '%' +', 0)';
          } else { // IE9
            trackEl.style.left = newDim.position * 100 + '%';
          }
        }

      }

      // update cache values
      scrollbarCache = _extend(scrollbarCache, newDim);
    },


    animateTrack: function () {
      animated = true;
      trackEl.style[G.cssTransition] = settings.trackTransitions+', '+ cssTransformDashed + ' 0.2s linear 0s';
    },


    removeTrackAnimation: function () {
      animated = false;
      trackEl.style[G.cssTransition] = settings.trackTransitions;
    },


    bind: function () {
      var self = this;

      var dragStart = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev;
        dragData = { x: evData.pageX, y: evData.pageY, scroll: scrollElement[scrollProp] };
      }

      var dragMove = function (ev) {
        var evData = ev.touches ? ev.touches[0] : ev,
            delta, deltaRatio;
        if(!dragData) return;

        ev.preventDefault();
        delta = isVertical ? evData.pageY - dragData.y : evData.pageX - dragData.x;
        deltaRatio = delta / cache[clientSize];
        
        scrollElement[scrollProp] = dragData.scroll + deltaRatio * cache[scrollSize];
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


    checkEdges: function (isOnScrollStop) {
      var edge = Utils.detectEdge(scrollbarCache, cache[scrollSize], !isOnScrollStop);

      if(!enabled || edge === false) 
        return;

      scrollbarCache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        instance.fireCustomEvent('scrollreachedge');
        instance.fireCustomEvent('scrollreach'+ evNames[scrollbarCache.lastEdge] );
      }

      if(edge !== -1 && !isOnScrollStop && settings.fixTouchPageBounce) {
        scrollFixPosition = scrollbarCache.lastEdge ? scrollbarCache.position * cache[scrollSize] - 1 : 1;
        instance.scrollTo( isVertical ? false : scrollFixPosition, isVertical ? scrollFixPosition : false , 0, true);
      }
    }


  };

};