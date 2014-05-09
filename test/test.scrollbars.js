module("Scrollbars", {
  setup: function() {
    os = new window.OptiScroll(document.querySelector('#os'), { forcedScrollbars: true });
  }, teardown: function() {
    os.destroy();
    os = null;
  }
});


test("OptiScroll should create scrollbars", function () {
  // internal scrollbar intances
  ok(os.scrollbars.v, "Vertical scrollbar instance created");
  ok(os.scrollbars.h, "Horizontal scrollbar instance created");
  // DOM elements
  ok( os.element.querySelector('.optiscroll-v'), "Vertical scrollbar element created");
  ok( os.element.querySelector('.optiscroll-h'), "Horizontal scrollbar element created");
  // Classes
  notEqual( os.element.className.indexOf('vtrack-on'), -1 );
  notEqual( os.element.className.indexOf('htrack-on'), -1 );
});