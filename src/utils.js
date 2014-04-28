var Utils = OptiScroll.Utils = {};



Utils.hideNativeScrollbars = function (scrollEl) {
  if( G.nativeScrollbarSize === 0 ) {
    // hide Webkit/touch scrollbars
    var time = getTime();
    scrollEl.setAttribute('data-scroll', time);
    
    if( G.isTouch ) {
      // force scrollbars disappear on iOS
      scrollEl.style.display = 'none';
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'display: none;');

      animationTimeout(function () { 
        scrollEl.style.display = 'block'; 
      });
    } else {
      Utils.addCssRule('[data-scroll="'+time+'"]::-webkit-scrollbar', 'width: 0; height: 0;');
    }
    
  } else {
    // force scrollbars and hide them
    scrollEl.style.overflow = 'scroll';
    scrollEl.style.right = -G.nativeScrollbarSize + 'px';
    scrollEl.style.bottom = -G.nativeScrollbarSize + 'px';
  }
};




Utils.exposedData = function (obj) {
  return {
    // scrollbars data
    scrollbarV: _extend({}, obj.v),
    scrollbarH: _extend({}, obj.h),

    // scroll position
    scrollTop: obj.v.position * obj.scrollHeight,
    scrollLeft: obj.h.position * obj.scrollWidth,
    scrollBottom: (1 - obj.v.position) * obj.scrollHeight,
    scrollRight: (1 - obj.h.position) * obj.scrollWidth,

    // element size
    scrollWidth: obj.scrollWidth,
    scrollHeight: obj.scrollHeight,
    clientWidth: obj.clientWidth,
    clientHeight: obj.clientHeight
  };
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

  if(!G.pauseCheck) { // check size only if not scrolling
    _invoke(G.instances, 'update');
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






