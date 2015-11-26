# Optiscroll

Optiscroll is an tiny (**9kB**) and highly optimized custom scrollbar library for modern web apps.

Optiscroll aims to be as light as possible in order to not affect the performace of your webapp. Optiscroll does **not** replace the scrolling logic with Javascript. It only hides native scrollbars and allows you to style the fake scrollbars as you like. Moreover, Optiscroll adds custom events and methods to extend browser scroll functionalities. 



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

Optiscroll works in **all modern browsers** (IE9 and above). Keep in mind that if Optiscroll does not work your web page will still fallback to default scrollbars.



# How to use Optiscroll

## Installation

Grab `optiscroll.min.js` (or `jquery.optiscroll.min.js`) from `dist` folder or:

```
bower install optiscroll --save
```

## Basic usage

Include Optiscroll library and stylesheet

```html
<link rel="stylesheet" href="optiscroll.css">
<!-- include the plain JS version -->
<script src="optiscroll.js"></script>
<!-- OR include the jQuery plugin -->
<script src="jquery.optiscroll.js"></script>
```

Add Optiscroll containers around your content. The library does **not** add them for you.

```html
<div id="scroll" class="optiscroll">
    <!-- scrollable area, an additional wrapper will be created -->
    My content
</div>
```

Initialize it in your JS code

```javascript
// plain JS version
var element = document.querySelector('#scroll')
var myOptiscrollInstance = new Optiscroll(element);

// jQuery plugin
$('#scroll').optiscroll()
```



## Instance options

| Option name | Default | Purpose  
|-------------|---------|----------
| preventParentScroll | false | Prevents scrolling parent container (or body) when scroll reach top or bottom. Works also on iOS preventing the page bounce. 
| forceScrollbars | false | Use custom scrollbars also on iOS, Android and OSX (w/ trackpad)
| scrollStopDelay | 300 (ms) | Time before presuming that the scroll is ended, then fire `scrollstop` event
| maxTrackSize | 95 (%) | Maximum size (width or height) of the track
| minTrackSize | 5 (%) | Minimum size (width or height) of the track
| draggableTracks | true | Allow track dragging to scroll
| autoUpdate | true | Scrollbars will be automatically updated on size or content changes
| classPrefix | 'optiscroll-' | Custom class prefix for optiscroll elements

Examples:

```javascript
// change min and max track size - plain JS version
var myOptiscrollInstance = new Optiscroll(element, { maxTrackSize: 50, minTrackSize: 20 });

// Force scrollbars on touch devices - jQuery plugin
$('#scroll').optiscroll({ forceScrollbars: true });
```




## Instance methods

### scrollTo ( destX, destY [, duration] )

Scroll to a specific point with a nice animation. If you need to scroll a single axis then set the opposite axis destination to `false`. 
By default the duration is calculated based on the distance (eg: 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms, ...). Alternatively you can set your fixed duration in milliseconds. 

| Arguments | Allowed values
|-----------|----------------
| destX     | number (px), `left`, `right`, `false`
| destY     | number (px), `top`, `bottom`, `false`
| duration  | number (ms), `auto`

Examples:

```javascript
// scroll vertically by 500px (scroll duration will be auto) - plain JS version
myOptiscrollInstance.scrollTo(false, 500);

/* The jQuery plugin allows you to call a method in two ways */

// scroll horizontally to right in 100ms
$('#scroll').data('optiscroll').scrollTo('right', false, 100);

// scroll horizontally by 500px and vertically to bottom with 'auto' duration
$('#scroll').optiscroll('scrollTo', 500, 'bottom', 'auto');
```



### scrollIntoView (elem [, duration, delta])

Scrolls the element into view. The alignment will be driven by the nearest edge. By default the duration is calculated based on the distance (eg: 500px in 700ms, 1000px in 1080ms, 2000px in 1670ms, ...). `delta` is the optional distance in px from the edge. Per edge distances can be defined.

| Arguments | Allowed values
|-----------|----------------
| element   | DOM node, jQuery element, string (selector)
| duration  | number (ms), `auto`
| delta     | number (px), object with `top`, `left`, `right`, `bottom` numbers

Examples:

```javascript
// scrolls element with id anchor-1 into view (scroll duration will be auto) - plain JS version
myOptiscrollInstance.scrollIntoView('#anchor-1');

/* The jQuery plugin allows you to call a method in two ways */

// scrolls jQuery element into view in 500ms and with a distance from the edges of 20px
var $el = $('.my-element').last();
$('#scroll').data('optiscroll').scrollIntoView($el, 500, 20);

// scrolls jQuery element into view with a custom bottom and right distance
$('#scroll').optiscroll('scrollIntoView', $el, 'auto', { bottom: 20, right: 30 });
```


### update ()

Optiscroll caches some DOM properties (like `scrollHeight`, `clientHeight`, ...) in order to avoid quering the DOM (and trigger a layout) each time the user scrolls. Usually the `update` method is called by an internal timer (see the `checkFrequency` global option). So you should not care about it.   However if you have disabled the auto update feature for an instance (via the `autoUpdate` option) or globally (via the `checkFrequency` option), you have to call the `update` method in your code.


### destroy ()

If you want to remove Optiscroll, this method will clean up the class names, unbind all events and remove the scrollbar elements. Optiscroll is clever enough to destroy itself automatically if its element is removed from the DOM (so it avoids memory leaks).


## Instance events

Each instance will fire a set of custom events after user interaction. Each event will include a `detail` property with some useful data about the scrolled element.

| Event name        | Fired when...  
|-------------------|-------------------
| sizechange        | changes `clientWidth`/`clientHeight` of the optiscroll element, or changes `scrollWidth`/`scrollHeight` of the scroll area
| scrollstart       | the user starts scrolling
| scroll            | the user scrolls. This event is already throttled, fired accordingly with the `scrollMinUpdateInterval` value. 
| scrollstop        | the user stops scrolling. The wait time before firing this event is defined by the `scrollStopDelay` option
| scrollreachedge   | the user scrolls to any edge (top/left/right/bottom)
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
| scrollMinUpdateInterval | 25 (ms) | By default the scrollbars position is updated up to 40 times per second. By increasing this time the scroll tracks will be updated less frequently. The smallest interval is 16, which means scroll tracks are updated up to 60 times per second.
| checkFrequency | 1000 (ms) | How often scroll areas are checked for size or content changes. To disable the check timer (and the scrollbars auto update feature) set this value to 0. 

Examples:

```javascript
// set the scrollbar update interval to 30 FPS
Optiscroll.globalSettings.scrollMinUpdateInterval = 1000 / 30;

// disable auto update for all Optiscroll instances
Optiscroll.globalSettings.checkFrequency = 0;
```



## Known limitations

- `forceScrollbars` is not 100% reliable on iOS Safari (due to dynamic style rules)

- On iOS/Android, custom events (and scrollbars if `forceScrollbars: true`) are fired/updated whenever browser fires the scroll event.  

- On older versions of Chrome/Safari if parent Optiscroll has `forceScrollbars`, native scrollbars will not appear also on child scrollable elements.


## Running Tests

Optiscroll is designed to run in the browser so the tests explicitly require
a browser environment instead of any JavaScript environment (i.e. node.js).
You can simply load test/index.html in any browser to run all the tests.




# License

This program is free software; it is distributed under an
[MIT License](https://github.com/wilsonfletcher/Optiscroll/blob/master/LICENSE).

---

Copyright (c) 2014 [Wilson Fletcher](http://wilsonfletcher.com/)
([Contributors](https://github.com/wilsonfletcher/Optiscroll/graphs/contributors)).
