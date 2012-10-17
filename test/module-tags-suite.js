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
        env.presets.getTagged = ['34567', 'abcde'];


        env.defineModule = new this.Stub(function(name, func) {
            ret = [];
            ret[0] = name;
            ret[1] = func;
            return ret;
        });

        env.pClient = new this.Stub(function(p) {
            console.log('privae/public client called');
            var args = Array.prototype.slice.call(arguments);
            return args;
        });

        env.pClient.use = new this.Stub(function() {
            return true;
        });

        // getListing calls are handle by this stub
        env.pClient.getListing = new this.Stub(function(path) {
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
        env.pClient.getObject = new this.Stub(function(path) {
            var p;
            var d = false;
            if (path.match(/^reverse\/\w+\/\d+$/)) {
                // getTagByRecord()
                p = path.match(/^reverse\/(\w+)\/(\d+)$/);
                d = env.presets.data.reverse[p[1]][p[2]];
            } else if (path.match(/^names\/\w+\/\w+$/) !== -1) {
                p = path.match(/^names\/(\w+)\/(\w+)$/);
                d = env.presets.data.names[p[1]][p[2]];
            }
            return d;
        });



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
            desc: "confirm pClient stub function works",
            run: function(env) {
                var func = env.pClient;
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
                this.assertType(env.rs[1], 'function');
            }
        },
        {
            desc: "initialize module",
            run: function(env) {
                env.tagModule = env.rs[1](env.pClient,env.pClient);
                console.log(env.tagModule);
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
                var d = env.tagModule.exports.getTagged('cat');
                this.assert(d, env.presets.getTagged);
            }
        }
    ]
});
return suites;
}();
