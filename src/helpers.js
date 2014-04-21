var Helpers = OptiScroll.Helpers = {};


Helpers.createScrollbarElements = function () {
  var vScrollbar = this.scrollbars.v.el = document.createElement('div'),
      vTrack = this.scrollbars.v.track = document.createElement('b'),
      hScrollbar = this.scrollbars.h.el = document.createElement('div'),
      hTrack = this.scrollbars.h.track = document.createElement('b');

  vScrollbar.className = this.settings.classPrefix+'-v';
  vTrack.className = this.settings.classPrefix+'-vtrack';
  vScrollbar.appendChild(vTrack);
  this.element.appendChild(vScrollbar);

  hScrollbar.className = this.settings.classPrefix+'-h';
  hTrack.className = this.settings.classPrefix+'-htrack';
  hScrollbar.appendChild(hTrack);
  this.element.appendChild(hScrollbar);

  this.scrollbars.dom = true;
};



Helpers.hideNativeScrollbars = function () {
  var self = this;

  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    this.scrollElement.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      this.scrollElement.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        self.scrollElement.style.display = 'block'; 
      });
    } else {
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
    }
    
  } else {
    // force scrollbars and hide them
    this.scrollElement.style.overflow = 'scroll';
    this.scrollElement.style.right = -G.nativeScrollbarSize + 'px';
    this.scrollElement.style.bottom = -G.nativeScrollbarSize + 'px';
  }
};



Helpers.checkEdges = function (isOnScrollStop) {
  var cache, edge, scrollFixPosition;
  
  // vertical (top - bottom) edges
  if(this.scrollbars.v.enabled) {
    cache = this.cache.v;
    edge = Utils.detectEdge(cache, this.cache.scrollHeight, !isOnScrollStop);

    if(edge !== false) {
      cache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        Helpers.fireCustomEvent.call(this, 'scrolledgereached');
        Helpers.fireCustomEvent.call(this, 'scroll'+ (cache.lastEdge ? 'bottom':'top') +'reached');
      }

      if(edge !== -1 && !isOnScrollStop && this.settings.fixTouchPageBounce) {
        scrollFixPosition = cache.lastEdge ? cache.position * this.cache.scrollHeight - 1 : 1;
        this.scrollTo(false, scrollFixPosition, 0, true);
      }
    }
  }

  // horizontal (left - right) edges
  if(this.scrollbars.h.enabled) {
    cache = this.cache.h;
    edge = Utils.detectEdge(cache, this.cache.scrollWidth, !isOnScrollStop);

    if(edge !== false) {
      cache.lastEdge = edge;

      if(edge !== -1 && isOnScrollStop) {
        Helpers.fireCustomEvent.call(this, 'scrolledgereached');
        Helpers.fireCustomEvent.call(this, 'scroll'+ (cache.lastEdge ? 'right':'left') +'reached');
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
      self.scrollElement.scrollTop = (easedTime * (endY - startY)) + startY;
    }
    if( endX !== startX ) {
      self.scrollElement.scrollLeft = (easedTime * (endX - startX)) + startX;
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
  var sb = this.scrollbars[which];
  sb.enabled = true;
  if(this.scrollbars.dom)
    sb.track.style[G.cssTransition] = this.settings.trackTransitions;
  this.element.classList.add( which+'track-on' );
};



Helpers.disableScrollbar = function (which) {
  var sb = this.scrollbars[which];
  sb.enabled = false;
  this.element.classList.remove( which+'track-on' );
};



Helpers.animateTracks = function () {
  var dashedProp = G.cssTransform == 'transform' ? G.cssTransform : '-'+G.cssTransform.replace('T','-t').toLowerCase();
  
  this.scrollbars.v.track.style[G.cssTransition] = this.settings.trackTransitions+', '+ dashedProp + ' 0.2s linear 0s';
  this.scrollbars.h.track.style[G.cssTransition] = this.settings.trackTransitions+', '+ dashedProp + ' 0.2s linear 0s';
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




