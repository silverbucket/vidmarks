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
      }
    };
    requirejs([
      'rs/lib/util',
      'rs/remoteStorage',
      'rs/lib/store',
      'rs/lib/sync',
      'rs/modules/root',
      'rs_base/test/helper/server',
      'rs_base/server/nodejs-example'
    ], function(_util, remoteStorage, store, sync, root, serverHelper, nodejsExampleServer) {
      util = _util;
      curry = util.curry;
      env.remoteStorage = remoteStorage;
      env.store = store;
      env.sync = sync;
      env.client = root;


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
    env.serverHelper.setScope([':rw']);

    env.rsConnect = function() {
      env.remoteStorage.nodeConnect.setStorageInfo(
        env.serverHelper.getStorageInfo()
      );
      env.remoteStorage.nodeConnect.setBearerToken(
        env.serverHelper.getBearerToken()
      );
      return env.remoteStorage.claimAccess('root', 'rw');
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
    }
/*    {
      desc: "getIds should return our preset list of video ids",
      run: function(env) {
        var d = env.vidModule.getIds();
        var should_be = ['12345', 'abcde'];
        this.assert(d, should_be);
      }
    },
    {
      desc: "get should return an object",
      run: function(env) {
        var d = env.vidModule.get('12345');
        var should_be = {
          'title': 'lolcats',
          'description': 'lolcat video compilation',
          'embed_url': 'http://youtube.com/yasysy.swf',
          'thumbnail': 'http://youtube.com/yasysy.png',
          'duration': 192,
          'vid_id': 'yasysy',
          'visit_url': 'http://youtube.com/watch?v=yasysy',
          'source': 'youtube',
          'content_type': 'application/x-shockwave-flash'
        };
        this.assert(d, should_be);
      }
    },
    {
      desc: "add should add a new record",
      run: function(env) {
        var new_record = {
          'title': 'dogs and bacon',
          'description': 'dogs love bacon',
          'embed_url': 'http://youtube.com/098765.swf',
          'thumbnail': 'http://youtube.com/098765.png',
          'duration': 781,
          'vid_id': '098765a',
          'visit_url': 'http://youtube.com/watch?v=098765',
          'source': 'youtube',
          'content_type': 'application/x-shockwave-flash'
        };
        env.vidModule.on('error', function(err) {
          console.log('DB ERROR: videos (teste) - ',err);
        });
        var id = env.vidModule.add(new_record, '098765a');

        var retrieve = env.vidModule.get('098765a');
        this.assert(new_record, retrieve);
      }
    },
    {
      desc: "lets add a record with an invalid schema",
      willFail: true,
      run: function(env) {
        var new_record = {
          'title': 'dogs and bacon',
          'description': 'dogs love bacon',
          'embed_url': 'http://youtube.com/098765.swf',
          'thumbnail': 'http://youtube.com/098765.png',
          'duration': "781", // should be a number
          'vid_id': '098765',
          'visit_url': 'http://youtube.com/watch?v=098765',
          'source': 'youtube',
          'content_type': 'application/x-shockwave-flash'
        };

        env.vidModule.on('error', function(err) {
          console.log('DB ERROR: videos (teste) - '+err);
        });

        var id = env.vidModule.add(new_record, '098765');

        var retrieve = env.vidModule.get('098765');
        this.assert(new_record, retrieve);
      }
    }*/
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
