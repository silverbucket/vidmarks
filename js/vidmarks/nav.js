/**
 * navMenu - little helper utility to handle navigation tasks
 *
 * requires: jQuery
 */
//net.silverbucket.vidmarks.navMenu =
define([], function() {
    var pub = {};
    var _ = {};

    pub.init = function(pages) {
        _.pages = pages;
    };

    pub.toggle = function(page) {
        console.log('navMenu - click received');
        var num_pages = _.pages.length;
        for ( var i = 0; i < num_pages; i++ ) {
            if ( _.pages[i] != page ) {
                $("a#link-"+_.pages[i]).removeClass('selected');
                $("section#"+_.pages[i]).hide();
            }
        }
        // fade in page content
        $("section#"+page+"").fadeIn('fast');
        $("a#link-"+page+"").addClass('selected');
    };

    return pub;
});