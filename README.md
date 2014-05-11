# OptiScroll

OptiScroll is an highly optimized custom scrollbar library for modern web apps.

OptiScroll aims to be as light as possible in order to not affect the performace of your webapp. OptiScroll does **not** replace the scrolling logic with Javascript, it only hides native scrollbars and allows you to style the fake scrollbars as you like. Moreover, OptiScroll implements custom events and methods to extend browser scroll functionalities. 



## Features

- Lightweight and without dependencies 
- Highly optimized
- Vertical and horizontal scrollbars support
- Nested scrollbars support
- Custom events
- Animated `scrollTo` and `scrollIntoView`
- Auto update on content/scroll area change
- Integrated page bounce fix for iOS 
- Optional jQuery plugin



## Browser support

OptiScroll works in all modern browsers (IE9 and above). IE8 support is under evaluation. Keep in mind that if OptiScroll does not work, your web page will fallback to default scrollbars.

Moreover, OptiScroll has been properly tested on:
- IE9, IE11
- Chrome 32, Chrome 34
- Opera 12.16, Opera 20
- Firefox 27
- Android 4.0, 4.1
- iOS 6.1, 7.1



## Known limitations

- `forceScrollbars` is ignored on Firefox under OSX with trackpad. Currently, there is no way to hide the "Lion style" scrollbars under Firefox. So, OptiScroll always disable them to avoid double scrollbars.

- on iOS, custom events (and scrollbars if enabled with `forceScrollbars:true`) are fired/updated when the momentum scrolling ends.  



# How to use OptiScroll


## Basic usage

Include OptiScroll library and stylesheet

```html
<link rel="stylesheet" href="optiscroll.css">
<!-- include the plain JS version -->
<script src="optiscroll.js"></script>
<!-- OR include the jQuery plugin -->
<script src="jquery.optiscroll.js"></script>
```

Add OptiScroll containers around your content. The library does **not** add them for you.

```html
<div id="scroll" class="optiscroll">
    <div class="optiscroll-content">
        <!-- this is the area that actually scrolls -->
        My content
    </div>
    <!-- scrollbars elements will be added here  -->
</div>
```

Initialize it in your JS code

```javascript
// plain JS version
var element = document.querySelector('#scroll')
var myOptiScrollInstance = new OptiScroll(element);

// jQuery plugin
$('#scroll').optiScroll()
```



## Instance options

| Option name | Default | Purpose  
|-------------|---------|----------
| fixTouchPageBounce | true | Prevents scrolling parent container (or body) on iOS
| forceScrollbars | false | Use custom scrollbars also on iOS, Android and OSX (w/ trackpad)
| scrollStopDelay | 300 (ms) | Time before presuming that the scroll is ended, then fire `scrollstop` event
| maxTrackSize | 95 (%) | Maximum size (width or height) of the track
| minTrackSize | 5 (%) | Minimum size (width or height) of the track
| draggableTracks | true | Allow track dragging to scroll
| autoUpdate | true | Scrollbars will be automatically updated on size or content changes
| classPrefix | 'optiscroll' | Custom class prefix for optiscroll elements

Examples:

```javascript
// change min and max track size - plain JS version
var myOptiScrollInstance = new OptiScroll(element, { maxTrackSize: 50, minTrackSize: 20 });

// Force scrollbars on touch devices - jQuery plugin
$('#scroll').optiScroll({ forceScrollbars: true });
```




## Instance methods

### scrollTo ( destX, destY [, duration] )

Scroll to a specific point with a nice animation. If you need to scroll a single axis, then set the opposit axis detination to `false`. By default, the duration is calculated based on the distance (es: 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms, ...). However, you can set your fixed duration in milliseconds. 

| Arguments | Allowed values
|-----------|----------------
| destX     | number (px), `left`, `right`, `false`
| destY     | number (px), `top`, `bottom`, `false`
| duration  | number (ms), `auto`

Examples:

```javascript
// scroll vertically by 500px (scroll duration will be auto) - plain JS version
myOptiScrollInstance.scrollTo(false, 500);

/* The jQuery plugin allows you to call a method in two ways */

// scroll horizontally to right in 100ms
$('#scroll').data('optiScroll').scrollTo('right', false, 100);

// scroll horizontally by 500px and vertically to bottom with 'auto' duration
$('#scroll').optiScroll('scrollTo', 500, 'bottom', 'auto');
```



### scrollIntoView (elem [, duration, delta])

Scrolls the element into view. The alignmet will be automatic, driven by the nearest edge. By default, the duration is calculated based on the distance (es: 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms, ...). `delta` is the optional distance in px from the edge. Per edge distances can be defined.

| Arguments | Allowed values
|-----------|----------------
| element   | DOM node, jQuery element, string (selector)
| duration  | number (ms), `auto`
| delta     | number (px), object with `top`, `left`, `right`, `bottom` numbers

Examples:

```javascript
// scrolls element with id anchor-1 into view (scroll duration will be auto) - plain JS version
myOptiScrollInstance.scrollIntoView('#anchor-1');

/* The jQuery plugin allows you to call a method in two ways */

// scrolls jQuery element into view in 500ms and with a distance from the edges of 20px
var $el = $('.my-element').last();
$('#scroll').data('optiScroll').scrollIntoView($el, 500, 20);

// scrolls jQuery element into view with a custom bottom and right distance
$('#scroll').optiScroll('scrollIntoView', $el, 'auto', { bottom: 20, right: 30 });
```


### update ()

By design, OptiScroll caches some DOM properties (like `scrollHeight`, `clientHeight`, ...) in order to avoid quering the DOM (and trigger a layout) each time the user scrolls. Usually, the `update` method is called by an internal timer (see the `checkFrequency` global option). So you should not care about it.   However, if you have disabled the auto update feature for an instance (via the `autoUpdate` option) or globally (via the `checkFrequency` option), you have to call the `update` method in your code.


### destroy ()

If you want to remove OptiScroll, this method will clean up the class names, unbind all events and  remove the scrollbar elements. However, OptiScroll tries to be clever enought to destroy itself automatically if its element is removed from the DOM (so it avoids memory leaks).


## Instance events

Each instance will fire a set of custom events after user interaction. Each event will include a `detail` property with some useful data about the scrolled element.

| Event name        | Fired when...  
|-------------------|-------------------
| sizechange        | changes `clientWidth`/`clientHeight` of the optiScroll element, or changes `scrollWidth`/`scrollHeight` of the scroll area
| scrollstop        | the user stops scrolling. The wait time before firing this event is defined by the `scrollStopDelay` option
| scrollreachedge   | the user scrolls to any edge (top or left or right or bottom)  
| scrollreachtop    | the user scrolls to top
| scrollreachbottom | the user scrolls to bottom
| scrollreachleft   | the user scrolls to left
| scrollreachright  | the user scrolls to right

#### Detail object attributes

| Name         | Purpose
|--------------|----------
| scrollbar{V/H}.percent  | Percentage scrolled (value between 0-100)
| scrollbar{V/H}.position | Position (ratio) of the scrollbar from top/left (value between 0-1)
| scrollbar{V/H}.size     | Height/width (ratio) of the scrollbar (value between 0-1)
| scrollTop    | Pixels scrolled from top
| scrollLeft   | Pixels scrolled from left 
| scrollBottom | Pixels scrolled from bottom
| scrollRight  | Pixels scrolled from right
| scrollWidth  | Total scrollable width (px)
| scrollHeight | Total scrollable height (px)
| clientWidth  | Width of the scrollable element
| clientHeight | Height of the scrollable element

Examples:

```javascript
// plain JS listener
document.querySelector('#scroll').addEventListener('scrollreachtop', function (ev) {
    console.log(ev.type) // outputs 'scrollreachtop'
    console.log(ev.detail.scrollTop) // outputs scroll distance from top
    console.log(ev.detail.scrollbarV.percent) // outputs vertical scrolled %
});

// jQuery listener
$('#scroll').on('scrollstop', function (ev) {
    console.log(ev.type) // outputs 'scrollstop'
    console.log(ev.detail.scrollBottom) // outputs scroll distance from bottom
    console.log(ev.detail.scrollbarH.percent) // outputs horizontal scrolled %
});
```



## Global options

| Option name | Default | Purpose  
|-------------|---------|----------
| scrollMinUpdateInterval | 16 (ms) | By default, scrollbars position is updated up to 60 times per second. By increasing this time you will reduce the update rate of the scroll track.  
| checkFrequency | 1000 (ms) | How often scroll areas are checked for size or content changes. To disable the check timer (and the scrollbars auto update feature), set this value to 0. 

Examples:

```javascript
// set the scrollbar update interval to 30 FPS
OptiScroll.globalSettings.scrollMinUpdateInterval = 1000 / 30;

// disable auto update for all OptiScroll instances
OptiScroll.globalSettings.checkFrequency = 0;
```



## Running Tests

OptiScroll is designed to run in the browser, so the tests explicitly require
a browser environment instead of any JavaScript environment (i.e. node.js).
You can simply load test/index.html in any browser to run all the tests.




# License

This program is free software; it is distributed under an
[MIT License](https://github.com/wilsonfletcher/optiScroll/blob/master/LICENSE).

---

Copyright (c) 2013-2014 [Wilson Fletcher](http://wilsonfletcher.com/)
([Contributors](https://github.com/wilsonfletcher/optiScroll/graphs/contributors)).
