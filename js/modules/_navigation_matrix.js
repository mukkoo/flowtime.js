/*
  ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ## ##     ##    ###    ######## ########  #### ##     ##
  ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ## ###   ###   ## ##      ##    ##     ##  ##   ##   ##
  ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ## #### ####  ##   ##     ##    ##     ##  ##    ## ##
  ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ## ## ### ## ##     ##    ##    ########   ##     ###
  ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  #### ##     ## #########    ##    ##   ##    ##    ## ##
  ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ### ##     ## ##     ##    ##    ##    ##   ##   ##   ##
  ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ## ##     ## ##     ##    ##    ##     ## #### ##     ##
*/

  /**
   * NavigationMatrix is the Object who store the navigation grid structure
   * and which expose all the methods to get and set the navigation destinations
   */

var NavigationMatrix = function() {

    /**
      * Init constants and variables defined in modules
      */
    var ft_constants = get_ft_constants();
    var ft_variables = get_ft_variables();

    var sections;                                             // HTML Collection of .flowtime > .ft-section elements
    var sectionsArray;                                        // multi-dimensional array containing the pages' array
    var allPages;                                             // HTML Collection of .flowtime .ft-page elements
    var fragments;                                            // HTML Collection of .fragment elements
    var fragmentsArray;                                       // multi-dimensional array containing the per page fragments' array
    var fr = [];                                              // multi-dimensional array containing the index of the current active fragment per page
    var parallaxElements = [];                                // array containing all elements with parrallax
    var sectionsLength = 0;                                   // cached total number of .ft-section elements
    var pagesLength = 0;                                      // cached max number of .page elements
    var pagesTotalLength = 0;                                 // cached total number of .page elements
    var p = 0;                                                // index of the current section viewved or higlighted
    var sp = 0;                                               // index of the current page viewved or higlighted
    var pCache = 0;                                           // cache index of the current section
    var spCache = 0;                                          // cache index of the current page
    var hilited;                                              // the current page higlighted, useful for overview mode

    /**
     * update the navigation matrix array
     * this is a publicy exposed method
     * useful for updating the matrix when the site structure changes at runtime
     */
    function _updateMatrix() {
      sectionsArray = [];
      parallaxElements = [];
      fragments = document.querySelectorAll(ft_constants.FRAGMENT_SELECTOR);
      fragmentsArray = [];
      sections = ft_variables.ftContainer.querySelectorAll(".flowtime > " + ft_constants.SECTION_SELECTOR);
      allPages = ft_variables.ftContainer.querySelectorAll(".flowtime " + ft_constants.PAGE_SELECTOR);
      //
      for (var i = 0; i < sections.length; i++) {
        var pagesArray = [];
        var section = sections[i];
        fragmentsArray[i] = [];
        fr[i] = [];
        //
        ft_variables.sectionDataIdMax += 1;
        if (section.getAttribute("data-id")) {
          section.setAttribute("data-id", "__" + unsafeAttr(section.getAttribute("data-id"))); // prevents attributes starting with a number
        } else {
          section.setAttribute("data-id", "__" + ft_variables.sectionDataIdMax);
        }
        if (section.getAttribute("data-prog")) {
          section.setAttribute("data-prog", "__" + unsafeAttr(section.getAttribute("data-prog"))); // prevents attributes starting with a number
        } else {
          section.setAttribute("data-prog", "__" + ft_variables.sectionDataIdMax);
        }
        section.index = i;
        section.setAttribute("id", "");
        //
        pages = section.querySelectorAll(ft_constants.PAGE_SELECTOR);
        pagesTotalLength += pages.length;
        pagesLength = Math.max(pagesLength, pages.length); // sets the pages max number for overview purposes
        for (var ii = 0; ii < pages.length; ii++) {
          var _sp = pages[ii];
          if (_sp.getAttribute("data-id")) {
            _sp.setAttribute("data-id", "__" + unsafeAttr(_sp.getAttribute("data-id"))); // prevents attributes starting with a number
          } else {
            _sp.setAttribute("data-id", "__" + (ii + 1));
          }
          if (_sp.getAttribute("data-prog")) {
            _sp.setAttribute("data-prog", "__" + unsafeAttr(_sp.getAttribute("data-prog"))); // prevents attributes starting with a number
          } else {
            _sp.setAttribute("data-prog", "__" + (ii + 1));
          }
          _sp.index = ii;
          _sp.setAttribute("id", "");
          // set data-title attributes to pages that doesn't have one and have at least an h1 heading element inside
          if (!_sp.getAttribute("data-title")) {
            var heading = _sp.querySelector("h1");
            if (heading != null && heading.textContent.lenght != "") {
              _sp.setAttribute("data-title", heading.textContent);
            }
          }
          // store parallax data on elements
          setParallax(_sp, i, ii);
          //
          pagesArray.push(_sp);
          //
          var subFragments = _sp.querySelectorAll(ft_constants.FRAGMENT_SELECTOR);
          fragmentsArray[i][ii] = subFragments;
          fr[i][ii] = -1;
        }
        sectionsArray.push(pagesArray);
      }
      //
      sectionsLength = sections.length; // sets the sections max number for overview purposes
      resetScroll();
      _updateOffsets();
    }

    /**
     * stores parallax data directly on the dome elements with a data-parallax attribute
     * data are stored on a multi dimensional array ordered per section and per page to easily manage the position
     */
    function setParallax(page, sectionIndex, pageIndex) {
      if (ft_variables._parallaxEnabled) {
        if (parallaxElements[sectionIndex] == undefined) {
          parallaxElements[sectionIndex] = [];
        }
        if (parallaxElements[sectionIndex][pageIndex] == undefined) {
          parallaxElements[sectionIndex][pageIndex] = [];
        }
        //
        var pxs = page.querySelectorAll(".parallax");
        if (pxs.length > 0) {
          for (var i = 0; i < pxs.length; i++) {
            var el = pxs[i];
            var pX = ft_variables._defaultParallaxX;
            var pY = ft_variables._defaultParallaxY;
            if (el.getAttribute("data-parallax") != null) {
              var pValues = el.getAttribute("data-parallax").split(",");
              pX = pY = pValues[0];
              if (pValues.length > 1) {
                pY = pValues[1];
              }
            }
            el.pX = pX;
            el.pY = pY;
            parallaxElements[sectionIndex][pageIndex].push(el);
          }
        }
      }
    }

    function _getParallaxElements() {
      return parallaxElements;
    }

    /*
##     ## ########  ########     ###    ######## ########  #######  ######## ########  ######  ######## ########  ######
##     ## ##     ## ##     ##   ## ##      ##    ##       ##     ## ##       ##       ##    ## ##          ##    ##    ##
##     ## ##     ## ##     ##  ##   ##     ##    ##       ##     ## ##       ##       ##       ##          ##    ##
##     ## ########  ##     ## ##     ##    ##    ######   ##     ## ######   ######    ######  ######      ##     ######
##     ## ##        ##     ## #########    ##    ##       ##     ## ##       ##             ## ##          ##          ##
##     ## ##        ##     ## ##     ##    ##    ##       ##     ## ##       ##       ##    ## ##          ##    ##    ##
 #######  ##        ########  ##     ##    ##    ########  #######  ##       ##        ######  ########    ##     ######
    */

    /**
     * cache the position for every page, useful when navigatin in pixels or when attaching a page after scrolling
     */
    function _updateOffsets () {
      ft_variables.xGlobal = ft_variables.ftContainer.offsetLeft;
      ft_variables.yGlobal = ft_variables.ftContainer.offsetTop;
      for (var i = 0; i < allPages.length; i++) {
        var _sp = allPages[i];
        var _spParent = _sp.offsetParent;
        //
        if (i === 0) {
          ft_variables.xGlobalDelta = _sp.offsetLeft - ft_variables.xGlobal;
          ft_variables.yGlobalDelta = _sp.offsetTop - ft_variables.yGlobal;
        }
        //  _
        if (ft_variables._crossDirection === true) {
          _sp.x = _sp.offsetLeft - (ft_variables.xGlobal + ft_variables.xGlobalDelta);
          _sp.y = _spParent.offsetTop;
        } else {
          _sp.x = _spParent.offsetLeft;
          _sp.y = _sp.offsetTop - (ft_variables.yGlobal + ft_variables.yGlobalDelta);
        }

      }
    }

    /**
     * returns the next section in navigation
     * @param top Boolean if true the next page will be the first page in the next array; if false the next section will be the same index page in the next array
     * @param fos Boolean value of ft_variables._fragmentsOnSide
     */
    function _getNextSection(top, fos) {
      var sub = sp;
      //
      var toTop = ft_variables._isOverview === true ? false : top;
      if (fos === true && fragmentsArray[p][sp].length > 0 && fr[p][sp] < fragmentsArray[p][sp].length - 1 && toTop !== true && io === false) {
        _showFragment(p, sp);
      } else {
        sub = 0;
        if (toTop === true && p + 1 <= sectionsArray.length - 1) {
          sub = 0;
        } else if (toTop !== true || ft_variables._fragmentsOnBack === true || p + 1 > sectionsArray.length - 1) {
          sub = sp;
        }
        var pTemp = Math.min(p + 1, sectionsArray.length - 1);
        if (ft_variables._isLoopable == true && pTemp === p) {
          p = 0;
        } else {
          p = pTemp;
        }
        //
        if (!ft_variables._isOverview) {
          if (ft_variables._rememberSectionsStatus === true && ft_variables._sectionsStatus[p] !== undefined) {
            sub = ft_variables._sectionsStatus[p];
          }
          //
          if (ft_variables._rememberSectionsLastPage === true) {
            sub = ft_variables._sectionsLastPageDepth;
          }
        }
        //
        return _getNearestPage(sectionsArray[p], sub);
      }
      return hiliteOrNavigate(sectionsArray[p][sp]);
    }

    /**
     * returns the prev section in navigation
     * @param top Boolean if true the next section will be the first page in the prev array; if false the prev section will be the same index page in the prev array
     * @param fos Boolean value of ft_variables._fragmentsOnSide
     */
    function _getPrevSection(top, fos) {
      var sub = sp;
      //
      var toTop = ft_variables._isOverview === true ? false : top;
      if (fos === true && fragmentsArray[p][sp].length > 0 && fr[p][sp] >= 0 && toTop !== true && ft_variables._isOverview === false) {
        _hideFragment(p, sp);
      } else {
        var sub = 0;
        sub = 0;
        if (toTop === true && p - 1 >= 0) {
          sub = 0;
        } else if (toTop !== true || ft_variables._fragmentsOnBack === true || p - 1 < 0) {
          sub = sp;
        }
        var pTemp = Math.max(p - 1, 0);
        if (ft_variables._isLoopable === true && pTemp === p) {
          p = sectionsArray.length - 1;
        } else {
          p = pTemp;
        }
        //
        if (!ft_variables._isOverview) {
          if (ft_variables._rememberSectionsStatus === true && ft_variables._sectionsStatus[p] >= 0) {
            sub = ft_variables._sectionsStatus[p];
          }
          //
          if (ft_variables._rememberSectionsLastPage === true) {
            sub = ft_variables._sectionsLastPageDepth;
          }
        }
        //
        return _getNearestPage(sectionsArray[p], sub);
      }
      return hiliteOrNavigate(sectionsArray[p][sp]);
    }

    /**
     * checks if there is a valid page in the current section array
     * if the passed page is not valid the check which is the first valid page in the array
     * then returns the page
     * @param p Number  the section index in the sections array
     * @param sub Number  the page index in the sections->page array
     */
    function _getNearestPage(pg, sub) {
      var nsp = pg[sub];
      if (nsp === undefined) {
        if (ft_variables._nearestToTop === true) {
          nsp = pg[0];
          sub = 0;
        } else {
          for (var i = sub; i >= 0; i--) {
            if (pg[i] !== undefined) {
              nsp = pg[i];
              sub = i;
              break;
            }
          }
        }
      }
      sp = sub;
      if (!ft_variables._isOverview) {
        _updateFragments();
      }
      return hiliteOrNavigate(nsp);
    }

    /**
     * returns the next page in navigation
     * if the next page is not in the current section array returns the first page in the next section array
     * if ft_variables._toSectionsFromPages is false and the next page is not in the current section then returns false
     * @param jump  Boolean if true jumps over the fragments directly to the next page
     */
    function _getNextPage(jump) {
      if (fragmentsArray[p][sp].length > 0 && fr[p][sp] < fragmentsArray[p][sp].length - 1 && jump !== true && ft_variables._isOverview === false) {
        _showFragment(p, sp);
      } else {
        if (sectionsArray[p][sp + 1] === undefined) {
          if (ft_variables._toSectionsFromPages === false) {
            return false;
          } else if (sectionsArray[p + 1] !== undefined) {
            p += 1;
            sp = 0;
          } else if (sectionsArray[p + 1] === undefined && ft_variables._isLoopable === true) {
            p = 0;
            sp = 0;
          }
        } else {
          sp = Math.min(sp + 1, sectionsArray[p].length - 1);
        }
      }
      return hiliteOrNavigate(sectionsArray[p][sp]);
    }

    /**
     * returns the prev page in navigation
     * if the prev page is not in the current section array returns the last page in the prev section array
     * if ft_variables._toSectionsFromPages is false and the prev page is not in the current section then returns false
     * @param jump  Boolean if true jumps over the fragments directly to the prev page
     */
    function _getPrevPage(jump) {
      if (fragmentsArray[p][sp].length > 0 && fr[p][sp] >= 0 && jump !== true && ft_variables._isOverview === false) {
        _hideFragment(p, sp);
      } else {
        if (sp == 0) {
          if (ft_variables._toSectionsFromPages === false) {
            return false;
          } else if (sectionsArray[p - 1] != undefined) {
            p -= 1;
            sp = ft_variables._backFromPageToTop === true ? 0 : sectionsArray[p].length - 1;
          } else if (sectionsArray[p - 1] == undefined && ft_variables._isLoopable === true) {
            p = sectionsArray.length - 1;
            sp = ft_variables._backFromPageToTop === true ? 0 : sectionsArray[p].length - 1;
          }
        } else {
          sp = Math.max(sp - 1, 0);
        }
      }
      return hiliteOrNavigate(sectionsArray[p][sp]);
    }

    /**
     * returns the destination page or
     * if the application is in overview mode
     * switch the active page without returning a destination
     * @param d HTMLElement the candidate destination
     */
    function hiliteOrNavigate(d) {
      if (ft_variables._isOverview == true) {
        _switchActivePage(d);
        return;
      } else {
        return d;
      }
    }

    /**
     * show a single fragment inside the specified section / page
     * the fragment index parameter is optional, if passed force the specified fragment to show
     * otherwise the method shows the current fragment
     * @param fp  Number  the section index
     * @param fsp Number  the page index
     * @param f Number  the fragment index (optional)
     */
    function _showFragment(fp, fsp, f) {
      if (f != undefined) {
        fr[fp][fsp] = f;
      }
      else {
        f = fr[fp][fsp] += 1;
      }
      for (var i = 0; i <= f; i++) {
        Brav1Toolbox.addClass(fragmentsArray[fp][fsp][i], ft_constants.FRAGMENT_REVEALED_CLASS);
        Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], ft_constants.FRAGMENT_ACTUAL_CLASS);
      }
      Brav1Toolbox.addClass(fragmentsArray[fp][fsp][f], ft_constants.FRAGMENT_ACTUAL_CLASS);
    }

    /**
     * hide a single fragment inside the specified section / page
     * the fragment index parameter is optional, if passed force the specified fragment to hide
     * otherwise the method hides the current fragment
     * @param fp  Number  the section index
     * @param fsp Number  the page index
     * @param f Number  the fragment index (optional)
     */
    function _hideFragment(fp, fsp, f) {
      if (f != undefined) {
        fr[fp][fsp] = f;
      } else {
        f = fr[fp][fsp];
      }
      for (var i = 0; i < fragmentsArray[fp][fsp].length; i++) {
        if (i >= f) {
          Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], ft_constants.FRAGMENT_REVEALED_CLASS);
          Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], ft_constants.FRAGMENT_REVEALED_TEMP_CLASS);
        }
        Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], ft_constants.FRAGMENT_ACTUAL_CLASS);
      }
      f -= 1;
      if (f >= 0) {
        Brav1Toolbox.addClass(fragmentsArray[fp][fsp][f], ft_constants.FRAGMENT_ACTUAL_CLASS);
      }
      fr[fp][fsp] = f;
    }

    /**
     * show all the fragments or the fragments in the specified page
     * adds a temporary class which does not override the current status of fragments
     */
    function _showFragments() {
      for (var i = 0; i < fragments.length; i++) {
        Brav1Toolbox.addClass(fragments[i], ft_constants.FRAGMENT_REVEALED_TEMP_CLASS);
      }
    }

    /**
     * hide all the fragments or the fragments in the specified page
     * removes a temporary class which does not override the current status of fragments
     */
    function _hideFragments() {
      for (var i = 0; i < fragments.length; i++) {
        Brav1Toolbox.removeClass(fragments[i], ft_constants.FRAGMENT_REVEALED_TEMP_CLASS);
      }
    }

    function _updateFragments() {
      // YES! This is Allman style and is correct
      for (var ip = 0; ip < fragmentsArray.length; ip++)
      {
        var frp = fragmentsArray[ip];
        for (var isp = 0; isp < frp.length; isp++)
        {
          var frsp = frp[isp];
          if (frsp.length > 0)
          {
            // there are fragments
            if (ip > p)
            {
              // previous section
              for (var f = frsp.length - 1; f >= 0; f--)
              {
                _hideFragment(ip, isp, f);
              }
            }
            else if (ip < p)
            {
              // next section
              for (var f = 0; f < frsp.length; f++)
              {
                _showFragment(ip, isp, f);
              }
            }
            else if (ip == p)
            {
              // same section
              if (isp > sp)
              {
                // previous page
                for (var f = frsp.length - 1; f >= 0; f--)
                {
                  _hideFragment(ip, isp, f);
                }
              }
              else if (isp < sp)
              {
                // next page
                for (var f = 0; f < frsp.length; f++)
                {
                  _showFragment(ip, isp, f);
                }
              }
              else if (isp == sp)
              {
                // same page
                if (ft_variables._fragmentsOnBack == true && (ft_variables.pastIndex.section > NavigationMatrix.getPageIndex().section || ft_variables.pastIndex.page > NavigationMatrix.getPageIndex().page))
                {
                  for (var f = 0; f < frsp.length; f++)
                  {
                    _showFragment(ip, isp, f);
                  }
                }
                else
                {
                  for (var f = frsp.length - 1; f >= 0; f--)
                  {
                    _hideFragment(ip, isp, f);
                  }
                }
                if (ft_variables._fragmentsOnBack == false)
                {
                  fr[ip][isp] = -1
                }
                else
                {
                  if (ft_variables.pastIndex.section > NavigationMatrix.getPageIndex().section || ft_variables.pastIndex.page > NavigationMatrix.getPageIndex().page)
                  {
                    fr[ip][isp] = frsp.length - 1;
                  }
                  else
                  {
                    fr[ip][isp] = -1
                  }
                }
              }
            }
          }
        }
      }
    }

    /**
     * returns the current section index
     */
    function _getSection(h) {
      if (h) {
        // TODO return the index of the section by hash
      }
      return p;
    }

    /**
     * returns the current page index
     */
    function _getPage(h) {
      if (h) {
        // TODO return the index of the page by hash
      }
      return sp;
    }

    /**
     * returns the sections collection
     */
     function _getSections() {
      return sections;
     }

    /**
     * returns the pages collection inside the passed section index
     */
     function _getPages(i) {
      return sectionsArray[i];
     }

    /**
     * returns the pages collection of all pages in the presentation
     */
    function _getAllPages() {
      return allPages;
    }

    /**
     * returns the number of pages in the specified section
     */
    function _getSectionLength(i) {
      return sectionsArray[i].length;
    }

    /**
     * returns the number of sections
     */
    function _getSectionsLength() {
      return sectionsLength;
    }

    /**
     * returns the max number of pages
     */
    function _getPagesLength() {
      return pagesLength;
    }

    /**
     * returns the total number of pages
     */
    function _getPagesTotalLength() {
      return pagesTotalLength;
    }

    /**
     * returns a object with the index of the current section and page
     */
    function _getPageIndex(d) {
      var pIndex = p;
      var spIndex = sp;
      if (d != undefined) {
        pIndex = d.parentNode.index; //parseInt(d.parentNode.getAttribute("data-prog").replace(/__/, "")) - 1;
        spIndex = d.index; //parseInt(d.getAttribute("data-prog").replace(/__/, "")) - 1;
      }
      return { section: pIndex, page: spIndex };
    }

    function _getSectionByIndex(i) {
      return sections[i];
    }

    function _getPageByIndex(i, pi) {
      return sectionsArray[pi][i];
    }

    function _getCurrentSection() {
      return sections[p];
    }

    function _getCurrentPage() {
      return sectionsArray[p][sp];
    }

    /**
     * returns the previous section element
     * if the presentation is loopable and the current section is the first
     * return the last section
     * @return {HTMLElement} the previous section element
     */
    function _getPrevSectionIndex() {
      var sectionIndex = p-1;
      if (sectionIndex < 0) {
        if (ft_variables._isLoopable === true) {
          sectionIndex = sectionsArray.length-1;
        } else {
          return null;
        }
      }
      return sectionIndex;
    }

    function _getPrevSectionObject() {
      var sectionIndex = _getPrevSectionIndex();
      if (sectionIndex === null) {
        return null;
      }
      return sections[sectionIndex];
    }

    function _getPrevPageObject() {
      var pageIndex = sp-1;
      // the page is in the previous section
      if (pageIndex < 0) {
        // the section is the first and the presentation can loop
        if (p === 0 && ft_variables._isLoopable) {
          // get the last page of the last section
          var sectionIndex = sectionsArray.length-1;
          return sectionsArray[sectionIndex][sectionsArray[sectionIndex].length-1];
        } else if (p > 0) {
          // get the last page of the previous section
          return sectionsArray[p-1][sectionsArray[p-1].length-1];
        } else {
          // there's not a previous page
          return null;
        }
      }
      // get the previous pages
      return sectionsArray[p][pageIndex];
    }

    /**
     * returns the next section element
     * if the presentation is loopable and the current section is the last
     * return the first section
     * @return {HTMLElement} the next section element
     */
    function _getNextSectionIndex() {
      var sectionIndex = p+1;
      if (sectionIndex > sectionsArray.length-1) {
        if (ft_variables._isLoopable === true) {
          sectionIndex = 0;
        } else {
          return null;
        }
      }
      return sectionIndex;
    }

    function _getNextSectionObject() {
      var sectionIndex = _getNextSectionIndex();
      if (sectionIndex === null) {
        return null;
      }
      return sections[sectionIndex];
    }

    function _getNextPageObject() {
      var pageIndex = sp+1;
      // the page is in the next section
      if (pageIndex > sectionsArray[p].length-1) {
        // the section is the last and the presentation can loop
        if (p === sectionsArray.length-1 && ft_variables._isLoopable) {
          // get the first page of the first section
          return sectionsArray[0][0];
        } else if (p < sectionsArray.length-1) {
          // get the first page of the next section
          return sectionsArray[p+1][0];
        } else {
          // there's not a next page
          return null;
        }
      }
      // get the next pages
      return sectionsArray[p][pageIndex];
    }

    function _getCurrentFragment() {
      return fragmentsArray[p][sp][_getCurrentFragmentIndex()];
    }

    function _getCurrentFragmentIndex() {
      return fr[p][sp];
    }

    function _hasNextSection() {
      return p < sections.length - 1;
    }

    function _hasPrevSection() {
      return p > 0;
    }

    function _hasNextPage() {
      return sp < sectionsArray[p].length - 1;
    }

    function _hasPrevPage() {
      return sp > 0;
    }

    /**
     * get a progress value calculated on the total number of pages
     */
    function _getProgress() {
      if (p == 0 && sp == 0) {
        return 0;
      }
      var c = 0;
      for (var i = 0; i < p; i++) {
        c += sectionsArray[i].length;
      }
      c += sectionsArray[p][sp].index + 1;
      return c;
    }

    /**
     * get a composed hash based on current section and page
     */
    function _getHash(d) {
      if (d) {
        sp = _getPageIndex(d).page;
        p = _getPageIndex(d).section;
      }
      var h = "";
      // append to h the value of data-id attribute or, if data-id is not defined, the data-prog attribute
      var _p = sections[p];
      h += getPageId(_p);
      if (sectionsArray[p].length > 0) {
        var _sp = sectionsArray[p][sp];
        h += "/" + getPageId(_sp);
      }
      return h;
    }

    /**
     * expose the method to set the page from a hash
     */
    function _setPage(h) {
      var elem = getElementByHash(h);
      if (elem) {
        var pElem = elem.parentNode;
        for (var i = 0; i < sectionsArray.length; i++) {
          var pa = sectionsArray[i];
          if (sections[i] === pElem) {
            p = i;
            for (var ii = 0; ii < pa.length; ii++) {
              if (pa[ii] === elem) {
                sp = ii;
                break;
              }
            }
          }
        }
        _updateFragments();
      }
      return elem;
    }

    function _switchActivePage(d, navigate) {
      var sIndex = d.parentNode.index;
      for (var i = 0; i < sectionsArray.length; i++) {
        var pa = sectionsArray[i];
        for (var ii = 0; ii < pa.length; ii++) {
          var spa = pa[ii];
          //
          Brav1Toolbox.removeClass(spa, "past-section");
          Brav1Toolbox.removeClass(spa, "future-section");
          Brav1Toolbox.removeClass(spa, "past-page");
          Brav1Toolbox.removeClass(spa, "future-page");
          //
          if (spa !== d) {
            Brav1Toolbox.removeClass(spa, "hilite");
            if (ft_variables._isOverview == false && spa !== _getCurrentPage()) {
              Brav1Toolbox.removeClass(spa, "actual");
            }
            if (i < sIndex) {
              Brav1Toolbox.addClass(spa, "past-section");
            } else if (i > sIndex) {
              Brav1Toolbox.addClass(spa, "future-section");
            }
            if (spa.index < d.index) {
              Brav1Toolbox.addClass(spa, "past-page");
            } else if (spa.index > d.index) {
              Brav1Toolbox.addClass(spa, "future-page");
            }
          }
        }
      }
      Brav1Toolbox.addClass(d, "hilite");
      if (navigate) {
        setActual(d);
      }
      hilited = d;
    }

    function _getCurrentHilited() {
      return hilited;
    }

    function setActual(d) {
      Brav1Toolbox.addClass(d, "actual");
    }

    _updateMatrix(); // update the navigation matrix on the first run

    return {
      update: _updateMatrix,
      updateFragments: _updateFragments,
      showFragments: _showFragments,
      hideFragments: _hideFragments,
      getSection: _getSection,
      getPage: _getPage,
      getSections: _getSections,
      getPages: _getPages,
      getAllPages: _getAllPages,
      getNextSection: _getNextSection,
      getPrevSection: _getPrevSection,
      getNextPage: _getNextPage,
      getPrevPage: _getPrevPage,
      getSectionLength: _getSectionLength,
      getSectionsLength: _getSectionsLength,
      getPagesLength: _getPagesLength,
      getPagesTotalLength: _getPagesTotalLength,
      getPageIndex: _getPageIndex,
      getSectionByIndex: _getSectionByIndex,
      getPageByIndex: _getPageByIndex,
      getCurrentSection: _getCurrentSection,
      getCurrentPage: _getCurrentPage,

      getPrevSectionObject: _getPrevSectionObject,
      getPrevPageObject: _getPrevPageObject,
      getNextSectionObject: _getNextSectionObject,
      getNextPageObject: _getNextPageObject,

      getCurrentFragment: _getCurrentFragment,
      getCurrentFragmentIndex: _getCurrentFragmentIndex,
      getProgress: _getProgress,
      getHash: _getHash,
      setPage: _setPage,
      switchActivePage: _switchActivePage,
      getCurrentHilited: _getCurrentHilited,
      hasNextSection: _hasNextSection,
      hasPrevSection: _hasPrevSection,
      hasNextPage: _hasNextPage,
      hasPrevPage: _hasPrevPage,
      updateOffsets: _updateOffsets,
      getParallaxElements: _getParallaxElements
    }
  };
