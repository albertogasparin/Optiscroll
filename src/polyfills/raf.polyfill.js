// Adaped from https://github.com/darius/requestAnimationFrame
// requestAnimationFrame polyfill by Erik Möller.
// MIT license

window.requestAnimationFrame || (function(window) {
  var lastTime = 0;

  window.requestAnimationFrame = function(callback) {
    var now = Date.now();
    var nextTime = Math.max(lastTime + 16, now);
    
    return setTimeout(function() { 
      callback(lastTime = nextTime); 
    }, nextTime - now);
  };

  window.cancelAnimationFrame = clearTimeout;

}(window));
