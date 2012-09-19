remoteStorage.defineModule('tags', function(privateClient, publicClient) {

  privateClient.sync('');
  publicClient.sync('');

  moduleName = 'tags';

  
  return {
    name: moduleName,

    dataHints: {
      "module" : "Store URLs which you do not wish to forget"
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

      setDocType: function(docType) {
        docType = docType;
      },

      /**
       * get list of existing tags
       * @returns {array}
       */
      getTags: function() {
        //console.log('TAGS: getTags()');
        tags = privateClient.getListing(''); 
        num_tags = tags.length;
        r_tags = [];
        for (i = 0; i < num_tags; i++) {
          r_tags.push(tags[i].replace(/\//g,""));
        }
        return r_tags;
      },


      /**
       * get a list of all tags which have a specified record ID
       * @param {string} record id
       * @returns {array} array of tag names
       */
      getTagsByRecord: function(recordId) {
        console.log("TAGS: getTagsByRecord("+recordId+")");
        tags = this.getTags();
        tagNames = [];
        // get add instances of recordId from recordIds list
        num_tags = tags.length;
        for (i = 0; i < num_tags; i++) {
          recordIds = this.getTagged(tags[i]);
          num_records = recordIds.length;
          for (j = 0; j < num_records; j++) {
            if (recordId === recordIds[j]) {
              tagNames.push(tags[i]);
            }
          }
        }
        return tagNames;
      },



      /**
       * get list of record IDs for this app which have the tag specified.
       * @param {string} the name of the tag
       * @returns {array}
       */
      getTagged: function(tagName) {
        console.log('TAGS: getTagged('+tagName+'/'+this.docType+')');
        return_val = [];
        var val = privateClient.getObject(tagName+'/'+this.docType);
        if (val != undefined) {
          return_val = val;
        }
        //console.log(return_val);
        return return_val;
      },


      /**
       * add to a list of record IDs to a tag.
       * @param {string} tag name
       * @param {array} list of record IDs
       */
      addTagged: function(tagName, recordIds) {
        console.log('TAGS: addTagged('+tagName+'/'+this.docType+'):',recordIds);
        if (typeof recordIds === 'string') {
          recordIds = [recordIds];
        }
        
        var obj = privateClient.getObject(tagName+'/'+this.docType);
        new_obj = obj.concat(recordIds).sort();

        // unique entries only
        num_new_obj = new_obj.length;
        unique_obj = [];
        for(var i=0; i < num_new_obj; ++i) {
          if(new_obj[i] !== new_obj[i+1]) {
            unique_obj.push(new_obj[i]);
          }
        }

        console.log('merged and unique result:', unique_obj);
        privateClient.storeObject('tag', tagName+'/'+this.docType, unique_obj);
      },


      /**
       * sets a list of tags for an id
       * @params {string} record ID
       * @params {array} list og tag names
       */
      addTagsToRecord: function(appId, tagNames) {
        console.log('TAGS: addTagsToRecord');
        num_tagNames = tagNames.length;
        for (i = 0; i < num_tagNames; i++) {
          this.addTagged(tagNames[i], appId);
        }
      },

      
      /**
       * removes an ID from a specified tag
       * @param {string} tag name
       * @param {string} id(s) of record to remove from list
       */
      removeTagged: function(tagName, recordIds) {
        console.log('TAGS: removeTagged()');
        if (typeof recordIds === 'string') {
          recordIds = [recordIds];
        }
        var obj = privateClient.getObject(tagName+'/'+this.docType);

        // remove all occurences of appId(s) from obj list
        num_ids = recordIds.length;
        for (i = 0; i < num_ids; i++) {
          num_objs = obj.length;
          for (j = 0; j < num_objs; j++) {
            if (recordIds[i] === obj[j]) {
              obj.splice(j, 1);
              break;
            }
          }
        }
        privateClient.storeObject('tag', tagName+'/'+this.docType, obj);
      },

      
      /**
       * remove the specified record ID from all tags
       * @params {string} record ID
       */
      removeRecord: function(appId) {
        console.log('TAGS: removeRecord()');
        tags = this.getTags();
        num_tags = tags.length;
        for (i = 0; i < num_tags; i++) {
          this.removeTagged(tags[i], appId);
        }
      }

    }
  }
});
