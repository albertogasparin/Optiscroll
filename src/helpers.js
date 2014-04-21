var Helpers = OptiScroll.Helpers = {};


Helpers.createScrollbarElements = function () {
  var scrollbars = this.scrollbars,
      settings = this.settings,
      vScrollbar = scrollbars.v.el = document.createElement('div'),
      vTrack = scrollbars.v.track = document.createElement('b'),
      hScrollbar = scrollbars.h.el = document.createElement('div'),
      hTrack = scrollbars.h.track = document.createElement('b');

  vScrollbar.className = settings.classPrefix+'-v';
  vTrack.className = settings.classPrefix+'-vtrack';
  vScrollbar.appendChild(vTrack);
  this.element.appendChild(vScrollbar);

  hScrollbar.className = settings.classPrefix+'-h';
  hTrack.className = settings.classPrefix+'-htrack';
  hScrollbar.appendChild(hTrack);
  this.element.appendChild(hScrollbar);

  scrollbars.dom = true;
};



Helpers.hideNativeScrollbars = function () {
  var self = this,
      scrollElement = this.scrollElement;

  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    scrollElement.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      scrollElement.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        self.scrollElement.style.display = 'block'; 
      });
    } else {
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
    }
    
  } else {
    // force scrollbars and hide them
    scrollElement.style.overflow = 'scroll';
    scrollElement.style.right = -G.nativeScrollbarSize + 'px';
    scrollElement.style.bottom = -G.nativeScrollbarSize + 'px';
  }
};



Helpers.checkEdges = function (isOnScrollStop) {
  var scrollbars = this.scrollbars,
      cache, edge, scrollFixPosition;
  
  // vertical (top - bottom) edges
  if(scrollbars.v.enabled) {
    cache = this.cache.v;
    edge = Utils.detectEdge(cache, this.cache.scrollHeight, !isOnScrollStop);

    if(edge !== false) {
      cache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        Helpers.fireCustomEvent.call(this, 'scrollreachedge');
        Helpers.fireCustomEvent.call(this, 'scrollreach'+ (cache.lastEdge ? 'bottom':'top'));
      }

      if(edge !== -1 && !isOnScrollStop && this.settings.fixTouchPageBounce) {
        scrollFixPosition = cache.lastEdge ? cache.position * this.cache.scrollHeight - 1 : 1;
        this.scrollTo(false, scrollFixPosition, 0, true);
      }
    }
  }

  // horizontal (left - right) edges
  if(scrollbars.h.enabled) {
    cache = this.cache.h;
    edge = Utils.detectEdge(cache, this.cache.scrollWidth, !isOnScrollStop);

    if(edge !== false) {
      cache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        Helpers.fireCustomEvent.call(this, 'scrollreachedge');
        Helpers.fireCustomEvent.call(this, 'scrollreach'+ (cache.lastEdge ? 'right':'left'));
      }

      if(edge !== -1 && !isOnScrollStop && this.settings.fixTouchPageBounce) {
        scrollFixPosition = cache.lastEdge ? cache.position * this.cache.scrollWidth - 1 : 1;
        this.scrollTo(scrollFixPosition, false, 0, true);
      }
    }
  }
  
};



Helpers.animateScroll = function (startX, endX, startY, endY, duration) {
  var self = this,
      scrollElement = this.scrollElement,
      startTime = getTime();
  
  if(duration === 'auto') { 
    // 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms
    duration = Math.pow( Math.max( Math.abs(endX - startX), Math.abs(endY - startY) ), 0.62) * 15;
  }

  if(typeof duration !== 'number') { // if duration was 'asd'
    duration = 500;
  }

  var scrollAnimation = function () {
    var time = Math.min(1, ((getTime() - startTime) / duration)),
        easedTime = easingFunction(time);
    
    if( endY !== startY ) {
      scrollElement.scrollTop = (easedTime * (endY - startY)) + startY;
    }
    if( endX !== startX ) {
      scrollElement.scrollLeft = (easedTime * (endX - startX)) + startX;
    }

    if(time < 1) {
      animationTimeout(scrollAnimation);
    } else {
      self.disableScrollEvent = false;
      // now the internal scroll event will fire
    }
  };
  
  animationTimeout(scrollAnimation);
};



Helpers.fireCustomEvent = function (eventName) {
  var eventData = Utils.exposedData(this.cache),
      cEvent = new CustomEvent(eventName, { detail: eventData });
  
  this.element.dispatchEvent(cEvent);
};




Helpers.enableScrollbar = function (which) {
  var scrollbars = this.scrollbars,
      sb = scrollbars[which];
  
  if(scrollbars.dom) {
    sb.track.style[G.cssTransition] = this.settings.trackTransitions;
  }
  this.element.classList.add( which+'track-on' );
  sb.enabled = true;
};



Helpers.disableScrollbar = function (which) {
  var sb = this.scrollbars[which];

  this.element.classList.remove( which+'track-on' );
  sb.enabled = false;
};



Helpers.animateTracks = function () {
  var scrollbars = this.scrollbars,
      transitions = this.settings.trackTransitions,
      dashedProp = G.cssTransform == 'transform' ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase();
  
  scrollbars.v.track.style[G.cssTransition] = transitions+', '+ dashedProp + ' 0.2s linear 0s';
  scrollbars.h.track.style[G.cssTransition] = transitions+', '+ dashedProp + ' 0.2s linear 0s';
};





// Global height checker
// looped to listen element changes
Helpers.checkLoop = function () {
  
  if(!G.instances.length) {
    G.checkTimer = null;
    return;
  }

  if(!GS.pauseCheck) { // check size only if not scrolling
    G.instances.forEach(function (instance) {
      instance.checkScrollSize();
    });
  }
  
  if(GS.checkFrequency) {
    G.checkTimer = setTimeout(function () {
      Helpers.checkLoop();
    }, GS.checkFrequency);
  }
};




