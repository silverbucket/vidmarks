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

    pub.retrieveDetails = function(url, successFunc, failFunc) {
        if (!url) {
            console.debug('ERROR '+this+': url param required.');
            return false;
        }

        var uri = new Uri(url);
        console.log('DEBUG: host:'+uri.host()+' path:'+uri.path()+' query:'+uri.query()+' v:'+uri.getQueryParamValue('v'));
        var match = false;
        for (site in _.site_mapping) {
            if (_.findStringInArray(uri.host(), _.site_mapping[site])) {
                _[site].retrieveDetails(uri.getQueryParamValue('v'), successFunc, failFunc);
                match = true;
                break;
            }
        }

        if (!match) {
            console.debug('ERROR '+this+': unsupported url ['+url+']');
        }
    }

    _.youtube.retrieveDetails = function(vid_id, successFunc) {
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




/** 
 * dbModel - provides an abraction for the various remoteStorage.js modules required.
 *
 * requires: remoteStorage.js
 */
net.silverbucket.vidmarks.dbModel = function() {
    var pub = {}; // public variable and functions container
    var _ = {}; // private variable and functions container

    _.modules = {}; // module objects for RS
    _.app_namespace = 'vidmarks';


    pub.init = function() {
        console.log('- DB: init()');
        remoteStorage.claimAccess('bookmarks', 'rw');
        remoteStorage.claimAccess('videos', 'rw');
        remoteStorage.displayWidget('remotestorage-connect'); //after that (not before that) display widget

        console.log('- DB: getting priviteLists...');
        _.modules.bookmarks = remoteStorage.bookmarks.getPrivateList(_.app_namespace);
        _.modules.videos    = remoteStorage.videos.getPrivateList('vidmarks');

        _.modules.videos.on('error', function(err) {
            console.log('DB ERROR: '+err);
        });

        // XXX - this function returns only obj, not id [original params were (id, obj)]
        _.modules.videos.on('change', function(obj) {
            console.log('DB CHANGE: bookmarks on(change) fired.');
            console.log(obj);
        });
    }

    // set a temp cache of video details, used for saving in the addVidmark function
    pub.setCache = function(details) {
        console.log('setCache()');
        //console.log(details);
        _.cache = details;
    }
    pub.getCache = function() {
        return _.cache;
    }

    pub.addVidmark = function(vidmark_id) {
        if (!_.cache) {
            console.log('CACHE not set, cannot save');
            return false;
        }
        details = pub.getCache();
        //console.log(details);
        cache_id = details['source']+'_'+details['vid_id'];
        if (vidmark_id === cache_id) {
            console.log('ID match! we can save');
            _.modules.videos.add(details);
        } else {
            console.log('IDs do not match ['+vidmark_id+' = '+cache_id+']');
        }
        //var new_id = _.modules.bookmarks.add(url, title, description);
        //return new_id;
    }

    pub.getAll = function() {
        console.log('- DB: getAll()');
        var ids = _.modules.videos.getIds();
        var all = {};
        var num_ids = ids.length;
        for (i = 0; i < num_ids; i++) {
            obj = _.modules.videos.get(ids[i]);
            all[ids[i]] = obj;
        }
        return all;
    }

    pub.getById = function(id) {
        return _.modules.videos.get();
    }

    pub.deleteAll = function() {
        console.log('- DB: deleteAll()');
        var ids = _.modules.videos.getIds();
        console.log(ids);
        var all = {};
        for (id in ids) {
            _.modules.videos.remove(id);
        }
        return all;
    }

    return pub;
}();


/**
 * appLogic - generic app related methods and logic
 *
 * requires: jquery
 */
net.silverbucket.vidmarks.appLogic = function() {
    var pub = {};
    var _ = {};

    pub.init = function() {
        _.nav = net.silverbucket.vidmarks.navMenu;
        _.nav.init(['list']);//, 'submit']);
        _.nav.toggle('list');
        _.db = net.silverbucket.vidmarks.dbModel;
        _.db.init();
        _.vidAPI = net.silverbucket.vidmarks.publicVideoSiteAPI;


        /*
         * navigation
         */
        $("a#link-submit").click(function() {
            _.nav.toggle('submit');
            return false;
        }); 

        $("a#link-list").click(function() {
            _.nav.toggle('list');

            pub.displayVidmarkList();

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
                _.vidAPI.retrieveDetails(url, pub.displayNewVidmark, pub.displayErrorVidmark);
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
                _.db.addVidmark(url);
                $('#input_vid_url').val('');
                return false;
            }
        });
        /* */ 

        pub.displayVidmarkList();
    }
    /*******************************/


    _.vidmark_enrtries = {};
    _.templates = {};


    // title, visit_url, visit_url (readable), description, embed_url
    _.templates.display_vidmark = '<div class="video_details"><h1>{0}</h1>'+
                '<a target="_blank" href="{2}">{3}</a>'+
                '<div class="description"><h3>description</h3><p class="description">{4}</p></div></div>'+
                '<div class="video_embed"><iframe id="ytplayer" type="text/html" width="640" height="390" '+
                'src="{5}?autoplay=0&origin=http://example.com" '+
                'frameborder="0"/></div>';

    // present new vidmark data for submition
    pub.displayNewVidmark = function(details) {
        console.log('newVidmark called with details...');
        // /console.log(details);
        _.db.setCache(details); // cache the details in case of save

        $("#vidmarks").append('<article id="'+details['source']+'_'+details['vid_id']+'" class="new_vidmark vidmark">'+
                    '<div id="save_status"><a href="#add" class="button stretch" id="add-vidmark">add video</a></div>'+
                    _.string_inject(_.templates.display_vidmark, 
                            [details['title'], details['visit_url'], details['visit_url'], 
                            details['description'], details['embed_url']])+
                    '</article>'
                );

        // add listener for save call
        $("a#add-vidmark").click(function() {
            vidmark_id = $(this).parent().parent().attr('id');
            console.log('vidmark_id['+vidmark_id+']');
            $('#save_status').html('<p class="status">saving video</p>');
            _.db.addVidmark(vidmark_id);
            $('#save_status').html('<p class="success">video saved! view <a href="#videos" id="quicklink-list">video list</a></p>');
            $(this).parent().parent().addClass('saved');
            $("a#quicklink-list").click(function() {
                _.nav.toggle('list');
                pub.displayVidmarkList();
                return false;
            }); 

            return false;
        });
    }

    pub.displayVidmarkList = function() {
        console.log('displayVidmarkList');
        var list = _.db.getAll();
        console.log(list);
        $("#vidmarks").html('');

        _.vidmark_entries = {};
        var last_key;
        for (e in list) {
            _.vidmark_entries[list[e]['source']+'_'+list[e]['vid_id']] = 
                    '<article id="'+list[e]['source']+'_'+list[e]['vid_id']+'" class="vidmark">'+
                    _.string_inject(_.templates.display_vidmark, 
                            [list[e]['title'], list[e]['visit_url'], list[e]['visit_url'], 
                            list[e]['description'], list[e]['embed_url']])+
                    '</article>';
            last_key = list[e]['source']+'_'+list[e]['vid_id']
        }
        $("#vidmarks").append(_.vidmark_entries[last_key]);
        //$('#list_area tbody').html(new_table_rows);
    }

    pub.displayErrorVidmark = function() {
        console.log('errorVidmark called!');
    }
    

    /* 
     * stolen from:
     * http://mattsnider.com/template-string-replacement-function/
     */
    _.string_inject = function(sSource, aValues) {
        var i = 0;
     
        if (aValues && aValues.length) {
            return sSource.replace(/\{\d+\}/g, function(substr) {
                var sValue = aValues[i];
     
                if (sValue) {
                    i += 1;
                    return sValue;
                }
                else {
                    return substr;
                }
            })
        }
        return sSource;
    }

    return pub;
}();



$(document).ready(function() {
    var app = net.silverbucket.vidmarks.appLogic;
    app.init();
});