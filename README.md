# optiScroll

optiScroll is an highly optimized custom scrollbar library for modern web apps.

optiScroll aims to be as light as possible in order to not affect the performace of your webapp. optiScroll does **not** replace the scrolling logic with Javascript, it only hides native scrollbars and allows you to style the fake scrollbars as you like. Moreover, optiScroll implements custom events and methods to extend browser scroll functionalities. 


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

optiScroll works in all modern browsers (IE9 and above). IE8 support is under evaluation. Keep in mind that if optiScroll does not work, your web page will fallback to default scrollbars.

optiScroll has been tested on:
- IE9
- Chrome 32
- Opera 12.5
- Firefox 12
- Android 4.0, 4.1
- iOS 6.1, 7.1


# How to use optiScroll


## Basic usage

Include optiScroll library and stylesheet

```html
<link rel="stylesheet" href="optiscroll.css">
<script src="optiscroll.js"></script>
```

Add optiScroll containers around your content. The library does not add them for you.

```html
<div class="optiscroll">
    <div class="optiscroll-content">
        My content
    </div>
</div>
```

Initialize

```html
<script>
    new optiScroll( document.querySelector('.optiscroll') );
</script>
```


## Global options

| option name | default | Purpose  
|-------------|---------|----------
| scrollMinUpdateInterval | 16 (ms) | By default, scrollbars position is updated up to 60 times per second. By increasing this time you will reduce the update rate of the scroll track.  
| checkFrequency | 1000 (ms) | How often scroll areas are checked for size or content changes. To disable the check timer (and the scrollbars auto update feature), set this value to 0. 



## Instance options

| option name | default | Purpose  
|-------------|---------|----------
| fixTouchPageBounce | true | 
| forcedScrollbars | false | Use custom scrollbars also on iOS, Android and OSX (w/ trackpad)
| scrollStopDelay | 300 (ms) | Waiting time before presuming that the scroll is
| maxTrackSize | 90 (%) |
| minTrackSize | 5 (%) |
| scrollbarsInteractivity | true |
| autoUpdate | true |
| classPrefix | 'optiscroll' |
| trackTransitions | 'height 0.2s ease 0s, width 0.2s ease 0s, opacity 0.2s ease 0s' |



## Instance methods

scrollTo
scrollIntoView


## Instance events

sizechange
scrollstop
scrollreachedge
scrollreachtop
scrollreachbottom
scrollreachleft
scrollreachright




## Running Tests

**tl;dr:** You need PhantomJS and SlimerJS installed to run tests. Then, just
run `npm test` (or, directly, `grunt test`). Your code must also pass the
[linter](http://www.jshint.com/).

_Note for Windows users:_ SlimerJS doesn't seem to work on Windows for our
tests, so run the tests with `grunt test --force`. The SlimerJS versions will
be run on Travis when you submit a pull request.

optiScroll is designed to run in the browser, so the tests explicitly require
a browser environment instead of any JavaScript environment (i.e. node.js).
The tests are run on both a headless WebKit (using
[PhantomJS](http://phantomjs.org)) and
["headless" Gecko](http://slimerjs.org/faq.html) (using
[SlimerJS](http://slimerjs.org/)). The tests are written using
[CasperJS's tester module](http://docs.casperjs.org/en/latest/modules/tester.html).

On Mac OS X, you'll need to install both PhantomJS and SlimerJS like so:

```
brew install phantomjs slimerjs
```

If you're using Windows or Linux, you can get
[get PhantomJS](http://phantomjs.org/download) and
[get SlimerJS](http://slimerjs.org/download) from their websites. I haven't
tried it myself, but it seems easy enough.

Generally you'll need a version of Firefox or XULRunner installed for SlimerJS
to run your tests. The exact steps how to install and setup SlimerJS are
described on the
[project homepage](http://slimerjs.org/install.html#install-firefox).

Once everything is installed you can simply type `grunt test`
to make sure the code is working as expected. This will also
[check your code quality](http://www.jshint.com/), ensuring your patch is
in-line with optiScroll's code style.


# Frequently Asked Questions




# License

This program is free software; it is distributed under an
[Apache License](https://github.com/wilsonfletcher/optiScroll/blob/master/LICENSE).

---

Copyright (c) 2013-2014 [Wilson Fletcher](http://wilsonfletcher.com/)
([Contributors](https://github.com/wilsonfletcher/optiScroll/graphs/contributors)).
