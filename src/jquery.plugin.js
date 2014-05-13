/**
 * jQuery plugin
 * create instance of Optiscroll
 * and when called again you can call functions
 * or change instance settings
 *
 * ~~~
 * $(el).optiscroll({ option })
 * $(el).optiscroll('method', arg) 
 * $(el).optiscroll({ newOptions }) 
 * ~~~
 */

(function ($) {
  
  $.fn.optiscroll = function(options) {
    var method, args;
    
    if( typeof options === 'string' ) {
      args = Array.prototype.slice.call(arguments);
      method = args.shift();
    }

    return this.each(function() {
      var el = $(this);
      var inst = el.data('optiscroll');

      // start new optiscroll instance
      if(!inst) {
        inst = new window.Optiscroll(this, options || {});
        el.data('optiscroll', inst);
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