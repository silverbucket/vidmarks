remoteStorage.defineModule('bookmarks', function(myPrivateBaseClient, myPublicBaseClient) {
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
      myPrivateBaseClient.storeObject('bookmark', listName+'/'+id, obj);
    }
    function add(url, title, description) {
      var id = getUuid();
      var status = myPrivateBaseClient.storeObject('bookmark', listName+'/'+id, {
        title: title,
        url: url,
        description: description
      });
      return id;
    }
    function markCompleted(id, completedVal) {
      if(typeof(completedVal) == 'undefined') {
        completedVal = true;
      }
      var obj = myPrivateBaseClient.getObject(listName+'/'+id);
      if(obj && obj.completed != completedVal) {
        obj.completed = completedVal;
        myPrivateBaseClient.storeObject('bookmark', listName+'/'+id, obj);
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
    name: 'bookmarks',
    dataHints: {
      "module": "bookmarks are web URLs",
      
      "objectType bookmark": "a reference to a place you'd like to return to at some point.",
      "string bookmark#title": "the title of the place the bookmark points to",
      "string bookmark#url": "location bookmark points to",
      "text bookmark#description": "description of the bookmark",
      
      "directory bookmarks/": "default private list",
      "directory bookmarks/:year/": "bookmarks created during year :year",
      "directory public/bookmarks/:hash/": "bookmark list shared to for instance a team"
    },
    exports: {
      getPrivateList: getPrivateList
    }
  };
});
