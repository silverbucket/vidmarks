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

define(['js/rs_modules/global_tags'], function(moduleImport, undefined) {
var suites = [];
suites.push({
  name: "tags module",
  desc: "collections of tests for the global_tags.js module",
  setup: function(env, test) {
    requirejs([
      'rs/lib/util',
      'rs/remotestorage',
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
      //env.client = root;

      // if we loaded the tag module correctly, it should have returned
      // a function for us to use.
      test.assertTypeAnd(moduleImport, 'object');
      test.assertTypeAnd(moduleImport.getPrivateListing, 'function');
      env.tagModule = moduleImport.getPrivateListing('videos');
      test.assertTypeAnd(env.tagModule, 'object');


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
    env.serverHelper.setScope(['tags:rw']);

    env.rsConnect = function() {
      env.remoteStorage.setStorageInfo(
        env.serverHelper.getStorageInfo()
      );
      env.remoteStorage.setBearerToken(
        env.serverHelper.getBearerToken()
      );
      return env.remoteStorage.claimAccess('tags', 'rw');
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
      desc: "tag module has getAllTags function",
      run: function(env) {
        this.assertType(env.tagModule.getAllTags, 'function');
      }
    },
    {
      desc: "add tags",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          test.result(true);
        }, function (err) {
          test.result(false, err);
        });

      }
    },
    {
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
      desc: "addTagsToRecord",
      run: function(env, test) {
        return env.tagModule.addTagsToRecord('dog1', ['little','brown','puppy']).then(function (result) {
          return env.tagModule.getTagsByRecord('dog1');
        }).then(function (tags) {
          test.assert(tags, ['little','brown','puppy']);
        });
      }
    },
    {
      desc: "updateTagsForRecord should remove tags not specified",
      run: function(env, test) {
        return env.tagModule.addTagsToRecord('dog1', ['little','brown','puppy']).then(function (result) {
          return env.tagModule.updateTagsForRecord('dog1', ['brown', 'adult']);
        }).then(function () {
          return env.tagModule.getTagsByRecord('dog1').then(function (result) {
            test.assert(result, ['brown', 'adult']);
          });
        });
      }
    },
    {
      desc: "getRecordsWithTag should return dog1,2,3 for the tag 'dog'",
      run: function(env, test) {
        return env.tagModule.addTagged('dog', ['dog1','dog2','dog3']).then(function (result) {
          return env.tagModule.getRecordsWithTag('dog').then(function (result) {
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
          return env.tagModule.getRecordsWithTag('brown');
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
          return env.tagModule.getRecordsWithTag('brown');
        }).then(function (result) {
          test.assert(result, ['dog1', 'dog3']);
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
