if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['rs/remoteStorage'], function (remoteStorage) {
  var moduleName = 'videos';

  remoteStorage.defineModule(moduleName, function (privateClient, publicClient) {

    privateClient.declareType('video', {
      "description" : "a reference to a place you'd like to return to at some point.",
      "type" : "object",
      "required": [ "title" ],
      "additionalProperties": false,
      "properties": {
        "title": {
          "type": "string",
          "description": "the title of the place the video points to",
        },
        "embed_url": {
          "type": "string",
          "description": "location video points to for embedding purposes",
          "format": "uri"
        },
        "visit_url": {
          "type": "string",
          "description": "location video points to for browsing to",
          "format" : "uri"
        },
        "description": {
          "type": "string",
          "description": "description of the video"
        },
        "thumbnail": {
          "type": "string",
          "description": "thumbnail image of the video",
          "format": "uri"
        },
        "duration": {
          "type": "number",
          "description": "duration of the video in seconds"
          },
        "source": {
          "type": "string",
          "description": "source of the video (ie. youtube, vimeo, local)"
        },
        "content_type": {
          "type": "string",
          "description": "the mimetype ie. application/x-shockwave-flash"
        },
        "video_data": {
          "type": "binary",
          "description": "actual binary video data"
        }
      }
    });

    return {

      exports: {

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
          return privateClient.storeObject('video', id, details).
            then(function() { return id; });
        },

        remove: function(id) {
          privateClient.remove(id);
        }

      }
    };
  });
  return remoteStorage.videos;
});

