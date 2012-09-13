define(['../remoteStorage'], function(remoteStorage) {

  var moduleName = 'bookmarks';

  remoteStorage.defineModule(moduleName, function(privateClient, publicClient) {

    privateClient.sync('');
    publicClient.sync('');

    pub = {};

    // remoteStorage.bookmarks.on('change', function(changeEvent) {
    //   if(changeEvent.newValue && changeEvent.oldValue) {
    //    changeEvent.origin:
    //      * window - event come from current window
    //            -> ignore it
    //      * device - same device, other tab (/window/...)
    //      * remote - not related to this app's instance, some other app updated something on remoteStorage
    //   }
    // });
    pub.on = privateClient.on();

    /**
     * get list of existing tags
     * @returns {array}
     */
    pub.getTags = function() {
      console.log('TAGS: getTags()');
      return privateClient.getListing(''); 
    }


    /**
     * get a list of all tags which have a specified record ID
     * @param {string} record id
     * @returns {array} array of tag names
     */
    function getTagsByRecord(recordId) {
      console.log("TAGS: getTagsByRecord\n*****************");
      tags = pub.getTags();
      tagNames = [];
      // get add instances of recordId from recordIds list
      num_tags = tags.length;
      console.log('GTBR: tags:',tags);
      for (i = 0; i < num_tags; i++) {
        recordIds = pub.getTagged(tags[i]);
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


    return {
      name: moduleName,

      dataHints: {
        "module" : "Store URLs which you do not wish to forget"
      },

      exports: pub
    }
  });
});
