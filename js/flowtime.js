/*!
 * Flowtime.js
 * http://marcolago.com/flowtime-js/
 * MIT licensed
 *
 * Copyright (C) 2012-now Marco Lago, http://marcolago.com
 */

var Flowtime = (function ()
{

  /**
    * Init constants and variables defined in modules
    */
  var ft_constants = get_ft_constants();
  var ft_variables = get_ft_variables();

  /**
   * test if the device is touch enbled
   */
  if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
      ft_variables.isTouchDevice = true;
  }

  /**
   * test if the HTML History API's is available
   * this value can be overridden to disable the History API
   */
  var pushHistory = window.history.pushState;


  /**
   * set the transition time reading from CSS value with a fallback default
   */
  (function initTransitionTime() {
    var tt = Brav1Toolbox.getCSSValue(ft_variables.ftContainer, "transitionDuration");
    var ttInt = parseFloat(tt);
    var unit = tt.replace("" + ttInt, "");
    if (!isNaN(ttInt) && ttInt > 0) {
      if (unit === "s") {
        ft_variables._transitionTime = ttInt * 1000;
      } else if (unit === "ms") {
        ft_variables._transitionTime = ttInt;
      }
    }
    _setTransitionTime(ft_variables._transitionTime);
    ft_variables._momentumScrollDelay = ft_variables._transitionTime * 4;
  })();

  /**
   * test the base support
   */
  var browserSupport = true;
  try {
    var htmlClass = document.querySelector("html").className.toLowerCase();
    if (htmlClass.indexOf("ie7") != -1 || htmlClass.indexOf("ie8") != -1 || htmlClass.indexOf("lt-ie9") != -1 ) {
      browserSupport = false;
    }
  } catch(e) {
    browserSupport = false;
  }

  /**
   * add "ft-absolute-nav" hook class to body
   * to set the CSS properties
   * needed for application scrolling
   */
  if (browserSupport) {
    Brav1Toolbox.addClass(ft_variables.ftParent, "ft-absolute-nav");
  }

  // NAVIGATION MATRIX

  NavigationMatrix = NavigationMatrix();

  window.onload = function() {
    NavigationMatrix.updateOffsets();
  }


/*
  ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ##    ######## ##     ## ######## ##    ## ########  ######
  ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ##    ##       ##     ## ##       ###   ##    ##    ##    ##
  ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ##    ##       ##     ## ##       ####  ##    ##    ##
  ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ##    ######   ##     ## ######   ## ## ##    ##     ######
  ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  ####    ##        ##   ##  ##       ##  ####    ##          ##
  ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ###    ##         ## ##   ##       ##   ###    ##    ##    ##
  ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ##    ########    ###    ######## ##    ##    ##     ######
*/
  /**
   * add a listener for event delegation
   * used for navigation purposes
   */
  if (browserSupport) {
    if (ft_variables.isTouchDevice) {
      Brav1Toolbox.addListener(document, "touchend", function(e) {
        // e.preventDefault(); // TODO FIX
        onNavClick(e);
      }, false);
    }
    Brav1Toolbox.addListener(document, "click", onNavClick, false);
  }

  function onNavClick(e) {
    if (ft_variables._areLinksActive) {
      if (e.target.nodeName === "A" || e.target.parentNode.nodeName === "A") {
        var href = e.target.getAttribute("href") || e.target.parentNode.getAttribute("href");
        if (href === "#") {
          e.preventDefault();
          return;
        }
        // links with href starting with #
        if (href) {
          e.target.blur();
          if (href.substr(0,1) == "#") {
            e.preventDefault();
            var dest = NavigationMatrix.setPage(href);
            navigateTo(dest, true, true);
          }
        }
      }
      // pages in oveview mode
      if (ft_variables._isOverview) {
        var dest = e.target;
        while (dest && !Brav1Toolbox.hasClass(dest, ft_constants.PAGE_CLASS)) {
          dest = dest.parentNode;
        }
        if (Brav1Toolbox.hasClass(dest, ft_constants.PAGE_CLASS)) {
          e.preventDefault();
          navigateTo(dest, null, true);
        }
      }
      // thumbs in the default progress indicator
      if (Brav1Toolbox.hasClass(e.target, ft_constants.PAGE_THUMB_CLASS)) {
        e.preventDefault();
        var pTo = Number(unsafeAttr(e.target.getAttribute("data-section")));
        var spTo = Number(unsafeAttr(e.target.getAttribute("data-page")));
        _gotoPage(pTo, spTo);
      }
    }
  }

  /**
   * set callback for onpopstate event
   * uses native history API to manage navigation
   * but uses the # for client side navigation on return
   */
  if (ft_variables.useHash == false && window.history.pushState) {
    window.onpopstate = onPopState;
  }
  else {
    ft_variables.useHash = true;
  }
  //
  function onPopState(e) {
    ft_variables.useHash = false;
    var h;
    if (e.state) {
      h = e.state.token.replace("#/", "");
    } else {
      h = document.location.hash.replace("#/", "");
    }
    var dest = NavigationMatrix.setPage(h);
    navigateTo(dest, false);
  }

  /**
   * set callback for hashchange event
   * this callback is used not only when onpopstate event wasn't available
   * but also when the user resize the window or for the firs visit on the site
   */
  Brav1Toolbox.addListener(window, "hashchange", onHashChange);
  //
  /**
   * @param e Event the hashChange Event
   * @param d Boolean force the hash change
   */
  function onHashChange(e, d) {
    if (ft_variables.useHash || d) {
      var h = document.location.hash.replace("#/", "");
      var dest = NavigationMatrix.setPage(h);
      navigateTo(dest, false);
    }
  }

/*
  ##     ##  #######  ##     ##  ######  ######## ########  ########     ###     ######
  ###   ### ##     ## ##     ## ##    ## ##       ##     ## ##     ##   ## ##   ##    ##
  #### #### ##     ## ##     ## ##       ##       ##     ## ##     ##  ##   ##  ##
  ## ### ## ##     ## ##     ##  ######  ######   ##     ## ########  ##     ## ##   ####
  ##     ## ##     ## ##     ##       ## ##       ##     ## ##   ##   ######### ##    ##
  ##     ## ##     ## ##     ## ##    ## ##       ##     ## ##    ##  ##     ## ##    ##
  ##     ##  #######   #######   ######  ######## ########  ##     ## ##     ##  ######
*/

  function _setMouseDrag(value) {
    ft_variables._mouseDragEnabled = value;
    if (ft_variables._mouseDragEnabled) {
      Brav1Toolbox.addListener(ft_variables.ftContainer, "mousedown", onTouchStart, false);
      Brav1Toolbox.addListener(ft_variables.ftContainer, "mouseup", onTouchEnd, false);
    } else {
      Brav1Toolbox.removeListener(ft_variables.ftContainer, "mousedown", onTouchStart);
      Brav1Toolbox.removeListener(ft_variables.ftContainer, "mouseup", onTouchEnd);
    }
  }

/*
  ########  #######  ##     ##  ######  ##     ##
     ##    ##     ## ##     ## ##    ## ##     ##
     ##    ##     ## ##     ## ##       ##     ##
     ##    ##     ## ##     ## ##       #########
     ##    ##     ## ##     ## ##       ##     ##
     ##    ##     ## ##     ## ##    ## ##     ##
     ##     #######   #######   ######  ##     ##
*/

  var _ftX = ft_variables.ftContainer.offsetX;
  var _ftY = 0;
  var _touchStartX = 0;
  var _touchStartY = 0;
  var _deltaX = 0;
  var _deltaY = 0;
  var _dragging = 0;
  var _dragAxis = "x";
  var _swipeLimit = 100;

  if (ft_variables.isTouchDevice) {
    ft_variables.ftContainer.addEventListener("touchstart", onTouchStart, false);
    ft_variables.ftContainer.addEventListener("touchmove",  onTouchMove, false);
    ft_variables.ftContainer.addEventListener("touchend",   onTouchEnd, false);
  }

  function onTouchStart(e) {
    _deltaX = 0;
    _deltaY = 0;
    //e.preventDefault(); // preventing the defaul event behaviour breaks external links
    e = getTouchEvent(e);
    _touchStartX = e.clientX;
    _touchStartY = e.clientY;
    _dragging = 1;
    var initOffset = getInitOffset();
    _ftX = initOffset.x;
    _ftY = initOffset.y;
    if (ft_variables._mouseDragEnabled) {
      Brav1Toolbox.addListener(ft_variables.ftContainer, "mousemove", onTouchMove, false);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    e = getTouchEvent(e);
    _deltaX = e.clientX - _touchStartX;
    _deltaY = e.clientY - _touchStartY;
  }

  function onTouchEnd(e) {
    if (ft_variables._isTouchActive) {
      if (Math.abs(_deltaX) >= _swipeLimit || Math.abs(_deltaY) >= _swipeLimit) {
        e = getTouchEvent(e);
        _dragging = 0;
        _dragAxis = Math.abs(_deltaX) >= Math.abs(_deltaY) ? "x" : "y";
        if (_dragAxis == "x" && Math.abs(_deltaX) >= _swipeLimit) {
          if (_deltaX > 0) {
            if (ft_variables._crossDirection === true) {
              _prevPage();
            } else {
              _prevSection(undefined, false);
            }
            return;
          } else if (_deltaX < 0) {
            if (ft_variables._crossDirection === true) {
              _nextPage();
            } else {
              _nextSection(undefined, false);
            }
            return;
          }
        }
        else {
          if (_deltaY > 0 && Math.abs(_deltaY) >= _swipeLimit) {
            if (ft_variables._crossDirection === true) {
              _prevSection(undefined, false);
            } else {
              _prevPage();
            }
            return;
          } else if (_deltaY < 0) {
            if (ft_variables._crossDirection === true) {
              _nextSection(undefined, false);
            } else {
              _nextPage();
            }
            return;
          }
        }
      }
    }
    Brav1Toolbox.removeListener(ft_variables.ftContainer, "mousemove", onTouchMove);
  }

  function getTouchEvent(e) {
    if (e.touches) {
        e = e.touches[0];
      }
      return e;
    }

    function getInitOffset() {
      var off = ft_variables.ftContainer.style[ft_variables._transformProperty];
      // X
      var indexX = off.indexOf("translateX(") + 11;
      var offX = off.substring(indexX, off.indexOf(")", indexX));
      if (offX.indexOf("%") != -1) {
        offX = offX.replace("%", "");
        offX = (parseInt(offX) / 100) * window.innerWidth;
      } else if (offX.indexOf("px") != -1) {
        offX = parseInt(offX.replace("px", ""));
      }
      // Y
      var indexY = off.indexOf("translateY(") + 11;
      var offY = off.substring(indexY, off.indexOf(")", indexY));
      if (offY.indexOf("%") != -1) {
        offY = offY.replace("%", "");
        offY = (parseInt(offY) / 100) * window.innerHeight;
      } else if (offY.indexOf("px") != -1) {
        offY = parseInt(offY.replace("px", ""));
      }
      return { x:offX, y:offY };
    }

/*
   ######   ######  ########   #######  ##       ##
  ##    ## ##    ## ##     ## ##     ## ##       ##
  ##       ##       ##     ## ##     ## ##       ##
   ######  ##       ########  ##     ## ##       ##
        ## ##       ##   ##   ##     ## ##       ##
  ##    ## ##    ## ##    ##  ##     ## ##       ##
   ######   ######  ##     ##  #######  ######## ########
*/

  /**
   * native scroll management
   */
  Brav1Toolbox.addListener(window, "scroll", onNativeScroll);

  function onNativeScroll(e) {
    e.preventDefault();
    resetScroll();
  }

  /**
   * Mouse Wheel Scroll Navigation
   */
  addWheelListener(ft_variables.ftContainer, onMouseScroll);

  var scrollTimeout = NaN;

  function onMouseScroll(e) {
    var t = e.target;
    ft_variables._isScrollable = checkIfScrollable(t);
    var _isScrollActiveTemp = ft_variables._isScrollable === true ? false : ft_variables._isScrollActive;
    if (ft_variables._isScrolling === false && _isScrollActiveTemp === true) {
      //e.preventDefault();
      doScrollOnce(e);
    }
  }

  function checkIfScrollable(element) {
    var isScrollable = false
    var el = element;
    while (el.className && el.className.indexOf("ft-page") < 0) {
      if (el.scrollHeight > el.clientHeight - 1) {
        isScrollable = true;
      }
      el = el.parentNode;
    }
    if (el.className.indexOf("ft-page") != -1 && el.scrollHeight > el.clientHeight - 1) {
      isScrollable = true;
    }
    if (isScrollable === true) {
      if (el.scrollHeight - el.scrollTop === el.clientHeight || (el.scrollTop === 0 && el.alreadyScrolled && el.alreadyScrolled === true)) {
        isScrollable = false;
      }
      el.alreadyScrolled = true;
    }
    return isScrollable;
  }

  function enableMomentumScroll() {
    clearTimeout(ft_variables._momentumScrollTimeout);
    ft_variables._isScrolling = false;
  }

  function disableMomentumScroll() {
    ft_variables._momentumScrollTimeout = setTimeout(enableMomentumScroll, ft_variables._momentumScrollDelay);
  }

  function doScrollOnce(e) {
    //
    ft_variables._isScrolling = true;
    disableMomentumScroll();
    //
    if (e.deltaY == 0) {
      if (e.deltaX > 0) {
        if (ft_variables._crossDirection === true) {
          _nextPage();
        } else {
          _nextSection(undefined, e.shiftKey);
        }
      } else if (e.deltaX < 0) {
        if (ft_variables._crossDirection === true) {
          _prevPage();
        } else {
          _prevSection(undefined, e.shiftKey);
        }
      }
    } else {
      if (e.deltaY > 0) {
        if (ft_variables._crossDirection === true) {
          _nextSection(undefined, e.shiftKey);
        } else {
          _nextPage();
        }
      } else if (e.deltaY < 0) {
        if (ft_variables._crossDirection === true) {
          _prevSection(undefined, e.shiftKey);
        } else {
          _prevPage();
        }
      }
    }
  }

/*
  ########  ########  ######  #### ######## ########
  ##     ## ##       ##    ##  ##       ##  ##
  ##     ## ##       ##        ##      ##   ##
  ########  ######    ######   ##     ##    ######
  ##   ##   ##             ##  ##    ##     ##
  ##    ##  ##       ##    ##  ##   ##      ##
  ##     ## ########  ######  #### ######## ########
*/

  /**
   * monitoring function that triggers hashChange when resizing window
   */
  var resizeMonitor = (function _resizeMonitor() {
    var ticker = NaN;
    function _enable() {
      _disable();
      if (!ft_variables._isOverview) {
        ticker = setTimeout(doResizeHandler, 300);
      }
    }

    function _disable() {
      clearTimeout(ticker);
    }

    function doResizeHandler() {
      NavigationMatrix.updateOffsets();
      navigateTo();
    }

    Brav1Toolbox.addListener(window, "resize", _enable);
    window.addEventListener("orientationchange", _enable, false);

    return {
      enable: _enable,
      disable: _disable
    }
  })();



/*
##     ## ########  ########     ###    ######## ########    ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ##
##     ## ##     ## ##     ##   ## ##      ##    ##          ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ##
##     ## ##     ## ##     ##  ##   ##     ##    ##          ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ##
##     ## ########  ##     ## ##     ##    ##    ######      ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ##
##     ## ##        ##     ## #########    ##    ##          ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  ####
##     ## ##        ##     ## ##     ##    ##    ##          ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ###
 #######  ##        ########  ##     ##    ##    ########    ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ##
*/

  /**
   * public method to force navigation updates
   */
  function _updateNavigation(fireEvent) {
    ft_variables._fireEvent = fireEvent === false ? false : true;
    var currentPagePreUpdate = NavigationMatrix.getCurrentPage();
    NavigationMatrix.update();
    //
    navigateTo(currentPagePreUpdate, false, false, false);
    if (ft_variables._showProgress === true) {
      buildProgressIndicator();
    }
  }

  /**
   * builds and sets the title of the document parsing the attributes of the current section
   * if a data-title is available in a page and or in a section then it will be used
   * otherwise it will be used a formatted version of the hash string
   */
  function setTitle(h) {
    var t = ft_variables.siteName;
    var ht = NavigationMatrix.getCurrentPage().getAttribute("data-title");
    if (ht == null) {
      var hs = h.split("/");
      for (var i = 0; i < hs.length; i++) {
        t += " | " + hs[i];
      }
    } else {
      if (NavigationMatrix.getCurrentSection().getAttribute("data-title") != null) {
        t += " | " + NavigationMatrix.getCurrentSection().getAttribute("data-title");
      }
      t += " | " + ht
    }
    document.title = t;
  }



/*
  ##    ##    ###    ##     ## ####  ######      ###    ######## ######## ########  #######
  ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##    ##          ##    ##     ##
  ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##    ##          ##    ##     ##
  ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##    ######      ##    ##     ##
  ##  #### #########  ##   ##   ##  ##    ##  #########    ##    ##          ##    ##     ##
  ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##    ##          ##    ##     ##
  ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ########    ##     #######
*/

  /**
   * navigation transition logic
   * @param dest HTMLElement  the page to go to
   * @param push Boolean if true the hash string were pushed to the history API
   * @param linked Boolean if true triggers a forced update of all the fragments in the pages, used when navigating from links or overview
   * @param withTransitions Boolean if false disables the transition during the current navigation, then reset the transitions
   */
  function navigateTo(dest, push, linked, withTransitions) {
    push = push == false ? push : true;
    // if dest doesn't exist then go to homepage
    if (!dest) {
      if (NavigationMatrix.getCurrentPage() != null) {
        dest = NavigationMatrix.getCurrentPage();
      } else {
        dest = document.querySelector(ft_constants.PAGE_SELECTOR);
      }
      push = true;
    }
    // checks what properties use for navigation and set the style
    if (withTransitions === false) {
      _pauseTransitions();
    } else if (ft_variables._transitionPaused === true) {
      _restoreTransitions();
    }
    navigate(dest);
    if (ft_variables._transitionPaused === true) {
      _restoreTransitions(true);
    }
    //
    moveParallax(dest);
    //
    if (ft_variables._isOverview) {
      _toggleOverview(false, false);
    }
    //
    var h = NavigationMatrix.getHash(dest);
    if (linked === true) {
      NavigationMatrix.updateFragments();
    }
    // set history properties
    var pageIndex = NavigationMatrix.getPageIndex(dest);
    if (ft_variables.pastIndex.section != pageIndex.section || ft_variables.pastIndex.page != pageIndex.page) {
      if (pushHistory != null && push != false && NavigationMatrix.getCurrentFragmentIndex() == -1) {
        var stateObj = { token: h };
        var nextHash = "#/" + h;
        ft_variables.currentHash = nextHash;
        try {
          window.history.pushState(stateObj, null, ft_variables.currentHash);
        } catch (error) {
          if (ft_variables._showErrors === true) {
            console.log(error);
          }
        }
      } else {
        document.location.hash = "/" + h;
      }
    }
    // set the title
    setTitle(h);
    //

    // store the status of the section, the last page visited in the section
    ft_variables._sectionsStatus[pageIndex.section] = pageIndex.page;

    // store the last page index visited using up or down only if the section have the same number of pages or more
    if (ft_variables.pastIndex.section === pageIndex.section && ft_variables.pastIndex.page !== pageIndex.page) {
      ft_variables._sectionsLastPageDepth = pageIndex.page;
    }

    // dispatches an event populated with navigation data
    fireNavigationEvent();
    // cache the section and page index, useful to determine the direction of the next navigation
    ft_variables.pastIndex = pageIndex;
    NavigationMatrix.switchActivePage(dest, true);
    //
    if (ft_variables._showProgress) {
      updateProgress();
    }

  }

  /**
   * fires the navigation event and, if exists, call the navigation callback
   */
  function fireNavigationEvent() {
    if (ft_variables._fireEvent !== false) {
      var pageIndex = NavigationMatrix.getPageIndex();
      var eventData = {
                        section          : NavigationMatrix.getCurrentSection(),
                        page             : NavigationMatrix.getCurrentPage(),
                        sectionIndex     : pageIndex.section,
                        pageIndex        : pageIndex.page,
                        pastSectionIndex : ft_variables.pastIndex.section,
                        pastPageIndex    : ft_variables.pastIndex.page,
                        prevSection      : NavigationMatrix.hasPrevSection(),
                        nextSection      : NavigationMatrix.hasNextSection(),
                        prevPage         : NavigationMatrix.hasPrevPage(),
                        nextPage         : NavigationMatrix.hasNextPage(),
                        fragment         : NavigationMatrix.getCurrentFragment(),
                        fragmentIndex    : NavigationMatrix.getCurrentFragmentIndex(),
                        isOverview       : ft_variables._isOverview,
                        progress         : NavigationMatrix.getProgress(),
                        total            : NavigationMatrix.getPagesTotalLength(),
                        isLoopable       : ft_variables._isLoopable,
                        clickerMode      : ft_variables._clickerMode,
                        isAutoplay       : _isAutoplay
                      }
      Brav1Toolbox.dispatchEvent(ft_constants.NAVIGATION_EVENT, eventData);
      //
      if (ft_variables._navigationCallback !== undefined) {
        ft_variables._navigationCallback(eventData);
      }
    } else {
      ft_variables._fireEvent = true;
    }
  }

/*
##    ##    ###    ##     ## ####  ######      ###    ######## ########
###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##    ##
####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##    ##
## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##    ######
##  #### #########  ##   ##   ##  ##    ##  #########    ##    ##
##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##    ##
##    ## ##     ##    ###    ####  ######   ##     ##    ##    ########
*/

  /**
   * check the availability of transform CSS property
   * if transform is not available then fallbacks to position absolute behaviour
   */
  function navigate(dest) {
    var x;
    var y;
    var pageIndex = NavigationMatrix.getPageIndex(dest);
    if (ft_variables._slideInPx === true) {
      // calculate the coordinates of the destination
      x = dest.x;
      y = dest.y;
    } else {
      // calculate the index of the destination page
      if (ft_variables._crossDirection === true) {
        y = pageIndex.section;
        x = pageIndex.page;
      } else {
        x = pageIndex.section;
        y = pageIndex.page;
      }
    }
    if (ft_variables._scrollTheSection === true) {
      var sectionDest = dest.parentNode;
      var outside = ft_variables.ftContainer;
      var inside = sectionDest;
      if (ft_variables._crossDirection === true) {
        outside = sectionDest;
        inside = ft_variables.ftContainer;
      }
      if (ft_variables._supportsTransform) {
        //
        if (ft_variables._slideInPx) {
          outside.style[ft_variables._transformProperty] = "translateX(" + (-x) + "px)";
        } else {
          outside.style[ft_variables._transformProperty] = "translateX(" + -x * 100 + "%)";
        }
        if (ft_variables._slideInPx) {
          inside.style[ft_variables._transformProperty] = "translateY(" + (-y) + "px)";
        } else {
          inside.style[ft_variables._transformProperty] = "translateY(" + (-y) * 100 + "%)";
        }
      } else {
        if (ft_variables._slideInPx) {
          outside.style.left = (x) + "px";
        } else {
          outside.style.left = -x * 100 + "%";
        }
        if (ft_variables._slideInPx) {
          inside.style.top = (y) + "px";
        } else {
          inside.style.top = -y * 100 + "%";
        }
      }
    } else {
      if (ft_variables._supportsTransform) {
        if (ft_variables._slideInPx) {
          ft_variables.ftContainer.style[ft_variables._transformProperty] = "translateX(" + (-x) + "px) translateY(" + (-y) + "px)";
        } else {
          ft_variables.ftContainer.style[ft_variables._transformProperty] = "translateX(" + (-x) * 100 + "%) translateY(" + (-y) * 100 + "%)";
        }
      } else {
        if (ft_variables._slideInPx) {
          ft_variables.ftContainer.style.top = (-y) + "px";
          ft_variables.ftContainer.style.left = (-x) + "px";
        } else {
          ft_variables.ftContainer.style.top = (-y) * 100 + "%";
          ft_variables.ftContainer.style.left = (-x) * 100 + "%";
        }
      }
    }
    resetScroll();
  }

  function moveParallax(dest) {
    if (ft_variables._parallaxEnabled) {
      var pageIndex = NavigationMatrix.getPageIndex(dest);
      //
      var pxElements = NavigationMatrix.getParallaxElements();
      for (var i = 0; i < pxElements.length; i++) {
        var pxSection = pxElements[i];
        if (pxSection != undefined) {
          for (var ii = 0; ii < pxSection.length; ii++) {
            var pxPage = pxSection[ii];
            if (pxPage != undefined) {
              for (var iii = 0; iii < pxPage.length; iii++) {
                var pxElement = pxPage[iii]
                var pX = 0;
                var pY = 0;
                // sections
                if (pageIndex.section < i) {
                  pX = pxElement.pX;
                } else if (pageIndex.section > i) {
                  pX = -pxElement.pX;
                }
                // pages
                if (pageIndex.page < ii) {
                  pY = pxElement.pY;
                } else if (pageIndex.page > ii) {
                  pY = -pxElement.pY;
                }
                // animation
                var unit = "%";
                if (ft_variables._parallaxInPx) {
                  unit = "px";
                }
                if (ft_variables._crossDirection === true) {
                  pxElement.style[ft_variables._transformProperty] = "translateX(" + pY + unit + ") translateY(" + pX + unit + ")";
                } else {
                  pxElement.style[ft_variables._transformProperty] = "translateX(" + pX + unit + ") translateY(" + pY + unit + ")";
                }
              }
            }
          }
        }
      }
    }
  }


/*
  ########  ########   #######   ######   ########  ########  ######   ######
  ##     ## ##     ## ##     ## ##    ##  ##     ## ##       ##    ## ##    ##
  ##     ## ##     ## ##     ## ##        ##     ## ##       ##       ##
  ########  ########  ##     ## ##   #### ########  ######    ######   ######
  ##        ##   ##   ##     ## ##    ##  ##   ##   ##             ##       ##
  ##        ##    ##  ##     ## ##    ##  ##    ##  ##       ##    ## ##    ##
  ##        ##     ##  #######   ######   ##     ## ########  ######   ######
*/
  ft_variables.defaultProgress = null;
  var progressFill = null;

  function buildProgressIndicator() {
    if (ft_variables.defaultProgress) {
      ft_variables.defaultProgress.parentNode.removeChild(ft_variables.defaultProgress);
    }
    var domFragment = document.createDocumentFragment();
    // create the progress container div
    ft_variables.defaultProgress = document.createElement("div");
    ft_variables.defaultProgress.className = ft_constants.DEFAULT_PROGRESS_CLASS + (ft_variables._crossDirection === true ? " ft-cross" : "");
    domFragment.appendChild(ft_variables.defaultProgress);
    // loop through sections
    for (var i = 0; i < NavigationMatrix.getSectionsLength(); i++) {
      var pDiv = document.createElement("div");
        pDiv.setAttribute("data-section", "__" + i);
        pDiv.className = ft_constants.SECTION_THUMB_CLASS;
        Brav1Toolbox.addClass(pDiv, "thumb-section-" + i);
      // loop through pages
      var spArray = NavigationMatrix.getPages(i)
      for (var ii = 0; ii < spArray.length; ii++) {
        var spDiv = document.createElement("div");
          spDiv.className = ft_constants.PAGE_THUMB_CLASS;
          spDiv.setAttribute("data-section", "__" + i);
          spDiv.setAttribute("data-page", "__" + ii);
          Brav1Toolbox.addClass(spDiv, "thumb-page-" + ii);
          pDiv.appendChild(spDiv);
      };
      ft_variables.defaultProgress.appendChild(pDiv);
    };
    ft_variables.body.appendChild(ft_variables.defaultProgress);
    updateProgress();
  }

  function hideProgressIndicator() {
    if (ft_variables.defaultProgress != null) {
      ft_variables.body.removeChild(ft_variables.defaultProgress);
      ft_variables.defaultProgress = null;
    }
  }

  function updateProgress() {
    if (ft_variables.defaultProgress != null) {
      var spts = ft_variables.defaultProgress.querySelectorAll(ft_constants.PAGE_THUMB_SELECTOR);
      for (var i = 0; i < spts.length; i++) {
        var spt = spts[i];
        var pTo = Number(unsafeAttr(spt.getAttribute("data-section")));
        var spTo = Number(unsafeAttr(spt.getAttribute("data-page")));
        if (pTo == NavigationMatrix.getPageIndex().section && spTo == NavigationMatrix.getPageIndex().page) {
          Brav1Toolbox.addClass(spts[i], "actual");
        } else {
          Brav1Toolbox.removeClass(spts[i], "actual");
        }
      }

    }
  }

  function _getDefaultProgress() {
    return ft_variables.defaultProgress;
  }

/*
   #######  ##     ## ######## ########  ##     ## #### ######## ##      ##    ##     ##    ###    ##    ##    ###     ######   ######## ##     ## ######## ##    ## ########
  ##     ## ##     ## ##       ##     ## ##     ##  ##  ##       ##  ##  ##    ###   ###   ## ##   ###   ##   ## ##   ##    ##  ##       ###   ### ##       ###   ##    ##
  ##     ## ##     ## ##       ##     ## ##     ##  ##  ##       ##  ##  ##    #### ####  ##   ##  ####  ##  ##   ##  ##        ##       #### #### ##       ####  ##    ##
  ##     ## ##     ## ######   ########  ##     ##  ##  ######   ##  ##  ##    ## ### ## ##     ## ## ## ## ##     ## ##   #### ######   ## ### ## ######   ## ## ##    ##
  ##     ##  ##   ##  ##       ##   ##    ##   ##   ##  ##       ##  ##  ##    ##     ## ######### ##  #### ######### ##    ##  ##       ##     ## ##       ##  ####    ##
  ##     ##   ## ##   ##       ##    ##    ## ##    ##  ##       ##  ##  ##    ##     ## ##     ## ##   ### ##     ## ##    ##  ##       ##     ## ##       ##   ###    ##
   #######     ###    ######## ##     ##    ###    #### ########  ###  ###     ##     ## ##     ## ##    ## ##     ##  ######   ######## ##     ## ######## ##    ##    ##
*/

  /**
   * switch from the overview states
   */
  function _toggleOverview(back, navigate) {
    if (ft_variables._isOverview) {
      zoomIn(back, navigate);
    } else {
      ft_variables.overviewCachedDest = NavigationMatrix.getCurrentPage();
      zoomOut();
    }
  }

  /**
   * set the overview state to the given value
   */
  function _setShowOverview(v, back, navigate) {
    if (ft_variables._isOverview === v) {
      return;
    }
    ft_variables._isOverview = !v;
    _toggleOverview(back, navigate);
  }

  /**
   * zoom in the view to focus on the current section / page
   */
  function zoomIn(back, navigate) {
    ft_variables._isOverview = false;
    Brav1Toolbox.removeClass(ft_variables.body, "ft-overview");
    NavigationMatrix.hideFragments();
    navigate = navigate === false ? false : true;
    if (navigate == true) {
      if (back == true) {
        navigateTo(ft_variables.overviewCachedDest);
      } else {
        navigateTo();
      }
    }
  }

  /**
   * zoom out the view for an overview of all the sections / pages
   */
  function zoomOut() {
    ft_variables._isOverview = true;
    Brav1Toolbox.addClass(ft_variables.body, "ft-overview");
    NavigationMatrix.showFragments();
    //
    if (ft_variables._useOverviewVariant == false) {
      overviewZoomTypeA(true);
    } else {
      overviewZoomTypeB(true);
    }
    fireNavigationEvent();
  }

  function overviewZoomTypeA(out) {
    // ft_variables.ftContainer scale version
    if (out) {
      if (ft_variables._crossDirection === true) {
        var scaleY = 100 / NavigationMatrix.getSectionsLength();
        var scaleX = 100 / NavigationMatrix.getPagesLength();
      } else {
        var scaleX = 100 / NavigationMatrix.getSectionsLength();
        var scaleY = 100 / NavigationMatrix.getPagesLength();
      }
      //
      var scale = Math.min(scaleX, scaleY) * 0.9;
      var offsetX = (100 - NavigationMatrix.getSectionsLength() * scale) / 2;
      var offsetY = (100 - NavigationMatrix.getPagesLength() * scale) / 2;
      //
      ft_variables.ftContainer.style[ft_variables._transformProperty] = "translate(" + offsetX + "%, " + offsetY + "%) scale(" + scale/100 + ", " + scale/100 + ")";
    }
  }

  function overviewZoomTypeB(out) {
    // ft_variables.ftContainer scale alternative version
    if (out) {
      var scale = ft_variables.overviewFixedScaleFactor // Math.min(scaleX, scaleY) * 0.9;
      var pIndex = NavigationMatrix.getPageIndex();
      //
      if (ft_variables._crossDirection === true) {
        var offsetY = 50 - (scale * pIndex.section) - (scale / 2);
        var offsetX = 50 - (scale * pIndex.page) - (scale / 2);
      } else {
        var offsetX = 50 - (scale * pIndex.section) - (scale / 2);
        var offsetY = 50 - (scale * pIndex.page) - (scale / 2);
      }
      //
      ft_variables.ftContainer.style[ft_variables._transformProperty] = "translate(" + offsetX + "%, " + offsetY + "%) scale(" + scale/100 + ", " + scale/100 + ")";
    }
  }

/*
  ##    ## ######## ##    ## ########   #######     ###    ########  ########     ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ##
  ##   ##  ##        ##  ##  ##     ## ##     ##   ## ##   ##     ## ##     ##    ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ##
  ##  ##   ##         ####   ##     ## ##     ##  ##   ##  ##     ## ##     ##    ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ##
  #####    ######      ##    ########  ##     ## ##     ## ########  ##     ##    ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ##
  ##  ##   ##          ##    ##     ## ##     ## ######### ##   ##   ##     ##    ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  ####
  ##   ##  ##          ##    ##     ## ##     ## ##     ## ##    ##  ##     ##    ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ###
  ##    ## ########    ##    ########   #######  ##     ## ##     ## ########     ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ##
*/

  /**
   * KEYBOARD NAVIGATION
   */
  Brav1Toolbox.addListener(window, "keydown", onKeyDown);
  Brav1Toolbox.addListener(window, "keyup", onKeyUp);

  function onKeyDown(e) {
    var tag = e.target.tagName;
    if (tag != "INPUT" && tag != "TEXTAREA" && tag != "SELECT") {
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
      }
    }
  }

  function onKeyUp(e) {
    if (ft_variables._isKeyboardActive) {
      var tag = e.target.tagName;
      var elem;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        switch (e.keyCode) {
          case 27 : // esc
            _toggleOverview(true);
            break;
          case 33 : // pag up
            if (ft_variables._clickerMode) {
              _prevPage(e.shiftKey);
            } else {
              _gotoTop();
            }
            break;
          case 34 : // pag down
            if (ft_variables._clickerMode) {
              _nextPage(e.shiftKey);
            } else {
              _gotoBottom();
            }
            break;
          case 35 : // end
            _gotoEnd();
            break;
          case 36 : // home
            _gotoHome();
            break;
          case 37 : // left
            if (ft_variables._crossDirection === true) {
              _prevPage(e.shiftKey);
            } else {
              _prevSection(null, e.shiftKey);
            }
            break;
          case 39 : // right
            if (ft_variables._crossDirection === true) {
              _nextPage(e.shiftKey);
            } else {
              _nextSection(null, e.shiftKey);
            }
            break;
          case 38 : // up
            if (ft_variables._crossDirection === true) {
              _prevSection(null, e.shiftKey);
            } else {
              _prevPage(e.shiftKey);
            }
            break;
          case 40 : // down
            if (ft_variables._crossDirection === true) {
              _nextSection(null, e.shiftKey);
            } else {
              _nextPage(e.shiftKey);
            }
            break;
          case 13 : // return
            if (ft_variables._isOverview) {
              _gotoPage(NavigationMatrix.getCurrentHilited());
            }
            break;
          default :
            break;
        }
      }
    }
  }

/**
     ###    ##     ## ########  #######  ########  ##          ###    ##    ##
    ## ##   ##     ##    ##    ##     ## ##     ## ##         ## ##    ##  ##
   ##   ##  ##     ##    ##    ##     ## ##     ## ##        ##   ##    ####
  ##     ## ##     ##    ##    ##     ## ########  ##       ##     ##    ##
  ######### ##     ##    ##    ##     ## ##        ##       #########    ##
  ##     ## ##     ##    ##    ##     ## ##        ##       ##     ##    ##
  ##     ##  #######     ##     #######  ##        ######## ##     ##    ##
*/
  var _isAutoplay = false;
  var autoplayTimer = 0;
  var autoplayDelay = 10000;
  var autoplaySkipFragments = false;
  var autoplayTimerStartedAt = 0;
  var autoplayTimerPausedAt = 0;
  /**
   * sets the autoplay status
   * @param status  Boolean if true configure the presentation for auto playing
   * @param   delay   Number sets the delay for the autoplay timeout in milliseconds (default 10 seconds)
   * @param   autostart   Boolean if true the autoplay starts right now (default true)
   * @param   skipFragments   Boolean if true goes to the next page skipping all the fragments (default false)
   */
  function _autoplay(status, delay, autostart, skipFragments) {
    autoplayDelay = isNaN(parseInt(delay)) ? autoplayDelay : delay;
    autoplaySkipFragments = skipFragments === true || false
    if (status == true && autostart !== false) {
      _play();
    }
  }

  function _play() {
    _isAutoplay = true;
    clearTimeout(autoplayTimer);
    autoplayTimerStartedAt = Date.now();
    autoplayTimer = setTimeout(function(){
      _nextPage(autoplaySkipFragments);
      _play();
    }, autoplayDelay - autoplayTimerPausedAt);
    autoplayTimerPausedAt = 0;
  }

  function _pause() {
    _isAutoplay = false;
    autoplayTimerPausedAt = Date.now() - autoplayTimerStartedAt;
    clearTimeout(autoplayTimer);
  }

  function _stop() {
    _isAutoplay = false;
    clearTimeout(autoplayTimer);
    autoplayTimerStartedAt = 0;
    autoplayTimerPausedAt = 0;
  }

/*
  ########  ##     ## ########  ##       ####  ######        ###    ########  ####
  ##     ## ##     ## ##     ## ##        ##  ##    ##      ## ##   ##     ##  ##
  ##     ## ##     ## ##     ## ##        ##  ##           ##   ##  ##     ##  ##
  ########  ##     ## ########  ##        ##  ##          ##     ## ########   ##
  ##        ##     ## ##     ## ##        ##  ##          ######### ##         ##
  ##        ##     ## ##     ## ##        ##  ##    ##    ##     ## ##         ##
  ##         #######  ########  ######## ####  ######     ##     ## ##        ####
*/


  /**
   * triggers the first animation when visiting the site
   * if the hash is not empty
   */
  function _start() {
    // init and configuration
    if (ft_variables._showProgress && ft_variables.defaultProgress == null) {
      buildProgressIndicator();
    }
    // start navigation
    if (document.location.hash.length > 0) {
      _pauseTransitions(true);
      onHashChange(null, true);
    } else {
      if (_start.arguments.length > 0) {
        _gotoPage.apply(this, _start.arguments);
      } else {
        _gotoPage(0,0);
        updateProgress();
      }
    }
  }

  function _pauseTransitions(restoreAfter) {
    ft_variables._transitionPaused = true;
    ft_variables.ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "0ms";
    if (restoreAfter === true) {
      setTimeout(_restoreTransitions, ft_variables._transitionTime);
    }
  }

  function _restoreTransitions(withTransitionDelay) {
    ft_variables._transitionPaused = false;
    if (withTransitionDelay === true) {
      setTimeout(function() {
        ft_variables.ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "" + ft_variables._transitionTime / 1000 + "s";
      }, ft_variables._transitionTime);
    } else {
      ft_variables.ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "" + ft_variables._transitionTime / 1000 + "s";
    }

  }

  /*
   * Public API to go to the next section
   * @param top Boolean if true the next section will be the first page in the next array; if false the next section will be the same index page in the next array
   */
  function _nextSection(top, alternate) {
    top = top != undefined ? top : ft_variables._gridNavigation;
    if (alternate === true) {
      top = !ft_variables._gridNavigation;
    }
    var d = NavigationMatrix.getNextSection(top, ft_variables._fragmentsOnSide);
    if (d != undefined) {
      navigateTo(d);
    } else {
      if (ft_variables._isOverview && ft_variables._useOverviewVariant) {
        zoomOut();
      }
    }
  }

  /*
   * Public API to go to the prev section
   *
   */
  function _prevSection(top, alternate) {
    top = top != undefined ? top : ft_variables._gridNavigation;
    if (alternate === true) {
      top = !ft_variables._gridNavigation;
    }
    var d = NavigationMatrix.getPrevSection(top, ft_variables._fragmentsOnSide);
    if (d != undefined) {
      navigateTo(d);
    } else {
      if (ft_variables._isOverview && ft_variables._useOverviewVariant) {
        zoomOut();
      }
    }
  }

  /*
   * Public API to go to the next page
   */
  function _nextPage(jump) {
    var d = NavigationMatrix.getNextPage(jump);
    if (d === false) {
      return;
    }
    if (d != undefined) {
      navigateTo(d);
    } else {
      if (ft_variables._isOverview && ft_variables._useOverviewVariant) {
        zoomOut();
      }
    }
  }

  /*
   * Public API to go to the prev page
   */
  function _prevPage(jump) {
    var d = NavigationMatrix.getPrevPage(jump);
    if (d === false) {
      return;
    }
    if (d != undefined) {
      navigateTo(d);
    } else {
      if (ft_variables._isOverview && ft_variables._useOverviewVariant) {
        zoomOut();
      }
    }
  }

  /*
   * Public API to go to a specified section / page
   * the method accepts vary parameters:
   * if two numbers were passed it assumes that the first is the section index and the second is the page index;
   * if an object is passed it assumes that the object has a section property and a page property to get the indexes to navigate;
   * if an HTMLElement is passed it assumes the element is a destination page
   */
  function _gotoPage() {
    var args = _gotoPage.arguments;
    if (args.length > 0) {
      if (args.length == 1) {
        if (Brav1Toolbox.typeOf(args[0]) === "Object") {
          var o = args[0];
          var p = o.section;
          var sp = o.page;
          if (p != null && p != undefined) {
            var pd = document.querySelector(ft_constants.SECTION_SELECTOR + "[data-id=" + safeAttr(p) + "]");
            if (sp != null && sp != undefined) {
              var spd = pd.querySelector(ft_constants.PAGE_SELECTOR + "[data-id=" + safeAttr(sp) + "]");
              if (spd != null) {
                navigateTo(spd);
                return;
              }
            }
          }
        } else if (args[0].nodeName != undefined) {
          navigateTo(args[0], null, true);
        }
      }
      if (Brav1Toolbox.typeOf(args[0]) === "Number" || args[0] === 0) {
        var spd = NavigationMatrix.getPageByIndex(args[1], args[0]);
        navigateTo(spd);
        return;
      }
    }
  }

  function _gotoHome() {
    _gotoPage(0,0);
  }

  function _gotoEnd() {
    var sl = NavigationMatrix.getSectionsLength() - 1;
    _gotoPage(sl, NavigationMatrix.getPages(sl).length - 1);
  }

  function _gotoTop() {
    var pageIndex = NavigationMatrix.getPageIndex();
    _gotoPage(pageIndex.section, 0);
  }

  function _gotoBottom() {
    var pageIndex = NavigationMatrix.getPageIndex();
    _gotoPage(pageIndex.section, NavigationMatrix.getPages(pageIndex.section).length - 1);
  }

  function _addEventListener(type, handler, useCapture) {
    Brav1Toolbox.addListener(document, type, handler, useCapture);
  }

/*
   ######  ######## ######## ######## ######## ########   ######
  ##    ## ##          ##       ##    ##       ##     ## ##    ##
  ##       ##          ##       ##    ##       ##     ## ##
   ######  ######      ##       ##    ######   ########   ######
        ## ##          ##       ##    ##       ##   ##         ##
  ##    ## ##          ##       ##    ##       ##    ##  ##    ##
   ######  ########    ##       ##    ######## ##     ##  ######
*/

  function _setFragmentsOnSide(v) {
    ft_variables._fragmentsOnSide = v === true ? true : false;
    _setFragmentsOnBack(v);
  }

  function _setFragmentsOnBack(v) {
    ft_variables._fragmentsOnBack = v === true ? true : false;
  }

  function _setUseHistory(v){
    pushHistory = v === true ? true : false;
  }

  function _setSlideInPx(v) {
    ft_variables._slideInPx = v === true ? true : false;
    if (ft_variables._slideInPx === true) {
      NavigationMatrix.updateOffsets();
    }
    navigateTo();
  }

  function _setBackFromPageToTop(v) {
    ft_variables._backFromPageToTop = v === true ? true : false;
  }

  function _setNearestToTop(v) {
    ft_variables._nearestToTop = v === true ? true : false;
  }

  function _setGridNavigation(v) {
    ft_variables._gridNavigation = v === true ? false : true;
  }

  function _setUseOverviewVariant(v) {
    ft_variables._useOverviewVariant = v === true ? true : false;
  }

  function _setTwoStepsSlide(v) {
    ft_variables._twoStepsSlide = v === true ? true : false;
  }

  function _setShowProgress(v) {
    ft_variables._showProgress = v === true ? true : false;
    if (ft_variables._showProgress) {
      if (ft_variables.defaultProgress == null) {
        buildProgressIndicator();
      }
      updateProgress();
    } else {
      if (ft_variables.defaultProgress != null) {
        hideProgressIndicator();
      }
    }
  }

  function _setDefaultParallaxValues(x, y) {
    ft_variables._defaultParallaxX = x;
    ft_variables._defaultParallaxY = y == undefined ? ft_variables._defaultParallaxX : y;
    NavigationMatrix.update();
  }

  function _setParallaxInPx(v) {
    ft_variables._parallaxInPx = v === true ? true : false;
  }

  function _getSectionIndex() {
    return NavigationMatrix.getPageIndex().section;
  }

  function _getPageIndex() {
    return NavigationMatrix.getPageIndex().page;
  }

  function _loop(v) {
    ft_variables._isLoopable = v === true ? true : false;
  }

  function _clicker(v) {
    ft_variables._clickerMode = v === true ? true : false;
  }

  function _enableNavigation(links, keyboard, scroll, touch) {
    ft_variables._areLinksActive = links === false ? false : true;
    ft_variables._isKeyboardActive = keyboard === false ? false : true;
    ft_variables._isScrollActive = scroll === false ? false : true;
    ft_variables._isTouchActive = touch === false ? false : true;
  }

  function _disableNavigation(links, keyboard, scroll, touch) {
    ft_variables._areLinksActive = links === false ? true : false;
    ft_variables._isKeyboardActive = keyboard === false ? true : false;
    ft_variables._isScrollActive = scroll === false ? true : false;
    ft_variables._isTouchActive = touch === false ? true : false;
  }

  function _setLinksNavigation(v) {
    ft_variables._areLinksActive = v === false ? false : true;
  }

  function _setKeyboardNavigation(v) {
    ft_variables._isKeyboardActive = v === false ? false : true;
  }

  function _setScrollNavigation(v) {
    ft_variables._isScrollActive = v === false ? false : true;
  }

  function _setTouchNavigation(v) {
    ft_variables._isTouchActive = v === false ? false : true;
  }

  function _setCrossDirection(v) {
    if (ft_variables._crossDirection !== v) {
      ft_variables._crossDirection = v === true ? true : false;
      if (!Brav1Toolbox.hasClass(ft_variables.ftContainer, ft_constants.CROSS_DIRECTION_CLASS) && ft_variables._crossDirection === true) {
        Brav1Toolbox.addClass(ft_variables.ftContainer, ft_constants.CROSS_DIRECTION_CLASS);
      } else if (Brav1Toolbox.hasClass(ft_variables.ftContainer, ft_constants.CROSS_DIRECTION_CLASS) && ft_variables._crossDirection !== true) {
        Brav1Toolbox.removeClass(ft_variables.ftContainer, ft_constants.CROSS_DIRECTION_CLASS);
      }
      if (ft_variables.defaultProgress) {
        if (!Brav1Toolbox.hasClass(ft_variables.defaultProgress, ft_constants.CROSS_DIRECTION_CLASS) && ft_variables._crossDirection === true) {
          Brav1Toolbox.addClass(ft_variables.defaultProgress, ft_constants.CROSS_DIRECTION_CLASS);
        } else if (Brav1Toolbox.hasClass(ft_variables.defaultProgress, ft_constants.CROSS_DIRECTION_CLASS) && ft_variables._crossDirection !== true) {
          Brav1Toolbox.removeClass(ft_variables.defaultProgress, ft_constants.CROSS_DIRECTION_CLASS);
        }
      }
      //
      NavigationMatrix.updateOffsets();
      navigateTo();
    }
  }

  function _setScrollTheSection(v) {
    if (ft_variables._scrollTheSection !== v) {
      ft_variables._scrollTheSection = v === true ? true : false;
      if (!Brav1Toolbox.hasClass(ft_variables.ftContainer, ft_constants.SCROLL_THE_SECTION_CLASS) && ft_variables._scrollTheSection === true) {
        Brav1Toolbox.addClass(ft_variables.ftContainer, ft_constants.SCROLL_THE_SECTION_CLASS);
      } else if (Brav1Toolbox.hasClass(ft_variables.ftContainer, ft_constants.SCROLL_THE_SECTION_CLASS) && ft_variables._scrollTheSection !== true) {
        Brav1Toolbox.removeClass(ft_variables.ftContainer, ft_constants.SCROLL_THE_SECTION_CLASS);
      }
      //
      NavigationMatrix.updateOffsets();
      navigateTo();
    }
  }

  function _setDebouncingDelay(n) {
    ft_variables._debouncingDelay = n;
  }

  function _setTransitionTime(milliseconds) {
    ft_variables._transitionTime = milliseconds;
    ft_variables.ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "" + ft_variables._transitionTime + "ms";
  }

  function _getTransitionTime() {
    return ft_variables._transitionTime;
  }

  function _setMomentumScrollDelay(milliseconds) {
    ft_variables._momentumScrollDelay = milliseconds;
  }

  function _setNavigationCallback(f) {
    ft_variables._navigationCallback = f;
  }

  function _setRememberSectionsStatus(v) {
    ft_variables._rememberSectionsStatus = v === true ? true : false;
  }

  function _setRememberSectionsLastPage(v) {
    ft_variables._rememberSectionsLastPage = v === true ? true : false;
  }

  function _setToSectionsFromPages(v) {
    ft_variables._toSectionsFromPages = v === false ? false : true;
  }

  /**
   * return object for public methods
   */
  return {
    start                    : _start,
    updateNavigation         : _updateNavigation,

    nextSection              : _nextSection,
    prevSection              : _prevSection,
    next                     : _nextPage,
    prev                     : _prevPage,
    nextFragment             : _nextPage,
    prevFragment             : _prevPage,
    gotoPage                 : _gotoPage,
    gotoHome                 : _gotoHome,
    gotoTop                  : _gotoTop,
    gotoBottom               : _gotoBottom,
    gotoEnd                  : _gotoEnd,

    toggleOverview           : _toggleOverview,
    showOverview             : _setShowOverview,
    fragmentsOnSide          : _setFragmentsOnSide,
    fragmentsOnBack          : _setFragmentsOnBack,
    useHistory               : _setUseHistory,
    slideInPx                : _setSlideInPx,
    useOverviewVariant       : _setUseOverviewVariant,
    twoStepsSlide            : _setTwoStepsSlide,
    showProgress             : _setShowProgress,
    defaultParallaxValues    : _setDefaultParallaxValues,
    parallaxInPx             : _setParallaxInPx,

    addEventListener         : _addEventListener,
    getDefaultProgress       : _getDefaultProgress,

    getSection               : NavigationMatrix.getCurrentSection,
    getPage                  : NavigationMatrix.getCurrentPage,
    getSectionIndex          : _getSectionIndex,
    getPageIndex             : _getPageIndex,
    getPrevSection           : NavigationMatrix.getPrevSectionObject,
    getNextSection           : NavigationMatrix.getNextSectionObject,
    getPrevPage              : NavigationMatrix.getPrevPageObject,
    getNextPage              : NavigationMatrix.getNextPageObject,
    autoplay                 : _autoplay,
    play                     : _play,
    pause                    : _pause,
    stop                     : _stop,
    loop                     : _loop,
    clicker                  : _clicker,
    mouseDragEnabled         : _setMouseDrag,
    enableNavigation         : _enableNavigation,
    disableNavigation        : _disableNavigation,
    setLinksNavigation       : _setLinksNavigation,
    setKeyboardNavigation    : _setKeyboardNavigation,
    setScrollNavigation      : _setScrollNavigation,
    setTouchNavigation       : _setTouchNavigation,
    setCrossDirection        : _setCrossDirection,
    setDebouncingDelay       : _setDebouncingDelay,
    setTransitionTime        : _setTransitionTime,
    setMomentumScrollDelay   : _setMomentumScrollDelay,
    getTransitionTime        : _getTransitionTime,
    onNavigation             : _setNavigationCallback,

    gridNavigation           : _setGridNavigation,
    backFromPageToTop        : _setBackFromPageToTop,
    nearestPageToTop         : _setNearestToTop,
    rememberSectionsStatus   : _setRememberSectionsStatus,
    rememberSectionsLastPage : _setRememberSectionsLastPage,

    scrollTheSection         : _setScrollTheSection,
    toSectionsFromPages      : _setToSectionsFromPages
  };
})();
