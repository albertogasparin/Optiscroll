/*
 * CustomEvent polyfill for IE9
 * By MDN
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
 * MIT LICENSE
 */

typeof window.CustomEvent === 'function' || (function (window) {

  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;

})(window);
