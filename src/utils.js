var Utils = OptiScroll.Utils = {};



Utils.hideNativeScrollbars = function (scrollElement) {
  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    scrollElement.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      scrollElement.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        scrollElement.style.display = 'block'; 
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



Utils.detectEdge = function (cache, fullSize, ignoreLast) {
  var toStartEdge, toEndEdge;

  toStartEdge = cache.position * fullSize;
  toEndEdge = fullSize - (cache.position + cache.size) * fullSize;

  // overscroll - ignore
  if((toStartEdge < 0 && cache.lastEdge === 0) || (toEndEdge < 0 && cache.lastEdge === 1)) {
    return false; 
  }
  
  // start edge reached && was not there already
  if(toStartEdge <= 1 && toStartEdge > -1 && (cache.lastEdge !== 0 || ignoreLast) ) {
    return 0;
  }

  // end edge reached && was not there already
  if(toEndEdge <= 1 && toEndEdge > -1 && toStartEdge > 1 && (cache.lastEdge !== 1 || ignoreLast) ) {
    return 1;
  }

  // not next to an edge
  if(!ignoreLast && toStartEdge > 1 && toEndEdge > 1) {
    return -1;
  }

  return false;
}



Utils.exposedData = function (obj) {
  var data = _extend({}, obj);
  // px conversion
  data.scrollTop = obj.v.position * obj.scrollHeight;
  data.scrollBottom = (1 - obj.v.position) * obj.scrollHeight;
  data.scrollLeft = obj.h.position * obj.scrollWidth;
  data.scrollRight = (1 - obj.h.position) * obj.scrollWidth;

  return data;
};




Utils.addCssRule = function (selector, rules) {
  var styleSheet = document.getElementById('scroll-sheet');

  if ( !styleSheet ) {
    styleSheet = document.createElement("style");
    styleSheet.appendChild(document.createTextNode("")); // WebKit hack
    styleSheet.id = 'scroll-sheet';
    document.head.appendChild(styleSheet);
  } 

  if(styleSheet.sheet.insertRule) {
    styleSheet.sheet.insertRule(selector + "{" + rules + "}", 0);
  } else {
    styleSheet.sheet.addRule(selector, rules);
  }
}




// Global height checker
// looped to listen element changes
Utils.checkLoop = function () {
  
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
      Utils.checkLoop();
    }, GS.checkFrequency);
  }
};






// easeOutCubic function
Utils.easingFunction = function (t) { 
  return (--t) * t * t + 1; 
}






