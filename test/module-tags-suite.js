module.exports = function() {
var suites = [];
suites.push({
	name: "tags module",
	desc: "collections of tests for the global_tags.js module",
    setup: function(env) {
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

        env.pClient.sync = new this.Stub(function() {
            return true;
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
        }
	]
});
return suites;
}();
