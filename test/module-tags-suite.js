module.exports = function() {
var suites = [];
suites.push({
    name: "tags module",
    desc: "collections of tests for the global_tags.js module",
    setup: function(env) {
        env.presets = {};
        // a sample data set which should properly represet the way remoteStorage
        // data is stored.
        env.presets.data = {
            'names': {
                'dog': { 'videos': [ '12345', '67890', 'abcde', 'fghij' ]},
                'cat': { 'videos': [ '34567', 'abcde' ]},
                'horse': { 'videos': [ '12345', 'fghij', '67890' ]},
                'aardvark': { 'videos': [ '34567', 'defgh' ]}
            },
            'reverse': {
                'videos': {
                    '12345': ['horse', 'dog'],
                    '67890': ['horse', 'dog'],
                    'abcde': ['cat', 'dog'],
                    'fghij': ['horse', 'dog'],
                    '34567': ['cat', 'aardvark'],
                    'defgh': ['aardvark']
                }
            }
        };
        // the expected restults from the various module functions called
        env.presets.docType = 'videos';
        env.presets.getTags = ['dog', 'cat', 'horse', 'aardvark'];
        env.presets.getTagsByRecord = ['dog', 'horse'];
        env.presets.getTagged = ['34567', 'defgh'];


        env.defineModule = new this.Stub(function(name, func) {
            ret = [];
            ret[0] = name;
            ret[1] = func;
            return ret;
        });

        env.baseClient = new this.Stub(function(p) {
            console.log('privae/public client called');
            var args = Array.prototype.slice.call(arguments);
            return args;
        });

        env.baseClient.use = new this.Stub(function() {
            return true;
        });

        // getListing calls are handle by this stub
        env.baseClient.getListing = new this.Stub(function(path) {
            if (path.match(/^names\/$/) !== -1) {
                // getTags()
                // return list of tag names
                var num_tags = env.presets.data.names.length;
                var ret = [];
                for (var key in env.presets.data.names) {
                    ret.push(key);
                }
                return ret;
            }
            return false;
        });

        // getObject calls are handled by this stub
        env.baseClient.getObject = new this.Stub(function(path) {
            var p;
            var d = false;
            if (path.match(/^\w+\/\w+\/\d+$/)) {
                p = path.match(/^(\w+)\/(\w+)\/(\d+)$/);
            } else if (path.match(/^\w+\/\w+\/\w+$/) !== -1) {
                p = path.match(/^(\w+)\/(\w+)\/(\w+)$/);
            } else {
                return false;
            }

            if (!env.presets.data[p[1]][p[2]]) {
                // this tag name or docType doesn't exist
                return [];
            } else if (!env.presets.data[p[1]][p[2]][p[3]]) {
                // this docType or recordID doesn't exist
                return [];
            }

            d = env.presets.data[p[1]][p[2]][p[3]];
            return d;
        });

        // storeObject calls are handled by this stub
        env.baseClient.storeObject = new this.Stub(function(type, path, obj) {
            var p;
            var d = false;
            if (path.match(/^\w+\/\w+\/\d+$/)) {
                p = path.match(/^(\w+)\/(\w+)\/(\d+)$/);
            } else if (path.match(/^\w+\/\w+\/\w+$/) !== -1) {
                p = path.match(/^(\w+)\/(\w+)\/(\w+)$/);
            } else {
                return false;
            }

            if (!env.presets.data[p[1]][p[2]]) {
                // this tag name or docType doesn't exist
                if (p[1] === 'names') {
                    // this tag does not exist, create it
                    env.presets.data[p[1]][p[2]] = {};
                    env.presets.data[p[1]][p[2]][p[3]] = [];
                } else {
                    return false;
                }
            } else if (!env.presets.data[p[1]][p[2]][p[3]]) {
                // this docType or recordID doesn't exist
                if (p[1] === 'reverse') {
                    // this recordID does not exist, create it
                    env.presets.data[p[1]][p[2]][p[3]] = [];
                } else {
                    return false;
                }
            }

            var tmp = env.presets.data[p[1]][p[2]][p[3]];
            env.presets.data[p[1]][p[2]][p[3]] = obj;
        });


        this.result(true);
    },
    takedown: function() {
        delete global.remoteStorage;
        this.result(true);
    },
    tests: [
        {
            desc: "confirm defineModule stub function works",
            run: function(env) {
                var func = env.defineModule;
                vals = func('one','two');
                params = ['one', 'two'];
                this.assert(params, vals);
            }
        },
        {
            desc: "confirm baseClient stub function works",
            run: function(env) {
                var func = env.baseClient;
                vals = func('one','two', 'three', 'four', 'five', 'six');
                params = ['one', 'two', 'three', 'four', 'five', 'six'];
                this.assert(params, vals);
            }
        },
        {
            desc: "load global tags module",
            run: function(env) {
                var remoteStorage = {};
                remoteStorage.defineModule = env.defineModule;
                global.remoteStorage = remoteStorage;

                env.rs = require('../js/rs_modules/global_tags.js');
                // if we loaded the tag module correctly, it should have returned
                // a function for us to use.
                this.assertType(env.rs[1], 'function');
            }
        },
        {
            desc: "initialize module",
            run: function(env) {
                env.tagModule = env.rs[1](env.baseClient,env.baseClient);
                this.assertType(env.tagModule, 'object');
            }
        },
        {
            desc: "tag module has name attribute",
            run: function(env) {
                this.assert(env.tagModule.name, 'tags');
            }
        },
        {
            desc: "tag module has exports",
            run: function(env) {
                this.assertType(env.tagModule.exports, 'object');
            }
        },
        {
            desc: "tag module has getTags function",
            run: function(env) {
                this.assertType(env.tagModule.exports.getTags, 'function');
            }
        },
        {
            desc: "getTags should return our preset list of tag names",
            run: function(env) {
                var d = env.tagModule.exports.getTags();
                this.assert(d, env.presets.getTags);
            }
        },
        {
            desc: "setDocType should be called",
            run: function(env) {
                env.tagModule.exports.setDocType(env.presets.docType);
                this.assert(env.tagModule.exports.docType, env.presets.docType);
            }
        },
        {
            desc: "getTagsByRecord should return a list of tags for that id",
            run: function(env) {
                var d = env.tagModule.exports.getTagsByRecord('12345');
                this.assert(d, env.presets.getTagsByRecord);
            }
        },
        {
            desc: "getTagged should return a list of ids for that tag",
            run: function(env) {
                var d = env.tagModule.exports.getTagged('aardvark');
                this.assert(d, env.presets.getTagged);
            }
        },
        {
            desc: "addTagged should add a list of ids to a tag",
            run: function(env) {
                env.tagModule.exports.addTagged('aardvark', ['qwerty', 'foobar']);
                var d = env.tagModule.exports.getTagged('aardvark');
                env.presets.getTagged.push('qwerty');
                env.presets.getTagged.push('foobar');
                this.assert(d, env.presets.getTagged);
            }
        },
        {
            desc: "addTagsToRecord should add a list of tags to a recordId",
            run: function(env) {
                env.tagModule.exports.addTagsToRecord(['67890', '12345'], ['penguin', 'travel']);
                var d = env.tagModule.exports.getTagsByRecord('67890');
                env.presets.getTagsByRecord.push('penguin');
                env.presets.getTagsByRecord.push('travel');
                this.assert(d, env.presets.getTagsByRecord);
            }
        },
        {
            desc: "removeTagged should remove recordID from a tag",
            run: function(env) {
                env.tagModule.exports.removeTagged('travel', '67890');
                var d = env.tagModule.exports.getTagged('travel');
                this.assert(d, ['12345']);
            }
        },
        {
            desc: "verify that the reverse lookup was updated as well",
            run: function(env) {
                var d = env.tagModule.exports.getTagsByRecord('67890');
                this.assert(d, ['dog', 'horse', 'penguin']);
            }
        },
        {
            desc: "removeRecord should remove recordID from all tags",
            run: function(env) {
                env.tagModule.exports.removeRecord('12345');
                var d = env.tagModule.exports.getTagsByRecord('12345');
                this.assert(d, []);
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
}();
