module.exports = function() {
var suites = [];
suites.push({
    name: "tags module",
    desc: "collections of tests for the global_tags.js module",
    setup: function(env) {
        env.presets = {};
        // a sample data set which should properly represet the way remoteStorage
        // data is stored.
        env.remoteStorage = new this.Stub.mock.remoteStorage({
            'names/dog' : {},
            'names/dog/videos': [ '12345', '67890', 'abcde', 'fghij' ],
            'names/cat': {},
            'names/cat/videos': [ '34567', 'abcde' ],
            'names/horse': {},
            'names/horse/videos': [ '12345', 'fghij', '67890' ],
            'names/aardvark': {},
            'names/aardvark/videos': [ '34567', 'defgh' ],
            'reverse/videos': {},
            'reverse/videos/12345': ['horse', 'dog'],
            'reverse/videos/67890': ['horse', 'dog'],
            'reverse/videos/abcde': ['cat', 'dog'],
            'reverse/videos/fghij': ['horse', 'dog'],
            'reverse/videos/34567': ['cat', 'aardvark'],
            'reverse/videos/defgh': ['aardvark']
        });
        // the expected restults from the various module functions called
        env.presets.docType = 'videos';
        env.presets.getTags = ['dog', 'cat', 'horse', 'aardvark'];
        env.presets.getTagsByRecord = ['dog', 'horse'];
        env.presets.getTagged = ['34567', 'defgh'];

        this.assertTypeAnd(env.remoteStorage, 'function');
        this.assertTypeAnd(env.remoteStorage.baseClient, 'function');
        this.assertType(env.remoteStorage.defineModule, 'function');

        global.remoteStorage = env.remoteStorage;
        var moduleImport = require('../js/rs_modules/global_tags.js');
        // if we loaded the tag module correctly, it should have returned
        // a function for us to use.
        this.assertTypeAnd(env.moduleImport, 'function');
        var tagModule_exports = moduleImport[1](env.remoteStorage.baseClient, env.remoteStorage.baseClient).exports;
        env.tagModule = tagModule_exports.getPrivateListing('videos');
        this.assertType(env.tagModule, 'object');
    },
    tests: [
        {
            desc: "tag module has getAllTags function",
            run: function(env) {
                this.assertType(env.tagModule.getAllTags, 'function');
            }
        },
        {
            desc: "getTags should return our preset list of tag names",
            run: function(env) {
                var d = env.tagModule.getAllTags();
                this.assert(d, env.presets.getTags);
            }
        },
        {
            desc: "getTagsByRecord should return a list of tags for that id",
            run: function(env) {
                var d = env.tagModule.getTagsByRecord('12345');
                this.assert(d, env.presets.getTagsByRecord);
            }
        },
        {
            desc: "getTagged should return a list of ids for that tag",
            run: function(env) {
                var d = env.tagModule.getTagged('aardvark');
                this.assert(d, env.presets.getTagged);
            }
        },
        {
            desc: "addTagged should add a list of ids to a tag",
            run: function(env) {
                env.tagModule.addTagged('aardvark', ['qwerty', 'foobar']);
                var d = env.tagModule.getTagged('aardvark');
                env.presets.getTagged.push('qwerty');
                env.presets.getTagged.push('foobar');
                this.assert(d, env.presets.getTagged);
            }
        },
        {
            desc: "addTagsToRecord should add a list of tags to a recordId",
            run: function(env) {
                env.tagModule.addTagsToRecord(['67890', '12345'], ['penguin', 'travel']);
                var d = env.tagModule.getTagsByRecord('67890');
                env.presets.getTagsByRecord.push('penguin');
                env.presets.getTagsByRecord.push('travel');
                this.assert(d, env.presets.getTagsByRecord);
            }
        },
        {
            desc: "removeTagged should remove recordID from a tag",
            run: function(env) {
                env.tagModule.removeTagged('travel', '67890');
                var d = env.tagModule.getTagged('travel');
                this.assert(d, ['12345']);
            }
        },
        {
            desc: "verify that the reverse lookup was updated as well",
            run: function(env) {
                var d = env.tagModule.getTagsByRecord('67890');
                this.assert(d, ['dog', 'horse', 'penguin']);
            }
        },
        {
            desc: "removeRecord should remove recordID from all tags",
            run: function(env) {
                env.tagModule.removeRecord('12345');
                var d = env.tagModule.getTagsByRecord('12345');
                this.assert(d, []);
            }
        }
    ],
    takedown: function() {
        delete global.remoteStorage;
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
}();
