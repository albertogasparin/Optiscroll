// Global variables

var G = {
  instances: [],
  checkTimer: null,
  isTouch: 'ontouchstart' in window,
  cssTransition: Utils.cssTest('transition'),
  cssTransform: Utils.cssTest('transform'),
  nativeScrollbarSize: Utils.getScrollbarWidth()
};