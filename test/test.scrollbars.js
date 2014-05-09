module("Scrollbars", {
  setup: function() {
    os = new window.OptiScroll(document.querySelector('#os'), { forcedScrollbars: true, autoUpdate: false });
  }, teardown: function() {
    os.destroy();
    os = null;
  }
});


test("It should create scrollbars", function () {
  // internal scrollbar intances
  ok(os.scrollbars.v, "Vertical scrollbar instance created");
  ok(os.scrollbars.h, "Horizontal scrollbar instance created");
  // DOM elements
  ok( os.element.querySelector('.optiscroll-v'), "Vertical scrollbar element created");
  ok( os.element.querySelector('.optiscroll-h'), "Horizontal scrollbar element created");
  // Classes
  notEqual( os.element.className.indexOf('vtrack-on'), -1);
  notEqual( os.element.className.indexOf('htrack-on'), -1);
});

test("It should set the track size", function () {
  var vTrack = os.element.querySelector('.optiscroll-vtrack'),
      hTrack = os.element.querySelector('.optiscroll-htrack');
  // size
  equal(vTrack.style.height, '50%');
  equal(hTrack.style.width, '50%');
});


asyncTest("It should move the tracks on scroll", function () {
  expect(2);
  var vTrack = os.element.querySelector('.optiscroll-vtrack'),
      hTrack = os.element.querySelector('.optiscroll-htrack');

  os.scrollEl.scrollTop = 100;
  os.scrollEl.scrollLeft = 50;

  setTimeout(function () {
    equal(vTrack.style[OptiScroll.G.cssTransform], 'translate(0%, 100%)');
    equal(hTrack.style[OptiScroll.G.cssTransform], 'translate(50%, 0%)');
    start();
  })
  
});


asyncTest("Vertical track should be draggable", function () {
  expect(2);
  var vTrack = os.element.querySelector('.optiscroll-vtrack');
  
  Syn.drag('+0 +25', vTrack, function () {
    setTimeout(function () {
      equal(os.scrollEl.scrollTop, 50);
      equal(vTrack.style[OptiScroll.G.cssTransform], 'translate(0%, 50%)');
      start();
    }, 500); // wait for scrollStop to fire
  })
  
});

asyncTest("Horizontal track should be draggable", function () {
  expect(2);
  var hTrack = os.element.querySelector('.optiscroll-htrack');

  Syn.drag('+25 +0', hTrack, function () {
    setTimeout(function () {
      equal(os.scrollEl.scrollLeft, 50);
      equal(hTrack.style[OptiScroll.G.cssTransform], 'translate(50%, 0%)');
      start();
    }, 500); // wait for scrollStop to fire
  })
});


