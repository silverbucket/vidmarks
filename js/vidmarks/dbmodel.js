/**
 * dbModel - provides an abraction for the various remoteStorage.js modules required.
 *
 * requires: remoteStorage.js
 */
define(['rs/remoteStorage', 'js/rs_modules/global_tags', 'js/rs_modules/videos'], function(remoteStorage, global_tags, videos) {
  var pub = {}; // public variable and functions container
  var _ = {}; // private variable and functions container

  _.modules = {}; // module objects for RS
  _.app_namespace = 'vidmarks';
  _.doc_type = 'videos';
  _.cache = {};

  pub.init = function() {
    console.log('- DB: init()');
    //remoteStorage.util.setLogLevel('debug');
    remoteStorage.claimAccess({ 'videos': 'rw', 'tags': 'rw' }).
      then(function() {
        remoteStorage.displayWidget('remotestorage-connect'); // after that (not before that) display widget

        // FOR DEBUGGING:
        remoteStorage.schedule.disable();
      });

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
    return _.modules.tags.getAllTags().then(function(results) {
      return results;
    });
  };

  pub.getUsedTags = function() {
    return _.modules.tags.getAllTags().then(function(tags) {
      var used_tags = [];
      var vidmarks = pub.getAll();

      return remoteStorage.util.asyncEach(tags, function(tag) {
        return _.modules.tags.getTagged(tag).then(function(tagRecords) {
          var count = 0;
          var num_tagRecords = tagRecords.length;
          for (var j = 0; j < num_tagRecords; j++) {
            /*if (!vidmarks[tagRecords[j]]) {
              //console.log('DB_getTagCounts - remove record['+tags[i]+'] from tag');
              _.modules.tags.removeTagged(tag, tagRecords[j]);
            } else {*/
              //console.log('DB_getTagCounts - add count for record ['+tags[i]+']');
              used_tags.push(tag);
            //}
          }
        });
      }).then(function(result, errors) {
        console.log('getUsedTags() ERRORS', errors);
        return used_tags;
      });

    });

  };

  pub.getTagCounts = function() {
    return pub.getUsedTags().then(function(tags) {
      var r_struct = {};
      return remoteStorage.util.asyncEach(tags, function (tag) {
        return _.modules.tags.getTagged(tag).then(function(tagRecords) {
          r_struct[tag] = tagRecords.length; //tag_recs.length;
        });
      }).then(function (result, errors) {
        console.log('getTagCounts() ERRORS', errors);
        return r_struct;
      });
    });
  };

  pub.getTagsByRecord = function(recordId) {
    return _.modules.tags.getTagsByRecord(recordId).then(function (tags) {
      console.log('DB getTagsByRecord('+recordId+') -- result: ', tags);
      return tags;
    });
  };

  pub.addTagsToRecord = function(recordId, tagNames, completedFunc) {
    _.modules.tags.addTagsToRecord(recordId, tagNames).then(completedFunc);
  };

  pub.updateTagsForRecord = function(recordId, tagNames, completedFunc) {
    _.modules.tags.updateTagsForRecord(recordId, tagNames).then(completedFunc);
  };

  pub.addVidmark = function(vidmark_id) {
    if (!_.cache) {
      console.log('CACHE not set, cannot save');
      return false;
    }
    var details = pub.getCache('video');
    var tags = pub.getCache('tags');
    //console.log('** ADVIDMARK:',details);
    var cache_id = details.source+'_'+details.vid_id;
    if (vidmark_id === cache_id) {
      console.log('ID match! we can save');
      return remoteStorage.util.asyncGroup(
        function() { return _.modules.videos.add(details, cache_id); },
        function() { return _.modules.tags.addTagsToRecord(cache_id, tags); }
      ).then(function (_, errors) {
        console.log('addVidmark() ERRORS: ', errors);
      });
    } else {
      console.log('IDs do not match ['+vidmark_id+' = '+cache_id+']');
      return remoteStorage.util.getPromise().failLater();
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
    return remoteStorage.util.asyncGroup(
      function () { return _.modules.tags.removeRecord(video_id); },
      function () { return _.modules.videos.remove(video_id); }
    ).then(function (_, errors) {
        console.log('addVidmark() ERRORS: ', errors);
    });
  };

  pub.getAll = function() {
    console.log('- DB: getAll()');
    var all = {};
    return _.modules.videos.getIds().then(function (ids) {
      return remoteStorage.util.asyncEach(ids, function (id) {
        return _.modules.videos.get(id).then(function(obj) {
          all[id] = obj;
        });
      }).then(function (_, errors) {
        console.log('getAll() ERRORS: ', errors);
        return all;
      });
    });
  };

  pub.getById = function (id) {
    return _.modules.videos.get().then(function(obj) {
      return obj;
    });
  };

  pub.deleteAllVideos = function () {
    console.log('- DB: deleteAllVideos()');
    return _.modules.videos.getIds().then(function (ids) {
      var all = {};
      console.log(ids);
      return remoteStorage.util.asyncEach(ids, function (id) {
        _.modules.videos.remove(ids[i]);
      }).then(function (_, errors) {
        console.log('deleteAllVideos() ERRORS: ', errors);
        return all;
      });
    });
  };

  return pub;
});
