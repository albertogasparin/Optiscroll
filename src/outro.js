  // AMD export
  if(typeof define == 'function' && define.amd) {
    define(function(){
      return OptiScroll;
    });
  }
  
  // commonjs export
  if(typeof module !== 'undefined' && module.exports) {
    module.exports = OptiScroll;
  }
  
  window.OptiScroll = OptiScroll;

})(window, document);