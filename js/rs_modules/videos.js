remoteStorage.defineModule('videos', function(privateClient, publicClient) {
  var moduleName = 'videos';
  privateClient.sync('');
  publicClient.sync('');

  return {
    name: moduleName,

    dataHints: {
      "module" : "Store video data metadata",

      "objectType video": "a reference to a place you'd like to return to at some point.",
      "string video#title": "the title of the place the video points to",
      "string video#embed_url": "location video points to for embedding purposes",
      "string video#visit_url": "location video points to for browsing to",
      "text video#description": "description of the video",
      "string video#thumbnail": "thumbnail image of the video",
      "int video#duration": "duration of the video in seconds",
      "string video#source": "source of video (ie. youtube, vimeo, local)",
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
        return privateClient.getObject(id);
      },

      add: function(details, id) {
        if (!id) {
          id = privateClient.getUuid();
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
