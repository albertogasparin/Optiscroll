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
  equal(os.cache.v.size, 0.5);
  equal(vTrack.style.height, '50%');
  equal(os.cache.h.size, 0.5);
  equal(hTrack.style.width, '50%');
});


asyncTest("It should move the tracks on scroll", function () {
  expect(6);
  var vTrack = os.element.querySelector('.optiscroll-vtrack'),
      hTrack = os.element.querySelector('.optiscroll-htrack');

  os.scrollEl.scrollTop = 100;
  os.scrollEl.scrollLeft = 50;

  setTimeout(function () {
    equal(os.cache.v.position, 0.5);
    equal(os.cache.v.percent, 100);
    equal(vTrack.style[OptiScroll.G.cssTransform], 'translate(0%, 100%)');
    equal(os.cache.h.position, 0.25);
    equal(os.cache.h.percent, 50);
    equal(hTrack.style[OptiScroll.G.cssTransform], 'translate(50%, 0%)');
    start();
  }, 10)
  
});


asyncTest("Vertical track should be draggable", function () {
  expect(4);
  var vTrack = os.element.querySelector('.optiscroll-vtrack');
  
  os.scrollEl.scrollTop = 0;

  Syn.drag('+0 +25', vTrack, function () {
    setTimeout(function () {
      equal(os.scrollEl.scrollTop, 50);
      equal(os.cache.v.position, 0.25);
      equal(os.cache.v.percent, 50);
      equal(vTrack.style[OptiScroll.G.cssTransform], 'translate(0%, 50%)');
      start();
    }, 500); // wait for scrollStop to fire
  })
  
});

asyncTest("Horizontal track should be draggable", function () {
  expect(4);
  var hTrack = os.element.querySelector('.optiscroll-htrack');

  os.scrollEl.scrollLeft = 0;

  Syn.drag('+25 +0', hTrack, function () {
    setTimeout(function () {
      equal(os.scrollEl.scrollLeft, 50);
      equal(os.cache.h.position, 0.25);
      equal(os.cache.h.percent, 50);
      equal(hTrack.style[OptiScroll.G.cssTransform], 'translate(50%, 0%)');
      start();
    }, 500); // wait for scrollStop to fire
  })
});


asyncTest("It should update tracks", function () {
  expect(4);
  var vTrack = os.element.querySelector('.optiscroll-vtrack'),
      hTrack = os.element.querySelector('.optiscroll-htrack');

  os.scrollEl.scrollTop = 100;
  os.scrollEl.scrollLeft = 10;
  os.element.style.width = '150px';
  os.element.style.height = '150px';
  
  setTimeout(function () {
    os.update();
  })

  setTimeout(function () {
    equal(os.cache.v.size, 0.75);
    equal(os.cache.v.percent, 100);
    equal(os.cache.h.size, 0.75);
    equal(os.cache.h.percent, 20);
    start();
  }, 100);
  
});


asyncTest("Vertical track should be disabled if no scroll", function () {
  expect(4);
  
  os.element.style.height = '300px';
  os.update();

  setTimeout(function () {
    equal(os.cache.v.enabled, false);
    equal(os.cache.v.size, 1);
    equal(os.cache.v.percent, 0);
    equal( os.element.className.indexOf('vtrack-on'), -1);
    start();
  }, 50)
});


asyncTest("Horizontal track should be disabled if no scroll", function () {
  expect(4);
  
  os.element.style.width = '300px';
  os.update();

  setTimeout(function () {
    equal(os.cache.h.enabled, false);
    equal(os.cache.h.size, 1);
    equal(os.cache.h.percent, 0);
    equal( os.element.className.indexOf('htrack-on'), -1);
    start();
  }, 50)
  
});

