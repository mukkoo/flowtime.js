/**
 * clean the save value of an attribute
 * removing __ from the beginning of the value
 */
unsafeAttr = function(a) {
  if (a.substr(0,2) == "__") {
    return a.replace(/__/, "");
  } else {
    return a;
  }
}

resetScroll = function () {
  window.scrollTo(0,0); // fix the eventually occurred page scrolling resetting the scroll values to 0
}

/**
   * returns a clean string of navigation atributes of the passed page
   * if there is a data-id attribute it will be returned
   * otherwise will be returned the data-prog attribute
   */
  function getPageId(d) {
    var tempId = d.getAttribute("data-id");
    var tempProg = d.getAttribute("data-prog");
    var ret = "";
    if (tempId != null) {
      ret = tempId.replace(/__/, "");
    } else if (tempProg != null) {
      ret = tempProg.replace(/__/, "");
    }
    return ret;
  }

  /**
   * returns a safe version of an attribute value
   * adding __ in front of the value
   */
  function safeAttr(a) {
    if (a.substr(0,2) != "__") {
      return "__" + a;
    } else {
      return a;
    }
  }
