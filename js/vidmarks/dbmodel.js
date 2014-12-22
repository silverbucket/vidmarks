/**
 * dbModel - provides an abraction for the various remoteStorage.js modules required.
 *
 * requires: remoteStorage.js
 */
define(['rs/remoteStorage', 'js/rs_modules/global_tags', 'js/rs_modules/videos'], function (remoteStorage, global_tags, videos) {
  var pub = {}; // public variable and functions container
  var _ = {}; // private variable and functions container

  _.modules = {}; // module objects for RS
  _.app_namespace = 'vidmarks';
  _.doc_type = 'videos';
  _.cache = {};

  pub.init = function(noUI, cb) {
    setTimeout(function () {
      console.log('- DB: init()');

      remoteStorage.access.claim('videos', 'rw');
      remoteStorage.access.claim('tags', 'rw');

      if (!noUI) {
        remoteStorage.displayWidget('remotestorage-connect'); // after that (not before that) display widget
      }

      _.modules.videos    = remoteStorage.videos;
      _.modules.tags      = remoteStorage.tags.getPrivateListing('videos');
      cb();
    }, 0);
  };

  pub.onAction = function (action, func) {
    _.modules.videos.on(action, function(obj) {
      func(obj);
    });
  };

  // set a temp cache of video details, used for saving in the addVidmark function
  pub.setCache = function (category, key, details) {
    console.log('setCache('+category+') '+key+': ', details);
    /*if (!_.cache[category]) {
      _.cache[category] = {};
    }*/
    // only keep one record/tag combo in cash at a time, but we still organize
    // by key so that we dont accidently save records we did not intend
    _.cache[category] = {};
    _.cache[category][key] = details;

  };

  pub.getCache = function (category, key) {
    var results = [];
    if ((_.cache[category]) &&
        (_.cache[category][key])) {
      results = _.cache[category][key];
    }
    return results;
  };

  pub.getAllTags = function (cb) {
    _.modules.tags.getAllTags().then(function(results) {
      cb(null, results);
    });
  };

  pub.getUsedTags = function (cb) {
    var vidmarks;
    pub.getAll(function (_v) {
      vidmarks = _v;
      pub.getAllTags(function (tags) {
        var used_tags = [];
            console.log('*** vidmarks: ', vidmarks);
            console.log('*** tags: ', tags);

        function _getRecordsWithTag(tag, count) {
          _.modules.tags.getRecordsWithTag(tag).then(function (records) {
            console.log('*** records: ', records);
            for (var j = 0, jlen = records.length; j < jlen; j++) {
              if (!vidmarks[records[j]]) {
                console.log('DB_getTagCounts - CAUGHT invalid record, use to remove! - tag['+tag+'] record['+records[j]+']');
                //_.modules.tags.removeTagged(tag, tagRecords[j]);
              } else {
                console.log('DB_getTagCounts - add count for record ['+tag+']');
                used_tags.push(tag);
              }
            }

            if (count === 0) {
              cb(null, used_tags);
            }
          });
        }

        for (var i = length - 1; i >= 0; i--) {
          getRecordsWithTag(tags[i], i);
        }
      });
    });
  };

  pub.getTagCounts = function() {
    return pub.getUsedTags().then(function(tags) {
      var r_struct = {};
      return remoteStorage.util.asyncEach(tags, function (tag) {
        return _.modules.tags.getRecordsWithTag(tag).then(function(tagRecords) {
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

  //pub.addTagsToRecord = function(recordId, tagNames) {
  //  return _.modules.tags.addTagsToRecord(recordId, tagNames); //.then(completedFunc);
  //};

  pub.updateTagsForRecord = function(recordId, tagNames) {
    //console.log('DB: updateTagsForRecord()');
    return _.modules.tags.updateTagsForRecord(recordId, tagNames); //.then(completedFunc);
  };

  pub.addVidmark = function(vidmark_id, cb) {
    console.log('addVidmark : ' + vidmark_id);
    if (!_.cache) {
      return cb('CACHE not set, cannot save');
    }
    var details = pub.getCache('video', vidmark_id);
    console.log('cache: ', _.cache);
    console.log('cache details: ', details);
    var tags = pub.getCache('tags', vidmark_id);
    //console.log('** ADVIDMARK:',details);
    var cache_id = details.source + '_' + details.vid_id;
    if (vidmark_id === cache_id) {
      console.log('ID match! we can save');
      console.log('_', _);
      console.log('_.modules', _.modules);
      console.log('_.modules.videos', _.modules.videos);
      _.modules.videos.add(details, cache_id).then(function () {
        return _.modules.tags.addTagsToRecord(cache_id, tags);
      }).then(function () {
        cb();
      }, function (err) {
        cb('DB: addVidmark() ERRORS: ', errors);
      });
    } else {
      return cb('IDs do not match [' + vidmark_id + ' = ' + cache_id + ']');
    }
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

  pub.getAll = function (cb) {
    console.log('- DB: getAll()');
    var all = {};
    r_.modules.videos.getIds().then(function (ids) {

      function _getVideo(id, count) {
        _.modules.videos.get(id).then(function(obj) {
          all[id] = obj;
        });

        if (count === 0) {
          cb(null, all);
        }
      }

      for (var i = ids.length - 1; i >= 0; i--) {
        _getVideo(ids[i], i);
      }
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
