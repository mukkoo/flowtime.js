/*
  ##     ## ######## #### ##        ######
  ##     ##    ##     ##  ##       ##    ##
  ##     ##    ##     ##  ##       ##
  ##     ##    ##     ##  ##        ######
  ##     ##    ##     ##  ##             ##
  ##     ##    ##     ##  ##       ##    ##
   #######     ##    #### ########  ######
*/

/**
 * returns the element by parsing the hash
 * @param h String  the hash string to evaluate
 */
getElementByHash = function (h) {
  /**
    * Init constants and variables defined in modules
    */
  var ft_constants = get_ft_constants();
  var ft_variables = get_ft_variables();

  if (h.length > 0) {
    var aHash = h.replace("#/", "").split("/");
    if (aHash.length > 0) {
      var dataProgSection = document.querySelectorAll(ft_constants.SECTION_SELECTOR + "[data-prog=__" + aHash[0] + "]");
      var dataIdSection = document.querySelectorAll(ft_constants.SECTION_SELECTOR + "[data-id=__" + aHash[0] + "]");
      var ps = dataProgSection.length > 0 ? dataProgSection : dataIdSection;
      if (ps != null) {
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i];
          var sp = null;
          if (aHash.length > 1) {
            sp = p.querySelector(ft_constants.PAGE_SELECTOR + "[data-prog=__" + aHash[1] + "]") || p.querySelector(ft_constants.PAGE_SELECTOR + "[data-id=__" + aHash[1] + "]");
          }
          if (sp !== null) {
            break;
          }
        }
        if (sp == null && p) {
          sp = p.querySelector(ft_constants.PAGE_SELECTOR);
        }
      }
      return sp;
    }
  }
  return;
}
