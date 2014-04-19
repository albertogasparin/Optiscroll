var Utils = OptiScroll.Utils = {};




// Detect css3 support, thanks Modernizr
Utils.cssTest = function (prop) {
  var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
      el = document.createElement( 'test' ),
      props   = (prop + ' ' + ['Webkit','Moz','O','ms'].join(ucProp + ' ') + ucProp).split(' ');

  for ( var i in props ) {
    if ( el.style[ props[i] ] !== undefined ) return props[i];
  }
  return false;
}

  



// Get scrollbars width, thanks Google Closure Library
Utils.getScrollbarWidth = function () {
  var outerEl = document.createElement('div');
  outerEl.style.cssText = 'overflow:auto;width:50px;height:50px;' + 'position:absolute;left:-100px';

  var innerEl = document.createElement('div');
  innerEl.style.cssText = 'width:100px;height:100px';

  outerEl.appendChild(innerEl);
  document.documentElement.appendChild(outerEl);
  var width = outerEl.offsetWidth - outerEl.clientWidth;
  document.documentElement.removeChild(outerEl);
  return width;
}



Utils.calculateScrollbarDimentions = function (position, viewSize, scrollSize, min, max) {
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
    // sizeRatio += positionRatio;
    positionRatio = 0;
  }

  if(percent > 100) { // overscroll
    // sizeRatio += 1 - (positionRatio + sizeRatio); // Do not alter height because transition timings
    positionRatio = 1 - sizeRatio;
  }
  
  return { position: positionRatio, size: sizeRatio, percent: percent };
}



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
  var data = Utils.extendObj({}, obj);
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

  

Utils.extendObj = function (dest, src, merge) {
  for(var key in src) {
    if(!src.hasOwnProperty(key) || dest[key] !== undefined && merge) {
      continue;
    }
    dest[key] = src[key];
  }
  return dest;
}



// easeOutCubic function
Utils.easingFunction = function (t) { 
  return (--t) * t * t + 1; 
}




var getTime = Date.now || function() { return new Date().getTime(); };


var animationTimeout = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback){ window.setTimeout(callback, 1000/60); };

