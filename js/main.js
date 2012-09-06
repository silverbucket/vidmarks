if(!net) var net={};
if(!net.silverbucket) net.silverbucket={};
if(!net.silverbucket.vidmarks) net.silverbucket.vidmarks={};


net.silverbucket.vidmarks.navMenu = function() {
    var pub = {};
    var _ = {};

    pub.init = function(pages) {
        _.pages = pages;
    }

    pub.toggle = function(page) {
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
    }
    
    return pub;
}();


/** 
 * DBModel - provides an abraction for the various remoteStorage.js modules required.
 *
 * requires: remoteStorage.js
 */
net.silverbucket.vidmarks.DBModel = function() {
    var pub = {}; // public variable and functions container
    var _ = {}; // private variable and functions container

    _.modules = {}; // module objects for RS
    _.app_namespace = 'vidmarks';


    pub.init = function() {
        console.log('- DB: init()');
        remoteStorage.claimAccess('bookmarks', 'rw');
        //remoteStorage.claimAccess('tags', 'rw');
        //remoteStorage.claimAccess('mappings', 'rw');
        remoteStorage.displayWidget('remotestorage-connect'); //after that (not before that) display widget

        console.log('- DB: getting priviteLists...');
        _.modules.bookmarks = remoteStorage.bookmarks.getPrivateList(_.app_namespace);
        //_.tags      = remoteStorage.tags.getPrivateList('vidmarks');
        //_.mappings  = remoteStorage.mappings.getPrivateList('vidmarks');

        _.modules.bookmarks.on('error', function(err) {
            console.log('DB ERROR: '+err);
        });

        // XXX - this function returns only obj, not id [original params were (id, obj)]
        _.modules.bookmarks.on('change', function(obj) {
            console.log('DB CHANGE: bookmarks on(change) fired.');
            console.log(obj);
        });
    }

    pub.addBookmark = function(url, title, description) {
        if (!description) { 
            var description = 'this is an example description, yours will be much more descriptive, of course.';
        }
        if (!title) {
            var title = 'Bookmark Title!'; 
        }

        var new_id = _.modules.bookmarks.add(url, title, description);
        return new_id;
    }

    pub.getAll = function() {
        console.log('- DB: getAll()');
        var ids = _.modules.bookmarks.getIds();
        var all = {};
        var num_ids = ids.length;
        for (i = 0; i < num_ids; i++) {
            obj = _.modules.bookmarks.get(ids[i]);
            all[ids[i]] = obj;
        }
        return all;
    }

    pub.getById = function(id) {
        return _.modules.bookmarks.get();
    }

    pub.deleteAll = function() {
        console.log('- DB: deleteAll()');
        var ids = _.modules.bookmarks.getIds();
        console.log(ids);
        var all = {};
        for (id in ids) {
            _.modules.bookmarks.remove(id);
        }
        return all;
    }

    return pub;
}();


/** 
 * publicVideoSiteAPI - provides an abstraction interface to the various video site APIs
 *
 * requires: jquery, and jsuri 
 */
net.silverbucket.vidmarks.publicVideoSiteAPI = function() {
    var pub = {};
    var _ = {};

    _.youtube = {};
    _.site_mapping = {};
    _.site_mapping['youtube'] = [
            "youtube.com",
            "www.youtube.com",
            "youtu.be",
            "www.youtu.be"
        ];

    pub.retreiveDetails = function(url, successFunc, failFunc) {
        if (!url) {
            console.debug('ERROR '+this+': url param required.');
            return false;
        }

        var uri = new Uri(url);
        console.log('DEBUG: host:'+uri.host()+' path:'+uri.path()+' query:'+uri.query()+' v:'+uri.getQueryParamValue('v'));
        var match = false;
        for (site in _.site_mapping) {
            if (_.findStringInArray(uri.host(), _.site_mapping[site])) {
                _[site].retreiveDetails(uri.getQueryParamValue('v'), successFunc, failFunc);
                match = true;
                break;
            }
        }

        if (!match) {
            console.debug('ERROR '+this+': unsupported url ['+url+']');
        }
    }

    _.youtube.retreiveDetails = function(vid_id, successFunc) {
        $.ajax({
                url: "http://gdata.youtube.com/feeds/api/videos/"+vid_id+"?v=2&alt=json",
                dataType: "jsonp",
                success: function (data) { 
                            console.log('GET successful');
                            console.log(data);
                            var details = {};
                            details['title'] = data.entry.title.$t;
                            details['description'] = data.entry.media$group.media$description.$t;
                            details['embed_url'] = data.entry.content.src;
                            details['thumbnail'] = data.entry.media$group.media$thumbnail[0].url;
                            details['duration'] = data.entry.media$group.yt$duration.seconds;
                            details['vid_id'] = vid_id;
                            details['visit_url'] = 'http://youtube.com/watch?v='+vid_id;
                            details['source'] = 'youtube';
                            successFunc(details); 
                        },
                error: function (jqXHR, textStatus, errorThrown) {
                            console.log('GET failed ['+textStatus+']: '+errorThrown);
                            failFunc();
                        }
            });
    }

    _.findStringInArray = function(string, stringArray) {
        var num_entries = stringArray.length;
        for (var j=0; j< num_entries; j++) {
            //console.log('findStringInArray: '+string+' == '+stringArray[j]);
            if (stringArray[j].match (string)) return true;
        }
        return false;
    }
    return pub;
}();


net.silverbucket.vidmarks.UI = function() {
    var pub = {};
    var _ = {};

    pub.newVidmark = function(details) {
        console.log('newVidmark called with details...');
        console.log(details);
        $("#list_area").append('<article id="">'
                    '<tr><td>'+details['title']+'</td></tr>'+
                    '<tr><td>'+details['url']+'</td></tr>'+
                    '<tr><td>'+details['description']+'</td></tr>';
    }

    pub.errorVidmark = function() {
        console.log('errorVidmark called!');
    }
    return pub;
}();



$(document).ready(function() {
    var navMenu = net.silverbucket.vidmarks.navMenu;
    navMenu.init(['list', 'submit']);
    navMenu.toggle('submit');

    var DB = net.silverbucket.vidmarks.DBModel;
    DB.init();
    var UI = net.silverbucket.vidmarks.UI;
    var vidAPI = net.silverbucket.vidmarks.publicVideoSiteAPI;


    /*
     * navigation
     */
    $("a#link-submit").click(function() {
        navMenu.toggle('submit');
        return false;
    }); 

    $("a#link-list").click(function() {
        navMenu.toggle('list');

        var list = DB.getAll();

        var new_table_rows = '[]';
        for (e in list) {
            console.log(e);
        }
        $('#list_area tbody').html(new_table_rows);

        return false;
    });
    /* */


    /* 
     * form controls 
     */
    $("input#input_vid_url").bind('paste', function(event) {
        var _this = this;
        // Short pause to wait for paste to complete
        setTimeout( function() {
            var url = $(_this).val();
            vidAPI.retreiveDetails(url, UI.newVidmark, UI.errorVidmark);
        }, 100);
    });

    $("form#submit_url_form").validate({
        //set the rules for the field names
        rules: {
            vid_url: {
                minlength: 4,
                url: true
            },
        },
        //set messages to appear inline
        messages: {
            vid_url: ""
        },
        submitHandler: function(form) {
            console.log('form submittion passed validation');
            url = $('#input_vid_url').val();
            DB.addBookmark(url);
            $('#input_vid_url').val('');
            return false;
        }
    });
    /* */
        
});