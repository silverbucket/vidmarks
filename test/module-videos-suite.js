if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(['requirejs'], function(requirejs, undefined) {
var suites = [];
suites.push({
  name: "videos module",
  desc: "collections of tests for the videos.js module",
  setup: function(env) {
    env.presets = {};
    // a sample data set which should properly represet the way remoteStorage
    // data is stored.
    env.remoteStorage = new this.Stub.mock.remoteStorage({
      '12345': {
        'title': 'lolcats',
        'description': 'lolcat video compilation',
        'embed_url': 'http://youtube.com/yasysy.swf',
        'thumbnail': 'http://youtube.com/yasysy.png',
        'duration': 192,
        'vid_id': 'yasysy',
        'visit_url': 'http://youtube.com/watch?v=yasysy',
        'source': 'youtube',
        'content_type': 'application/x-shockwave-flash'
      },
      'abcde': {
        'title': 'cars',
        'description': 'cars are magic',
        'embed_url': 'http://youtube.com/hayehs.swf',
        'thumbnail': 'http://youtube.com/hayehs.png',
        'duration': 251,
        'vid_id': 'hayehs',
        'visit_url': 'http://youtube.com/watch?v=hayehs',
        'source': 'youtube',
        'content_type': 'application/x-shockwave-flash'
      }
    });

    this.assertTypeAnd(env.remoteStorage, 'function');
    this.assertTypeAnd(env.remoteStorage.baseClient, 'function');
    this.assertType(env.remoteStorage.defineModule, 'function');

    global.remoteStorage = env.remoteStorage;
    var moduleImport = requirejs('./js/rs_modules/videos.js');
    // if we loaded the tag module correctly, it should have returned
    // a function for us to use.
    console.log(env.moduleImport);
    this.assertTypeAnd(env.moduleImport, 'function');
    env.vidModule = moduleImport[1](env.remoteStorage.baseClient, env.remoteStorage.baseClient).exports;
    this.assertType(env.vidModule, 'object');
  },
  tests: [
    {
      desc: "vid module has getIds function",
      run: function(env) {
        this.assertType(env.vidModule.getIds, 'function');
      }
    },
    {
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
    }
  ],
  takedown: function(env) {
    delete global.remoteStorage;
    env.vidModule.on('error', function(err) {});
    this.result(true);
  }
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
