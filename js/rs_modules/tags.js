remoteStorage.defineModule('tags', function(myPrivateBaseClient, myPublicBaseClient) {
  var errorHandlers=[];
  function fire(eventType, eventObj) {
    if(eventType == 'error') {
      for(var i=0; i<errorHandlers.length; i++) {
        errorHandlers[i](eventObj);
      }
    }
  }
  function getPrivateList(listName) {
    myPrivateBaseClient.sync('tags/');
    

    /**
     * get list of existing tags
     * @returns {array}
     */
    function getTags () {
      console.log('TAGS: getTags(tags/)');
      return myPrivateBaseClient.getListing('tags/'); 
    }
    
    /**
     * get a list of all tags which have a specified record ID
     * @param {string} record id
     * @returns {array} array of tag names
     */
    function getTagsByRecord(recordId) {
      console.log("TAGS: getTagsByRecord\n*****************");
      tags = getTags();
      tagNames = [];
      // get add instances of recordId from recordIds list
      num_tags = tags.length;
      console.log('GTBR: tags:',tags);
      for (i = 0; i < num_tags; i++) {
        recordIds = getTagged(tags[i]);
        num_records = recordIds.length;
      console.log('GTBR: i-',i);
      console.log('GTBR: tagobj:',tags[i]);
        for (j = 0; j < num_records; j++) {
          if (recordId === recordIds[j]) {
            tagNames.append(tags[i]);
          }
        }
      }
      console.log('GTBR: recordId:',recordId);

      return tagNames;
    }

    /**
     * get list of record IDs for this app which have the tag specified.
     * @param {string} the name of the tag
     * @returns {array}
     */
    function getTagged(tagName) {
      console.log('TAGS: getTagged()');
      return myPrivateBaseClient.getObject(tagName+'/'+listName);
    }
    
    /**
     * add to a list of record IDs to a tag.
     * @param {string} tag name
     * @param {array} list of record IDs
     */
    function addTagged(tagName, recordIds) {
      console.log('TAGS: addTagged('+tagName+'/'+listName+'):',recordIds);
      if (typeof recordIds === 'string') {
        recordIds = [recordIds];
      }
      
      var obj = myPrivateBaseClient.getObject(tagName+'/'+listName);
      recordIds.concat(obj);
      console.log('recordIds:',recordIds); 
      myPrivateBaseClient.storeObject('tag', tagName+'/'+listName, recordIds);
    }


    /**
     * sets a list of tags for an id
     * @params {string} record ID
     * @params {array} list og tag names
     */
    function addTagsToRecord(appId, tagNames) {
      console.log('TAGS: addTagsToRecord');
      num_tagNames = tagNames.length;
      for (i = 0; i < num_tagNames; i++) {
        addTagged(tagNames[i], appId);
      }
    }

    
    /**
     * removes an ID from a specified tag
     * @param {string} tag name
     * @param {string} id(s) of record to remove from list
     */
    function removeTagged(tagName, recordIds) {
      console.log('TAGS: removeTagged()');
      if (typeof recordIds === 'string') {
        recordIds = [recordIds];
      }
      var obj = myPrivateBaseClient.getObject(tagName+'/'+listName);

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
      myPrivateBaseClient.storeObject('tag', tagName+'/'+listName, obj);
    }

    
    /**
     * remove the specified record ID from all tags
     * @params {string} record ID
     */
    function removeRecord(appId) {
      console.log('TAGS: removeRecord()');
      tags = getTags();
      num_tags = tags.length;
      for (i = 0; i < num_tags; i++) {
        removeTagged(tags[i], appId);
      }
    }


    function on(eventType, cb) {
      myPrivateBaseClient.on(eventType, cb);
      if(eventType == 'error') {
        errorHandlers.push(cb);
      }
    }
    return {
      getTags         : getTags,
      getTagsByRecord : getTagsByRecord,
      getTagged       : getTagged,
      addTagged       : addTagged,
      addTagsToRecord : addTagsToRecord,
      removeTagged    : removeTagged,
      on            : on
    };
  }
  return {
    name: 'tags',
    dataHints: {
      "module": "tags are means of grouping sets of related information",
      
      "objectType tag": "something that needs doing, like cleaning the windows or fixing a specific bug in a program",
      "string tag#id": "tag name",
      "boolean tag#application": "the name of the application which contains an array of ids",
      
      "directory tags/todos/": "default private todo list",
      "directory tags/:year/": "tags that need doing during year :year",
      "directory public/tags/:hash/": "tags list shared to for instance a team"
    },
    exports: {
      getPrivateList: getPrivateList
    }
  };
});
