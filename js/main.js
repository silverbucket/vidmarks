require.config( {
  paths: {
    //jquery: ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min', 'lib/jquery.min'],
    jsuri: 'vendor/jsuri-1.1.1.min',
    requirejs: 'vendor/require-2.1.15.min',
    rs: 'vendor',
    bluebird: 'vendor/bluebird',
    module_videos: 'js/rs_modules/videos',
    module_globaltags: 'js/rs_modules/global_tags'
  },
  baseUrl: '/'
});

require(['js/vidmarks'], function (vidmarks) {
  vidmarks.init();
});

console.log(this);
