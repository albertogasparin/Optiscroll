module("Basics", {
  setup: function() {
    OptiScroll.globalSettings.checkFrequency = 300;
    os = new window.OptiScroll(document.querySelector('#os'));
  }, teardown: function() {
    os = null;
  }
});


test("OptiScroll should be initialized", function () {
  equal(typeof os, 'object');
  // check DOM elements
  equal(os.element.toString(), '[object HTMLDivElement]');
  equal(os.scrollEl.toString(), '[object HTMLDivElement]');
  // check globals
  equal(OptiScroll.G.instances.length, 1);
  ok(OptiScroll.G.checkTimer);
});

asyncTest("OptiScroll should be destroyed", function () {
  expect(4);
  os.destroy();

  setTimeout(function () {
    // check DOM elements style
    ok( !os.scrollEl.getAttribute('style') );
    ok( !os.scrollEl.getAttribute('data-scroll') );
    // check globals
    equal(OptiScroll.G.instances.length, 0);
    equal(OptiScroll.G.checkTimer, null);
    start();
  }, 700);

  
});

