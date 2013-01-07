require.config( {
  paths: {
    //jquery: ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min', 'lib/jquery.min'],
    jsuri: 'vendor/jsuri-1.1.1.min',
    localstorage: 'lib/backbone.localstorage',
    remotestorage: 'vendor/remotestorage',
    'remotestorage-videos': 'rs_modules/videos',
    'remotestorage-global_tags': 'rs_modules/global_tags'
  },
  baseUrl: 'js'
});

require(['vidmarks'], function(vidmarks) {
  vidmarks.init();
});

console.log(this);