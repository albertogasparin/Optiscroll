// Global variables
var G = {
  instances: [],
  checkTimer: null,
  isTouch: 'ontouchstart' in window,
  cssTransition: cssTest('transition'),
  cssTransform: cssTest('transform'),
  nativeScrollbarSize: getScrollbarWidth()
};




var getTime = Date.now || function() { return new Date().getTime(); };


var animationTimeout = (function () {
  return window.requestAnimationFrame 
    || window.webkitRequestAnimationFrame 
    || window.mozRequestAnimationFrame 
    || window.msRequestAnimationFrame 
    || window.oRequestAnimationFrame 
    || function(callback){ window.setTimeout(callback, 1000/60); };
})();



// Get scrollbars width, thanks Google Closure Library
function getScrollbarWidth () {
  var htmlEl = document.documentElement,
      outerEl, innerEl, width = 0;

  outerEl = document.createElement('div');
  outerEl.style.cssText = 'overflow:auto;width:50px;height:50px;' + 'position:absolute;left:-100px';

  innerEl = document.createElement('div');
  innerEl.style.cssText = 'width:100px;height:100px';

  outerEl.appendChild(innerEl);
  htmlEl.appendChild(outerEl);
  width = outerEl.offsetWidth - outerEl.clientWidth;
  htmlEl.removeChild(outerEl);

  return width;
}


// Detect css3 support, thanks Modernizr
function cssTest (prop) {
  var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
      el = document.createElement( 'test' ),
      props   = (prop + ' ' + ['Webkit','Moz','O','ms'].join(ucProp + ' ') + ucProp).split(' ');

  for ( var i in props ) {
    if ( el.style[ props[i] ] !== undefined ) return props[i];
  }
  return false;
}



function _extend (dest, src, merge) {
  for(var key in src) {
    if(!src.hasOwnProperty(key) || dest[key] !== undefined && merge) {
      continue;
    }
    dest[key] = src[key];
  }
  return dest;
}


function _invoke (collection, fn, args) {
  var i, j, key;
  if(collection.length) {
    for(i = 0, j = collection.length; i < j; i++) {
      if(collection[i][fn]) 
        collection[i][fn].apply(collection[i], args);
    }
  } else {
    for (key in collection) {
      if(collection.hasOwnProperty(key) && collection[key][fn])
        collection[key][fn].apply(collection[key], args);
    }
  }
}