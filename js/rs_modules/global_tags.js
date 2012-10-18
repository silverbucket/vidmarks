var global_tags = remoteStorage.defineModule('tags', function(privateClient, publicClient) {
  "use strict";
  var moduleName = 'tags';
  privateClient.use('');
  publicClient.use('');

  return {
    name: moduleName,

    dataHints: {
      "module" : "A globally accessible record of tag names, which you can attach to items in other modules"
    },

    exports: {

      // remoteStorage.bookmarks.on('change', function(changeEvent) {
      //   if(changeEvent.newValue && changeEvent.oldValue) {
      //    changeEvent.origin:
      //      * window - event come from current window
      //            -> ignore it
      //      * device - same device, other tab (/window/...)
      //      * remote - not related to this app's instance, some other app updated something on remoteStorage
      //   }
      // });
      on: privateClient.on,

      docType: 'default',

      // XXX: this shouldn't be set globally, an app should be able to
      // use tags for different modules at the same time.
      // < _n_> Take a look at the tasks module for example
      // doc: http://remotestoragejs.com/doc/code/files/modules/tasks-js.html
      setDocType: function(docType) {
        this.docType = docType;
      },

      /**
       * get list of existing tags
       * @returns {array}
       */
      getTags: function() {
        //console.log('TAGS: getTags()');
        var tags = privateClient.getListing('names/');
        var num_tags = tags.length;
        var r_tags = [];
        for (var i = 0; i < num_tags; i++) {
          r_tags.push(tags[i].replace(/\//g,""));
        }
        return r_tags;
      },

      // XXX: this wont scale
      // < _n_> you have tags/:tagName/:docType -> [recordId]
      // < _n_> then I would do:
      // < _n_> tags/names/:tagName/:docType -> [recordId] and tags/reverse/:docType/:recordId -> [:tag]
      /**
       * get a list of all tags which have a specified record ID
       * @param {string} record id
       * @returns {array} array of tag names
       */
      getTagsByRecord: function(recordId) {
        //console.log("TAGS: getTagsByRecord("+recordId+")");
        var return_val = [];
        var val = privateClient.getObject('reverse/'+this.docType+'/'+recordId);
        if (typeof val === "object") {
          return_val = val;
        }
        return return_val;
      },

      /**
       * get list of record IDs for this app which have the tag specified.
       * @param {string} tagName - the name of the tag
       * @returns {array}
       */
      getTagged: function(tagName) {
        //console.log('TAGS: getTagged('+tagName+'/'+this.docType+')');
        var return_val = [];
        var val = privateClient.getObject('names/'+tagName+'/'+this.docType);
        if (typeof val === "object") {
          return_val = val;
        }
        return return_val;
      },

      /**
       * add to a list of record IDs to a tag.
       * @param {string}  tagName   - tag name
       * @param {array}   recordIds - list of record IDs
       */
      addTagged: function(tagName, recordIds) {
        //console.log('TAGS: addTagged('+tagName+'/'+this.docType+'):',recordIds);
        recordIds = this._ensureArray(recordIds);

        var tageName = tagName.replace(/\s+/g, ''); // no whitespace
        var existingIds = privateClient.getObject('names/'+tagName+'/'+this.docType);
        if (!existingIds) {
          existingIds = [];
        }

        var unique_obj = this._mergeAndUnique(existingIds, recordIds);

        this._addReverse(tagName, recordIds); // add ids to tags reverse lookup document
        //console.log('merged and unique result:', unique_obj);
        privateClient.storeObject('tag', 'names/'+tagName+'/'+this.docType, unique_obj);
      },

      /**
       * sets a list of tags for an id
       * @params {string} recordId - record ID
       * @params {array}  tagNames -list og tag names
       */
      addTagsToRecord: function(recordId, tagNames) {
        //console.log('TAGS: addTagsToRecord');
        tagNames = this._ensureArray(tagNames);
        var num_tagNames = tagNames.length;
        for (var i = 0; i < num_tagNames; i++) {
          this.addTagged(tagNames[i], recordId);
        }
      },

      /**
       * removes an ID from a specified tag
       * @param {string} tag name
       * @param {array|string} id(s) of record to remove from list
       */
      removeTagged: function(tagName, recordIds) {
        //console.log('TAGS: removeTagged()');
        recordIds = this._ensureArray(recordIds);

        // get object for this tag
        var existingIds = privateClient.getObject('names/'+tagName+'/'+this.docType);

        // remove all occurences of appId(s) from existingIds list
        var num_recordIds = recordIds.length;
        for (var i = 0; i < num_recordIds; i++) {
          var num_existingIds = existingIds.length;
          for (var j = 0; j < num_existingIds; j++) {
            if (recordIds[i] === existingIds[j]) {
              existingIds.splice(j, 1);
              break;
            }
          }
        }
        this._removeTagFromReverse(recordIds, tagName);
        privateClient.storeObject('tag', 'names/'+tagName+'/'+this.docType, existingIds);
      },

      /**
       * remove the specified record ID from all tags
       * @params {string} recordId - record ID
       */
      removeRecord: function(recordId) {
        //console.log('TAGS: removeRecord()');
        var tags = this.getTags();
        var num_tags = tags.length;
        for (var i = 0; i < num_tags; i++) {
          this.removeTagged(tags[i], recordId);
        }
      },

      /**
       * removes a tagName from the reverse lookup for the specified IDs
       * @params {array|string} recordIds - id(s) of record(s)
       * @params {string}       tagName  - tag name(s)
       */
      _removeTagFromReverse: function(recordIds, tagName) {
        recordIds = this._ensureArray(recordIds);

        var num_recordIds = recordIds.length;
        for (var i = 0; i < num_recordIds; i++) {
          // foreach record Id, remove all tags in it's obj
          var existingTags = privateClient.getObject('reverse/'+recordIds[i]+'/'+this.docType);
          var num_existingTags = existingTags.length;
          for (var j = 0; j < num_existingTags; j++) {
            if (existingTags[j] === tagName) {
              existingTags.splice(j, 1);
              break;
            }
          }
          privateClient.storeObject('reverse', 'reverse/'+recordIds[i]+'/'+this.docType, existingTags);
        }
      },

      /**
       * add tags to record ids in the reverse lookup documents
       * @param {array}   tagNames  - tag names
       * @param {array}   recordIds - list of record ids
       */
      _addReverse: function(tagNames, recordIds) {
        //console.log('TAG: _addReverse() called', tagNames, recordIds);
        tagNames = this._ensureArray(tagNames);
        recordIds = this._ensureArray(recordIds);

        var num_recordIds = recordIds.length;
        for (var i = 0; i < num_recordIds; i++) {
          //console.log('****: _addReverse() - getting object');
          var existingTags = privateClient.getObject('reverse/'+this.docType+'/'+recordIds[i]);
          //console.log('****: _addReverse() - getting object finished');
          if (!existingTags) {
            existingTags = [];
          }

          var uniqueTagNames = this._mergeAndUnique(existingTags, tagNames);
          //console.log('STORING: reverse/'+this.docType+'/'+recordIds[i], uniqueTagNames);
          privateClient.storeObject('reverse', 'reverse/'+this.docType+'/'+recordIds[i], uniqueTagNames);
        }
      },

      /**
       * merge two arrays and ensure only unique entries
       * @param {array} obj1
       * @param {array} obj2
       * @return {array} merged and unique array
       */
      _mergeAndUnique: function(obj1, obj2) {
        // merge new tags in with existing
        var new_obj = obj1.concat(obj2).sort();

        // unique entries only, filter out dupes
        var num_new_obj = new_obj.length;
        var unique_obj = [];
        for(var i=0; i < num_new_obj; ++i) {
          if (new_obj[i] !== new_obj[i+1]) {
            unique_obj.push(new_obj[i]);
          }
        }
        return unique_obj;
      },

      /**
       * ensures the passed value is an array, makes it one if it's a string
       * @param  {array|string} recordIds   - string or array of recordIds
       * @return {array} array of record ids
       */
      _ensureArray: function(recordIds) {
        if (typeof recordIds === 'string') {
          recordIds = [recordIds];
        }
        return recordIds;
      }
    }
  };
});
if(!module) var module={};
module.exports = global_tags;