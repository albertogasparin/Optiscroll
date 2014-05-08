
module("OptiScroll init", {
  setup: function() {
    os = new window.OptiScroll(document.querySelector('#os'));
  }, teardown: function() {
    os.destroy();
    os = null;
  }
});


test("A new OptiScroll instance has been created", function () {
  equal(typeof os, 'object');
});

test("Instance elements are DOM element", function () {
  equal(os.element.toString(), '[object HTMLDivElement]');
  equal(os.scrollEl.toString(), '[object HTMLDivElement]');
});

test("Instance added to global instances array", function () {
  ok(OptiScroll.G.instances.length);
});





module("Public APIs", {
  setup: function() {
    os = new window.OptiScroll(document.querySelector('#os'));
  }, teardown: function() {
    os.destroy();
    os = null;
  }
});


asyncTest("scrollTo(50, 100, 0)", function () {
  expect(2);

  os.scrollEl.scrollLeft = 0;
  os.scrollEl.scrollTop = 0;
  os.scrollTo(50, 100, 0);

  setTimeout(function() {
    equal(os.scrollEl.scrollLeft, 50);
    equal(os.scrollEl.scrollTop, 100);
    start();
  }, 50);
});


asyncTest("scrollTo(100, false, 'auto')", function() {
  expect(2);

  os.scrollEl.scrollLeft = 0;
  os.scrollEl.scrollTop = 100;
  os.scrollTo(100, false, 'auto');

  setTimeout(function() {
    equal(os.scrollEl.scrollLeft, 100);
    equal(os.scrollEl.scrollTop, 100);
    start();
  }, 300);
});


asyncTest("scrollTo(false, 0, 500)", function() {
  expect(2);

  os.scrollEl.scrollLeft = 50;
  os.scrollEl.scrollTop = 50;
  os.scrollTo(false, 0, 500);

  setTimeout(function() {
    equal(os.scrollEl.scrollLeft, 50);
    equal(os.scrollEl.scrollTop, 0);
    start();
  }, 550);
});


