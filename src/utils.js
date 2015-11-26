var Utils = {

  hideNativeScrollbars: function (scrollEl) {
    var size = G.nativeScrollbarSize,
        scrollElStyle = scrollEl.style;
    if(size === 0) {
      // hide Webkit/touch scrollbars
      var time = Date.now();
      scrollEl.setAttribute('data-scroll', time);
      Utils.addCssRule('[data-scroll="' + time + '"]::-webkit-scrollbar', 'display:none;width:0;height:0;');
    } else {
      scrollElStyle.right = -size + 'px';
      scrollElStyle.bottom = -size + 'px';
    }
  },


  addCssRule: function (selector, rules) {
    var styleSheet = document.getElementById('scroll-sheet');
    if(!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'scroll-sheet';
      styleSheet.appendChild(document.createTextNode('')); // WebKit hack
      document.head.appendChild(styleSheet);
    } 
    styleSheet.sheet.insertRule(selector + ' {' + rules + '}', 0);
  },


  createWrapper: function (element, className) {
    var wrapper = document.createElement('div'),
        child;
    while(child = element.childNodes[0]) {
      wrapper.appendChild(child);
    }
    wrapper.className = className;
    return element.appendChild(wrapper);
  },


  containsNode: function (parent, node) {
    return parent.contains ?
      parent != node && parent.contains(node) :
      !!(parent.compareDocumentPosition(node) & 16);
  },


  // Global height checker
  // looped to listen element changes
  checkLoop: function () {
    
    if(!G.instances.length) {
      G.checkTimer = null;
      return;
    }

    if(!G.pauseCheck) { // check size only if not scrolling
      _invoke(G.instances, 'update');
    }
    
    if(GS.checkFrequency) {
      G.checkTimer = setTimeout(function () {
        Utils.checkLoop();
      }, GS.checkFrequency);
    }
  },


  // easeOutCubic function
  easingFunction: function (t) { 
    return (--t) * t * t + 1; 
  },


};
