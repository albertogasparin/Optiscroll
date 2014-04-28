/*
 * Minimal classList shim for IE 9
 * By Devon Govett
 * https://gist.github.com/devongovett/1381839
 * MIT LICENSE
 */
 
if (!("classList" in document.documentElement) && Object.defineProperty && typeof HTMLElement !== 'undefined') {
  Object.defineProperty(HTMLElement.prototype, 'classList', {
    get: function() {
      var self = this;
      function update(fn) {
        return function(value) {
          var classes = self.className.split(/\s+/),
              index = classes.indexOf(value);

          fn(classes, index, value);
          self.className = classes.join(" ");
        }
      }

      var ret = {                    
        add: update(function(classes, index, value) {
            ~index || classes.push(value);
        }),

        remove: update(function(classes, index) {
            ~index && classes.splice(index, 1);
        })
      };

      return ret;
    }
  });
}