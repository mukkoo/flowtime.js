get_ft_variables = function(){
  return {
    ftContainer: document.querySelector(".flowtime"),                   // cached reference to .flowtime element
    ftParent: document.querySelector(".flowtime").parentNode,           // cached reference to .flowtime parent element
    body: document.querySelector("body"),                               // cached reference to body element
    useHash: false,                                                     // if true the engine uses only the hash change logic
    currentHash: "",                                                    // the hash string of the current section / page pair
    pastIndex: { section:0, page:0 },                                   // section and page indexes of the past page
    siteName: document.title,                                           // cached base string for the site title
    overviewCachedDest: null,                                           // caches the destination before performing an overview zoom out for navigation back purposes
    overviewFixedScaleFactor: 22,                                       // fixed scale factor for overview variant
    defaultProgress: null,                                              // default progress bar reference
    sectionDataIdMax: 0,
    _isOverview: false,                                                 // Boolean status for the overview
    _useOverviewVariant: false,                                         // use an alternate overview layout and navigation (experimental - useful in case of rendering issues)
    _fragmentsOnSide: false,                                            // enable or disable fragments navigation when navigating from sections
    _fragmentsOnBack: true,                                             // shows or hide fragments when navigating back to a page
    _slideInPx: false,                                                  // calculate the slide position in px instead of %, use in case the % mode does not works
    _twoStepsSlide: false,                                              // not yet implemented! slides up or down before, then slides to the page
    _isLoopable: false,
    _showProgress: false,                                               // show or hide the default progress indicator (leave false if you want to implement a custom progress indicator)
    _clickerMode: false,                                                // Used if presentation is being controlled by a "presenter" device (e.g., R400)
    _parallaxInPx: false,                                               // if false the parallax movement is calulated in % values, if true in pixels
    _defaultParallaxX: 50,                                              // the default parallax horizontal value used when no data-parallax value were specified
    _defaultParallaxY: 50,                                              // the default parallax vertical value used when no data-parallax value were specified
    _parallaxEnabled: document.querySelector(".parallax") != null,      // performance tweak, if there is no elements with .parallax class disable the dom manipulation to boost performances
    _mouseDragEnabled: false,                                           // in enabled is possible to drag the presentation with the mouse pointer
    _isTouchDevice: false,
    _isScrollActive: true,                                              // flags to enable or disable javascript input listeners for the navigation
    _isScrollable: true,
    _isKeyboardActive: true,
    _isTouchActive: true,
    _areLinksActive: true,
    _isScrolling: false,
    _momentumScrollTimeout: 0,
    _momentumScrollDelay: 2000,
    _fireEvent: true,
    _debouncingDelay: 1000,
    _transitionPaused: false,
    _transitionTime: 500,                                               // the page transition in milliseconds (keep in sync with the CSS transition value)
    _crossDirection: Brav1Toolbox.hasClass(document.querySelector(".flowtime"), get_ft_constants().CROSS_DIRECTION_CLASS),       // flag to set the cross direction layout and logic
    _navigationCallback: undefined,
    _transformProperty: Brav1Toolbox.getPrefixed("transform"),
    _supportsTransform: Brav1Toolbox.testCSS("transform"),
    _toSectionsFromPages: true,                                         // if false prevents the previous page and next page commands from navigating to previous and next sections
    xGlobal: 0,
    yGlobal: 0,
    xGlobalDelta: 0,
    yGlobalDelta: 0,
    // section navigation modifiers
    _gridNavigation: false,                                             // if true navigation with right or left arrow go to the first page of the section
    _backFromPageToTop: false,                                          // if true, when going back from the first page of a section to the previous section, go to the first page of the new section
    _nearestToTop: false,
    _rememberSectionsStatus: false,
    _rememberSectionsLastPage: false,
    _scrollTheSection: Brav1Toolbox.hasClass(document.querySelector(".flowtime"), get_ft_constants().SCROLL_THE_SECTION_CLASS),  // flag to set the scroll the section logic
    _sectionsStatus: [],
    _sectionsLastPageDepth: 0,
    _showErrors: false
  }
}
