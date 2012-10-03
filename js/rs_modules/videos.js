remoteStorage.defineModule('videos', function(privateClient, publicClient) {

  privateClient.sync('');
  publicClient.sync('');

  moduleName = 'videos';

  return {
    name: moduleName,

    dataHints: {
      "module" : "Store video data metadata"
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


      getIds: function() {
        return privateClient.getListing('');
      },

      get: function(id) {
        return privateClient.get(id);
      },

      set: function(id, title) {
        var obj = privateClient.getObject(id);
        obj.title = title;
        privateClient.storeObject('video', id, obj);
      },

      add: function(details, id) {
        if (!id) {
          id = getUuid();
        }
        var status = privateClient.storeObject('video', id, details);
        return id;
      },

      remove: function(id) {
        privateClient.remove(id);
      }

    }
  };
});
