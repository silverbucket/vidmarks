remoteStorage.defineModule('videos', function(myPrivateBaseClient, myPublicBaseClient) {
  var errorHandlers=[];
  function fire(eventType, eventObj) {
    if(eventType == 'error') {
      for(var i=0; i<errorHandlers.length; i++) {
        errorHandlers[i](eventObj);
      }
    }
  }
  function getUuid() {
    var uuid = '',
        i,
        random;

    for ( i = 0; i < 32; i++ ) {
        random = Math.random() * 16 | 0;
        if ( i === 8 || i === 12 || i === 16 || i === 20 ) {
            uuid += '-';
        }
        uuid += ( i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random) ).toString( 16 );
    }
    return uuid;
  }
  function getPrivateList(listName) {
    myPrivateBaseClient.sync(listName+'/');
    function getIds() {
      return myPrivateBaseClient.getListing(listName+'/');
    }
    function get(id) {
      return myPrivateBaseClient.getObject(listName+'/'+id);
    }
    function set(id, title) {
      var obj = myPrivateBaseClient.getObject(listName+'/'+id);
      obj.title = title;
      myPrivateBaseClient.storeObject('video', listName+'/'+id, obj);
    }
    function add(details) {
      var id = getUuid();
      var status = myPrivateBaseClient.storeObject('video', listName+'/'+id, details);
      return id;
    }
    function markCompleted(id, completedVal) {
      if(typeof(completedVal) == 'undefined') {
        completedVal = true;
      }
      var obj = myPrivateBaseClient.getObject(listName+'/'+id);
      if(obj && obj.completed != completedVal) {
        obj.completed = completedVal;
        myPrivateBaseClient.storeObject('video', listName+'/'+id, obj);
      }
    }
    function isCompleted(id) {
      var obj = get(id);
      return obj && obj.completed;
    }
    function getStats() {
      var ids = getIds();
      var stat = {
        todoCompleted: 0,
        totalTodo: ids.length
      };
      for (var i=0; i<stat.totalTodo; i++) {
        if (isCompleted(ids[i])) {
          stat.todoCompleted += 1;
        }
      }
      stat.todoLeft = stat.totalTodo - stat.todoCompleted;
      return stat;
    }
    function remove(id) {
      myPrivateBaseClient.remove(listName+'/'+id);
    }
    function on(eventType, cb) {
      myPrivateBaseClient.on(eventType, cb);
      if(eventType == 'error') {
        errorHandlers.push(cb);
      }
    }
    return {
      getIds        : getIds,
      get           : get,
      set           : set,
      add           : add,
      remove        : remove,
      markCompleted : markCompleted,
      getStats      : getStats,
      on            : on
    };
  }
  return {
    name: 'videos',
    dataHints: {
      "module": "videos are web URLs",
      
      "objectType video": "a reference to a place you'd like to return to at some point.",
      "string video#title": "the title of the place the video points to",
      "string video#embed_url": "location video points to for embedding purposes",
      "string video#visit_url": "location video points to for browsing to",
      "text video#description": "description of the video",
      "string video#thumbnail": "thumbnail image of the video",
      "int video#duration": "duration of the video in seconds",
      "string video#source": "source of video (ie. youtube, vimeo, local)",
      
      "directory videos/": "default private list",
      "directory videos/:year/": "videos created during year :year",
      "directory public/videos/:hash/": "video list shared to for instance a team"
    },
    exports: {
      getPrivateList: getPrivateList
    }
  };
});
