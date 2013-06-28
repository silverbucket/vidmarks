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
define(['js/rs_modules/videos'], function(moduleImport, undefined) {
var suites = [];
suites.push({
  name: "videos module",
  desc: "collections of tests for the videos.js module",
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
      ///env.client = root;

      // if we loaded the tag module correctly, it should have returned
      // a function for us to use.
      test.assertTypeAnd(moduleImport, 'object');
      env.vidModule = moduleImport;
      test.assertTypeAnd(env.vidModule, 'object');


      console.log('serverHelper:',serverHelper);
      env.serverHelper = serverHelper;
      util.extend(env.serverHelper, nodejsExampleServer.server);
      env.serverHelper.disableLogs();
      env.serverHelper.start(curry(test.result.bind(test), true));
    });

  },
    takedown: function(env, test) {
    env.serverHelper.stop(function() {
      test.result(true);
    });
  },
  beforeEach: function (env, test) {
    // BEFORE EACH TEST
    env.serverHelper.resetState();
    env.serverHelper.setScope(['videos:rw']);

    env.rsConnect = function() {
      env.remoteStorage.setStorageInfo(
        env.serverHelper.getStorageInfo()
      );
      env.remoteStorage.setBearerToken(
        env.serverHelper.getBearerToken()
      );
      return env.remoteStorage.claimAccess('videos', 'rw');
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
      desc: "vid module has getIds function",
      run: function(env) {
        this.assertType(env.vidModule.getIds, 'function');
      }
    },
    {
      desc: "add some records",
      run: function(env, test) {
        env.vidModule.on('error', function(err) {
          console.log('DB ERROR: videos (teste) - ',err);
          this.result(false, 'onError called with errors');
        });
        return env.vidModule.add(env.records.dogsandbacon, '098765a').then(function (result) {
          test.result(true);
        }, function (err) {
          test.result(false, err);
        });

      }
    },
    {
      desc: "getTagsByRecord should return 'dog' in list of tag names",
      run: function(env, test) {
        return env.vidModule.add(env.records.dogsandbacon, '098765a').then(function (result) {
          return env.vidModule.get('098765a').then(function (result) {
            test.assert(result, env.records.dogsandbacon);
          });
        });
      }
    },
    {
      desc: "getIds should return our list of video ids",
      run: function(env, test) {
        return env.vidModule.add(env.records.dogsandbacon, '098765a').then(function (result) {
          return env.vidModule.add(env.records.blue, '123456');
        }).then(function (result) {
          return env.vidModule.getIds().then(function (result) {
            test.assert(result, ['098765a','123456']);
          });
        });
      }
    },
    {
      desc: "lets submit an invalid record",
      willFail: true,
      run: function(env, test) {
        console.log('record: ', env.records.invalid);
        return env.vidModule.add(env.records.invalid, '5555').then(function (result) {
          console.log('returned true: ', result);
          test.result(treu, 'sucessfully submitted invalid schema!?');
        }, function (err) {
          console.log('returned false: ', err);
          test.result(false);
        });
      }
    }
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
