if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
require.config({
  paths: {
    rs: 'vendor/remoteStorage/src',
    rs_base: 'vendor/remoteStorage'
  }
});
global.localStorage = require('localStorage');
define(['js/vidmarks/dbmodel'], function(db, undefined) {
var suites = [];
suites.push({
  name: "tags module",
  desc: "collections of tests for the global_tags.js module",
  setup: function(env, test) {

    env.records = {
      dogsandbacon : {
        'title': 'dogs and bacon',
        'description': 'dogs love bacon',
        'embed_url': 'http://youtube.com/098765.swf',
        'thumbnail': 'http://youtube.com/098765.png',
        'duration': 781,
        'vid_id': '098765a',
        'visit_url': 'http://youtube.com/watch?v=098765',
        'source': 'youtube',
        'content_type': 'application/x-shockwave-flash'
      },
      blue : {
        'title': 'blue',
        'description': 'things that are blue',
        'embed_url': 'http://youtube.com/lalal.swf',
        'thumbnail': 'http://youtube.com/lalal.png',
        'duration': 423,
        'vid_id': '123456',
        'visit_url': 'http://youtube.com/watch?v=123456',
        'source': 'youtube',
        'content_type': 'application/x-shockwave-flash'
      },
      invalid : {
        'title': 'invalid',
        'description': 'invalid record',
        'embed_url': 'http://youtube.com/lalal.swf',
        'thumbnail': 'http://youtube.com/lalal.png',
        'duration': "423", // should be a number
        'vid_id': '5555',
        'visit_url': 'http://youtube.com/watch?v=5555',
        'source': 'youtube',
        'content_type': 'application/x-shockwave-flash'
      }
    };

    requirejs([
      'rs/lib/util',
      'rs/remoteStorage',
      'rs/lib/store',
      'rs/lib/sync',
      'rs_base/test/helper/server',
      'rs_base/server/nodejs-example'
    ], function(_util, remoteStorage, store, sync, serverHelper, nodejsExampleServer) {
      util = _util;
      curry = util.curry;
      env.remoteStorage = remoteStorage;
      env.store = store;
      env.sync = sync;

      // if we loaded the tag module correctly, it should have returned
      // a function for us to use.
      test.assertTypeAnd(db, 'object');
      test.assertTypeAnd(db.init, 'function');
      env.db = db;

      console.log('serverHelper:',serverHelper);
      env.serverHelper = serverHelper;
      util.extend(env.serverHelper, nodejsExampleServer.server);
      env.serverHelper.disableLogs();
      env.serverHelper.start(curry(test.result.bind(test), true));
    });

  },
  timeout: 15000,
  takedown: function(env, test) {
    env.serverHelper.stop(function() {
      test.result(true);
    });
  },
  beforeEach: function (env, test) {
    // BEFORE EACH TEST
    env.serverHelper.resetState();
    env.serverHelper.setScope(['tags:rw', 'videos:rw']);

    env.rsConnect = function() {
      env.remoteStorage.setStorageInfo(
        env.serverHelper.getStorageInfo()
      );
      env.remoteStorage.setBearerToken(
        env.serverHelper.getBearerToken()
      );
      return env.remoteStorage.claimAccess({tags: 'rw', videos: 'rw'});
    };
    env.rsConnect().then(function() {
      test.result(true);
    });

  },
  afterEach: function (env, test) {
    env.remoteStorage.sync.needsSync('/').then(function(unsynced) {
      // if unsynced is true, somethings wrong
      if (unsynced) {
        test.result(false, 'client needsSync = true, thats not good');
      }
      env.remoteStorage.flushLocal().then(curry(test.result.bind(test), true));
    });
  },
  tests: [
    {
      desc: "db init",
      run: function(env, test) {
        return env.db.init(true).then(function() {
          test.result(true);
        });
      }
    },
    {
      desc: "db.addVidmark / db.getAll",
      run: function(env, test) {
        var record_id = env.records.dogsandbacon.source+'_'+env.records.dogsandbacon.vid_id;
        return env.db.init(true).then(function() {
          env.db.setCache('video', record_id, env.records.dogsandbacon);
          return db.addVidmark(record_id);
        }).then(function() {
          return env.db.getAll().then(function (records) {
            //console.log('TEST: getAll:result: ', records);
            var expected = {};
            expected[record_id] = env.records.dogsandbacon;
            //console.log('TEST: getAll:expected: ', env.records.dogsandbacon);
            test.assert(records, expected);
          }, function (err) {
            console.log('TEST: getAll: ERROR', err);
            test.result(false, 'TEST: getAll test error: '+err);
          });
        });
      }
    },
    {
      desc: "db.getAllTags",
      run: function(env, test) {
        var record_id = env.records.dogsandbacon.source+'_'+env.records.dogsandbacon.vid_id;
        return env.db.init(true).then(function() {
          env.db.setCache('video', record_id, env.records.dogsandbacon);
          env.db.setCache('tags', record_id, ['tagone', 'tagtwo', 'tagthree']);
          return db.addVidmark(record_id);
        }).then(function() {
          return env.db.getAllTags().then(function (tags) {
            test.assert(tags, ['tagone', 'tagtwo', 'tagthree']);
          }, function (err) {
            console.log('TEST: getAllTags:ERROR', err);
            test.result(false, 'TEST: getAllTags test error: '+err);
          });
        });
      }
    },
    {
      desc: "db.getUsedTags",
      run: function(env, test) {
        var record_id = env.records.blue.source+'_'+env.records.blue.vid_id;
        return env.db.init(true).then(function() {
          env.db.setCache('video', record_id, env.records.blue);
          env.db.setCache('tags', record_id, ['tagone', 'tagtwo', 'tagthree']);
          return db.addVidmark(record_id);
        }).then(function() {
          return env.db.getUsedTags().then(function (tags) {
            console.log('TEST: getUsedTags: tags:', tags);
            test.assert(tags, ['tagone', 'tagtwo', 'tagthree']);
          }, function (err) {
            console.log('TEST: getUsedTags:ERROR', err);
            test.result(false, 'TEST: getUsedTags test error: '+err);
          });
        });
      }
    },
    {
      desc: "db.getUsedTags - more complicated",
      run: function(env, test) {
        var record_id_blue = env.records.blue.source+'_'+env.records.blue.vid_id;
        var record_id_dab = env.records.dogsandbacon.source+'_'+env.records.dogsandbacon.vid_id;
        return env.db.init(true).then(function() {
          env.db.setCache('video', record_id_blue, env.records.blue);
          env.db.setCache('tags', record_id_blue, ['tagone', 'tagtwo', 'tagthree']);
          return db.addVidmark(record_id_blue);
        }).then(function() {
          env.db.setCache('video', record_id_dab, env.records.dogsandbacon);
          env.db.setCache('tags', record_id_dab, ['tagone', 'bacon', 'maple']);
          return db.addVidmark(record_id_dab);
        }).then(function() {
          return db.removeVidmark(record_id_dab);
        }).then(function() {
          return env.db.getUsedTags().then(function (tags) {
            console.log('TEST: getUsedTags: tags:', tags);
            test.assert(tags, ['tagone', 'tagtwo', 'tagthree']);
          }, function (err) {
            console.log('TEST: getUsedTags:ERROR', err);
            test.result(false, 'TEST: getUsedTags test error: '+err);
          });
        });
      }
    },
    {
      desc: "db.updateTagsForRecord",
      run: function(env, test) {
        var record_id_blue = env.records.blue.source+'_'+env.records.blue.vid_id;
        return env.db.init(true).then(function() {
          env.db.setCache('video', record_id_blue, env.records.blue);
          env.db.setCache('tags', record_id_blue, ['tagone', 'tagtwo', 'tagthree']);
          return env.db.addVidmark(record_id_blue);
        }).then(function() {
          return env.db.updateTagsForRecord(record_id_blue, ['tagone', 'blue']);
        }).then(function() {
          return env.db.getTagsByRecord(record_id_blue).then(function (tags) {
            console.log('TEST: getTagsByRecord: tags:', tags);
            test.assert(tags, ['tagone', 'blue']);
          }, function (err) {
            console.log('TEST: getUsedTags:ERROR', err);
            test.result(false, 'TEST: getUsedTags test error: '+err);
          });
        });
      }
    }
    /*{
      desc: "getTagsByRecord should return 'dog' in list of tag names",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.getTagsByRecord('dog1').then(function (result) {
            test.assert(result, ['dog']);
          });
        });
      }
    },
    {
      desc: "getTagsByRecord should return 'dog' and 'brown' list of tag names",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.addTagged('brown', ['dog1']);
        }).then(function (result) {
          return env.tagModule.getTagsByRecord('dog1').then(function (result) {
            test.assert(result, ['dog', 'brown']);
          });
        });
      }
    },
    {
      desc: "getTagsByRecord should return 'dog' 'little puppy' and 'brown' list of tag names",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.addTagged('brown', ['dog1']);
        }).then(function (result) {
          return env.tagModule.addTagged('little pup', ['dog1']);
        }).then(function (result) {
          return env.tagModule.getTagsByRecord('dog1').then(function (result) {
            test.assert(result, ['dog', 'brown', 'little pup']);
          });
        });
      }
    },
    {
      desc: "getTagged should return dog1,2,3 for the tag 'dog'",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.getTagged('dog').then(function (result) {
            test.assert(result, ['dog1', 'dog2', 'dog3']);
          });
        });
      }
    },
    {
      desc: "checking addTagsToRecord",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.addTagsToRecord('dog2', ['brown', 'little pup']);
        }).then(function (result) {
          return env.tagModule.getTagsByRecord('dog2').then(function (result) {
            test.assert(result, ['dog', 'brown', 'little pup']);
          });
        });
      }
    },
    {
      desc: "removeTagged should remove recordID from a tag - verify reverse lookup",
      run: function(env, test) {
        env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.addTagsToRecord('dog2', ['brown', 'little pup']);
        }).then(function (result) {
          return env.tagModule.removeTagged('brown', 'dog2');
        }).then(function (result) {
          return env.tagModule.getTagsByRecord('dog2');
        }).then(function (result) {
          test.assert(result, ['dog', 'little pup']);
        });
      }
    },
    {
      desc: "removeTagged should remove recordID from a tag",
      run: function(env, test) {
        env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.addTagged('brown', ['dog1', 'dog2', 'dog3']);
        }).then(function (result) {
          return env.tagModule.removeTagged('brown', 'dog2');
        }).then(function (result) {
          return env.tagModule.getTagged('brown');
        }).then(function (result) {
          test.assert(result, ['dog1', 'dog3']);
        });
      }
    },
    {
      desc: "removeRecord should remove recordID from all tags",
      run: function(env, test) {
        env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.addTagged('brown', ['dog1', 'dog2', 'dog3']);
        }).then(function (result) {
          return env.tagModule.removeRecord('dog2');
        }).then(function (result) {
          return env.tagModule.getTagged('brown');
        }).then(function (result) {
          test.assert(result, ['dog1', 'dog3']);
        });
      }
    }

/*
        {
            desc: "removeRecord should remove recordID from all tags",
            run: function(env) {
                env.tagModule.removeRecord('12345');
                var d = env.tagModule.getTagsByRecord('12345');
                this.assert(d, []);
            }
        },
        */
    ]
});

suites.push({
    name: "test global namespace reset",
    desc: "the global namespace should no longer have remoteStorage in it",
    tests: [
        {
            desc: "make sure the global namespace doesn't have remoteStorage anymore",
            run: function(env) {
                this.assertType(global.remoteStorage, 'undefined');
            }
        }
    ]
});
return suites;
});
