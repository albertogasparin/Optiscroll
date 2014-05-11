/**
 * jQuery plugin
 * create instance of OptiScroll
 * and when called again you can call functions
 * or change instance settings
 *
 * ~~~
 * $(el).optiScroll({ option })
 * $(el).optiScroll('method', arg) 
 * $(el).optiScroll({ newOptions }) 
 * ~~~
 */

(function ($) {
  
  $.fn.optiScroll = function(options) {
    var method, args;
    
    if( typeof options === 'string' ) {
      args = Array.prototype.slice.call(arguments);
      method = args.shift();
    }

    return this.each(function() {
      var el = $(this);
      var inst = el.data('optiScroll');

      // start new optiscroll instance
      if(!inst) {
        inst = new window.OptiScroll(this, options || {});
        el.data('optiScroll', inst);
      }
      // allow exec method on instance 
      else if( inst && typeof method === 'string' ) {
        if( inst[method] )
          inst[method].apply(inst, args);
      }
      // change the options
      else if(inst && options) {
        $.extend(inst.settings, options);
      }
    });
  };

})( jQuery || Zepto );