if(!net) var net={};
if(!net.silverbucket) net.silverbucket={};
if(!net.silverbucket.vidmarks) net.silverbucket.vidmarks={};


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
    _.doc_type = 'videos';
    _.cache = {};

    pub.init = function() {
        console.log('- DB: init()');
        remoteStorage.claimAccess('videos', 'rw');
        remoteStorage.claimAccess('tags', 'rw');
        remoteStorage.displayWidget('remotestorage-connect'); // after that (not before that) display widget

        _.modules.videos    = remoteStorage.videos;
        _.modules.tags      = remoteStorage.tags.getPrivateListing('videos');

        // testing events, changing, behavior
        _.modules.videos.on('error', function(err) {
            console.log('DB ERROR: videos - '+err);
        });

        // if a video is deleted, we need to remove tag references to it.
        _.modules.videos.on('change', function(event) {
            console.log('DB CHANGE: videos on(change) fired. :', event);
            if ((typeof event.newValue === "object") && (typeof event.oldValue === "object")) {
                //updateBookmarkRow(event.path, event.newValue);
            } else if (typeof event.newValue === "object") {
                //addBookmarkRow(event.path, event.newValue);
            } else if (event.oldValue !== undefined) {
                _.modules.tags.removeRecord(event.oldValue.source+'_'+event.oldValue.vid_id);
            }
        });

        _.modules.tags.on('error', function(err) {
            console.log('DB ERROR: tags - '+err);
        });

        _.modules.tags.on('change', function(obj) {
            console.log('DB CHANGE: tags on(change) fired.');
            console.log(obj);
            if (obj.origin === 'window') {
                //
            }
        });
    };

    pub.onAction = function(action, func) {
        _.modules.videos.on(action, function(obj) {
            func(obj);
        });
    };

    // set a temp cache of video details, used for saving in the addVidmark function
    pub.setCache = function(category, details) {
        console.log('setCache('+category+')', details);
        _.cache[category] = details;
    };

    pub.getCache = function(category) {
        var results = [];
        if (_.cache[category]) {
            results = _.cache[category];
        }
        return results;
    };

    pub.getAllTags = function() {
        return _.modules.tags.getTags();
    };

    pub.getUsedTags = function() {
        var tags = _.modules.tags.getAllTags();
        var used_tags = [];
        var vidmarks = pub.getAll();

        var num_tags = tags.length;
        for (var i = 0; i < num_tags; i++) {
            var tagRecords = _.modules.tags.getTagged(tags[i]);
            var count = 0;
            var num_tagRecords = tagRecords.length;
            for (var j = 0; j < num_tagRecords; j++) {
                if (!vidmarks[tagRecords[j]]) {
                    //console.log('DB_getTagCounts - remove record['+tags[i]+'] from tag');
                    _.modules.tags.removeTagged(tags[i], tagRecords[j]);
                } else {
                    //console.log('DB_getTagCounts - add count for record ['+tags[i]+']');
                    used_tags.push(tags[i]);
                }
            }
        }
        return used_tags;
    };

    pub.getTagCounts = function() {
        var tags = pub.getUsedTags();
        var num_tags = tags.length;
        var r_struct = {};
        for (var i = 0; i < num_tags; i++) {
            var tagRecords = _.modules.tags.getTagged(tags[i]);
            r_struct[tags[i]] = tagRecords.length; //tag_recs.length;
        }
        return r_struct;
    };

    pub.getTagsByRecord = function(recordId) {
        var tags = _.modules.tags.getTagsByRecord(recordId);
        console.log('DB getTagsByRecord('+recordId+') -- result: ', tags);
        return tags;
    };

    pub.addTagsToRecord = function(recordId, tagNames, completedFunc) {
        _.modules.tags.addTagsToRecord(recordId, tagNames);
        completedFunc();
    };

    pub.addVidmark = function(vidmark_id) {
        if (!_.cache) {
            console.log('CACHE not set, cannot save');
            return false;
        }
        var details = pub.getCache('video');
        var tags = pub.getCache('tags');
        //console.log(details);
        var cache_id = details.source+'_'+details.vid_id;
        if (vidmark_id === cache_id) {
            console.log('ID match! we can save');
            _.modules.videos.add(details, cache_id);
            _.modules.tags.addTagsToRecord(cache_id, tags);
        } else {
            console.log('IDs do not match ['+vidmark_id+' = '+cache_id+']');
        }
        //var new_id = _.modules.bookmarks.add(url, title, description);
        //return new_id;
    };


    /**
     * Function: removeVidmark
     *
     * removes the vidmark from the videos module
     *
     * Parameters:
     *
     *   video_id - id of vidmark to be removed
     *
     */
    pub.removeVidmark = function(video_id) {
        _.modules.tags.removeRecord(video_id);
        _.modules.videos.remove(video_id);
    };

    pub.getAll = function() {
        console.log('- DB: getAll()');
        var ids = _.modules.videos.getIds();
        var all = {};
        var num_ids = ids.length;
        for (var i = 0; i < num_ids; i++) {
            var obj = _.modules.videos.get(ids[i]);
            all[ids[i]] = obj;
        }
        return all;
    };

    pub.getById = function(id) {
        var obj = _.modules.videos.get();
        return obj;
    };

    pub.deleteAllVideos = function() {
        console.log('- DB: deleteAllVideos()');
        var ids = _.modules.videos.getIds();
        console.log(ids);
        var all = {};
        var num_ids = ids.length;
        for (var i = 0; i < num_ids; i++) {
            _.modules.videos.remove(ids[i]);
        }
        return all;
    };

    return pub;
}();
