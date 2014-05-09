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


asyncTest("scrollTo('right', false, 'auto')", function() {
  expect(2);

  os.scrollEl.scrollLeft = 0;
  os.scrollEl.scrollTop = 100;
  os.scrollTo('right', false, 'auto');

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


