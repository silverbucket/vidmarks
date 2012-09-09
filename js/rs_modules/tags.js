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
    myPrivateBaseClient.sync(listName+'/');
    

    /**
     * get list of existing tags
     * @returns {array}
     */
    function getTags () {
      return myPrivateBaseClient.getListing('/'); 
    }
    
    /**
     * get a list of all tags which have a specified record ID
     * @param {string} record id
     * @returns {array} array of tag names
     */
    function getTagsByRecord(recordId) {
      tags = getTags();
      tagNames = [];
      // get add instances of recordId from recordIds list
      num_tags = tags.length;
      for (i = 0; i < num_tags; i++) {
        recordIds = getTagged(tags[i]);
        num_records = recordIds.length;
        for (j = 0; j < num_records; j++) {
          if (recordId === recordIds[j]) {
            tagNames.append(tags[i]);
          }
        }
      }
      return tagNames;
    }

    /**
     * get list of record IDs for this app which have the tag specified.
     * @param {string} the name of the tag
     * @returns {array}
     */
    function getTagged(tagName) {
      return myPrivateBaseClient.getObject(tagName+'/'+listName);
    }
    
    /**
     * add to a list of record IDs to a tag.
     * @param {string} tag name
     * @param {array} list of record IDs
     */
    function addTagged(tagName, recordIds) {
      if (typeof recordIds === 'string') {
        recordIds = [recordIds];
      }
      var obj = myPrivateBaseClient.getObject(tagName+'/'+listName);
      recordIds.concat(obj);
      myPrivateBaseClient.storeObject('tag', tagName+'/'+listName, recordIds);
    }


    /**
     * sets a list of tags for an id
     * @params {string} record ID
     * @params {array} list og tag names
     */
    function addTagToRecord(appId, tagNames) {
      num_tagNames = tagNames.length;
      for (i = 0; i < num_tagNames; i++) {
        addTagged(tagNames[i], appid);
      }
    }

    
    /**
     * removes an ID from a specified tag
     * @param {string} tag name
     * @param {string} id(s) of record to remove from list
     */
    function removeTagged(tagName, recordIds) {
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
      addTagToRecord : addTagToRecord,
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
