if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(function() {
  var global_tags = remoteStorage.defineModule('tags', function(privateClient, publicClient) {
    //"use strict";
    var moduleName = 'tags';
    privateClient.use('');
    publicClient.use('');

    privateClient.declareType('tag', {
        "description": "a method of tracking tags and references to the module records that they've been related to",
        "type":"array",
        "items": {
          "title": "a collection of record id's associated with this tag name + docType",
          "type": "string"
        }
    });

    privateClient.declareType('reverse', {
        "description": "a method of tracking tags and references to the module records that they've been related to",
        "type":"array",
        "items": {
          "title": "a collection of tags names associated with this record ID + docType",
          "type": "string"
        }
    });

    return {
      name: moduleName,

      dataHints: {
        "module" : "A globally accessible record of tag names, which you can attach to items in other modules"
      },

      exports: {

        getPrivateListing: function(docType) {
          var pub = {};
          var _ = {};
          _.docType = docType;

          pub.on = privateClient.on;

          /**
           * get list of all tags of any docType
           * @returns {array}
           */
          pub.getAllTags = function() {
            //console.log('TAGS: getTags()');
            var tags = privateClient.getListing('names/');
            var num_tags = tags.length;
            var r_tags = [];
            for (var i = 0; i < num_tags; i++) {
              r_tags.push(tags[i].replace(/\//g,""));
            }
            return r_tags;
          };

          /**
           * get list of existing tags already used for this doctype
           * @returns {array}
           */
          /*pub.getUsedTags = function() {
            //console.log('TAGS: getTags()');
            var tags = privateClient.getListing('names/');
            var num_tags = tags.length;
            var r_tags = [];
            for (var i = 0; i < num_tags; i++) {
              console.log('*****'+tags[i]);
              r_tags.push(tags[i].replace(/\//g,""));
            }
            return r_tags;
          };*/

          /**
           * get a list of all tags which have a specified record ID
           * @param {string} record id
           * @returns {array} array of tag names
           */
          pub.getTagsByRecord = function(recordId) {
            //console.log("TAGS: getTagsByRecord("+recordId+")");
            var return_val = [];
            var val = privateClient.getObject('reverse/'+_.docType+'/'+recordId);
            if (typeof val === "object") {
              return_val = val;
            }
            return return_val;
          };

          /**
           * get list of record IDs for this docType which have the tag specified.
           * @param {string} tagName - the name of the tag
           * @returns {array}
           */
          pub.getTagged = function(tagName) {
            //console.log('TAGS: getTagged('+tagName+'/'+_.docType+')');
            var return_val = [];
            var val = privateClient.getObject('names/'+tagName+'/'+_.docType);
            if (typeof val === "object") {
              return_val = val;
            }
            return return_val;
          };

          /**
           * add to a list of record IDs to a tag.
           * @param {string}  tagName   - tag name
           * @param {array}   recordIds - list of record IDs
           */
          pub.addTagged = function(tagName, recordIds) {
            //console.log('TAGS: addTagged('+tagName+'/'+_.docType+'):',recordIds);
            recordIds = _.ensureArray(recordIds);

            tagName = tagName.replace(/\s+$/g, ''); // no whitespace at end of string
            tagName = tagName.replace(/^\s+/g, ''); // or beginning
            var existingIds = privateClient.getObject('names/'+tagName+'/'+_.docType);
            if (!existingIds) {
              existingIds = [];
            }

            var unique_obj = _.mergeAndUnique(existingIds, recordIds);

            _.addReverse(tagName, recordIds); // add ids to tags reverse lookup document
            privateClient.storeObject('tag', 'names/'+tagName+'/'+_.docType, unique_obj);
          };

          /**
           * adds a list of tags for an id
           * @params {string} recordId - record ID
           * @params {array}  tagNames -list og tag names
           */
          pub.addTagsToRecord = function(recordId, tagNames) {
            //console.log('TAGS: addTagsToRecord: ', tagNames);
            tagNames = _.ensureArray(tagNames);
            var num_tagNames = tagNames.length;
            for (var i = 0; i < num_tagNames; i++) {
              pub.addTagged(tagNames[i], recordId);
            }
          };

          /**
           * sets a list of tags for an id, overwriting the old ones
           * @params {string} recordId - record ID
           * @params {array}  tagNames -list og tag names
           */
          pub.updateTagsForRecord = function(recordId, tagNames) {
            //console.log('TAGS: addTagsToRecord: ', tagNames);
            tagNames = _.ensureArray(tagNames);
            pub.removeRecord(recordId);
            var num_tagNames = tagNames.length;
            for (var i = 0; i < num_tagNames; i++) {
              pub.addTagged(tagNames[i], recordId);
            }
          };

          /**
           * removes an ID from a specified tag
           * @param {string} tag name
           * @param {array|string} id(s) of record to remove from list
           */
          pub.removeTagged = function(tagName, recordIds) {
            //console.log('TAGS: removeTagged('+tagName+', '+recordIds+')');
            recordIds = _.ensureArray(recordIds);

            // get object for this tag
            var existingIds = pub.getTagged(tagName);

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
            _.removeTagFromReverse(recordIds, tagName);
            //console.log('new id list:'+existingIds);
            privateClient.storeObject('tag', 'names/'+tagName+'/'+_.docType, existingIds);
          };

          /**
           * remove the specified record ID from all tags
           * @params {string} recordId - record ID
           */
          pub.removeRecord = function(recordId) {
            //console.log('TAGS: removeRecord()');
            var tagList = pub.getTagsByRecord(recordId);
            var num_tagList = tagList.length;
            for (var i = 0; i < num_tagList; i++) {
              pub.removeTagged(tagList[i], recordId);
            }
          };

          /**
           * removes a tagName from the reverse lookup for the specified IDs
           * @params {array|string} recordIds - id(s) of record(s)
           * @params {string}       tagName  - tag name(s)
           */
          _.removeTagFromReverse = function(recordIds, tagName) {
            //console.log('TAG: _removeTagFromReverse('+recordIds+', '+tagName+')');
            recordIds = _.ensureArray(recordIds);

            var num_recordIds = recordIds.length;
            for (var i = 0; i < num_recordIds; i++) {
              // foreach record Id, remove all tags in it's obj
              var existingTags = pub.getTagsByRecord(recordIds[i]);
              var num_existingTags = existingTags.length;
              var updatedTags = [];
              for (var j = 0; j < num_existingTags; j++) {
                if (existingTags[j] === tagName) {
                  continue;
                } else {
                  updatedTags.push(existingTags[j]);
                }
              }
              privateClient.storeObject('reverse', 'reverse/'+_.docType+'/'+recordIds[i], updatedTags);
            }
          };

          /**
           * add tags to record ids in the reverse lookup documents
           * @param {array}   tagNames  - tag names
           * @param {array}   recordIds - list of record ids
           */
          _.addReverse = function(tagNames, recordIds) {
            //console.log('TAG: _addReverse() called', tagNames, recordIds);
            tagNames = _.ensureArray(tagNames);
            recordIds = _.ensureArray(recordIds);

            var num_recordIds = recordIds.length;
            for (var i = 0; i < num_recordIds; i++) {
              //console.log('****: _addReverse() - getting object');
              var existingTags = privateClient.getObject('reverse/'+_.docType+'/'+recordIds[i]);
              //console.log('****: _addReverse() - getting object finished');
              if (!existingTags) {
                existingTags = [];
              }

              var uniqueTagNames = _.mergeAndUnique(existingTags, tagNames);
              //console.log('STORING: reverse/'+_.docType+'/'+recordIds[i], uniqueTagNames);
              privateClient.storeObject('reverse', 'reverse/'+_.docType+'/'+recordIds[i], uniqueTagNames);
            }
          };

          /**
           * merge two arrays and ensure only unique entries
           * @param {array} obj1
           * @param {array} obj2
           * @return {array} merged and unique array
           */
          _.mergeAndUnique = function(obj1, obj2) {
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
          };

          /**
           * ensures the passed value is an array, makes it one if it's a string
           * @param  {array|string} recordIds   - string or array of recordIds
           * @return {array} array of record ids
           */
          _.ensureArray = function(recordIds) {
            if (typeof recordIds === 'string') {
              recordIds = [recordIds];
            } else if (recordIds === undefined) {
              recordIds = [];
            }
            return recordIds;
          };

          return pub;
        }

      }
    };
  });
  return global_tags;
});