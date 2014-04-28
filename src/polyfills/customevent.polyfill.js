// CustomEvent polyfill for IE9
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent

(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   };

  CustomEvent.prototype = window.Event.prototype;

  if (!('CustomEvent' in window))
    window.CustomEvent = CustomEvent;
})();