/**
 * videoSiteAPI - provides an abstraction interface to the various video site APIs
 *
 * requires: jquery, and jsuri
 */
define(['jsuri'], function(jsuri, undefined) {
  var pub = {};
  var _ = {};

  _.youtube = {};
  _.site_mapping = {};
  _.site_mapping['youtube'] = [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "www.youtu.be"
    ];
  _.error_message = '';

  pub.retrieveDetails = function(url, successFunc, failFunc) {
    if (!url) {
      console.debug('ERROR ' + this + ': url param required.');
      return false;
    }

    var uri = new Uri(url);
    console.log('DEBUG: host:' + uri.host() + ' path:' + uri.path() +
                ' query:' + uri.query() + ' v:' + uri.getQueryParamValue('v'));
    var match = false;
    for (var site in _.site_mapping) {
      if (_.findStringInArray(uri.host(), _.site_mapping[site])) {
        _[site].retrieveDetails(uri.getQueryParamValue('v'),
                                successFunc,
                                failFunc);
        match = true;
        break;
      }
    }

    if (!match) {
      console.debug('ERROR '+this+': unsupported url ['+url+']');
      _.error_message = 'unsupported or invalid url';
      return false;
    }
  };

  pub.getErrorMessage = function() {
    var msg =  _.error_message;
    _.error_message = '';
    return msg;
  };

  _.youtube.retrieveDetails = function(vid_id, successFunc) {
    $.ajax({
      url: "http://gdata.youtube.com/feeds/api/videos/" + vid_id +
           "?v=2&alt=json",
      dataType: "jsonp",
      success: function (data) {
        console.log('vidAPI.retrieveDetails() - GET successful : ', data);
        var details = {};
        details['title'] = data.entry.title.$t;
        details['description'] = data.entry.media$group.media$description.$t;
        details['embed_url'] = data.entry.content.src;
        details['thumbnail'] = data.entry.media$group.media$thumbnail[2].url;
        details['duration'] = +data.entry.media$group.yt$duration.seconds;
        details['vid_id'] = vid_id;
        details['visit_url'] = 'http://youtube.com/watch?v='+vid_id;
        details['source'] = 'youtube';
        details['content_type'] = data.entry.content.type;
        //details['video_data'] = '';
        //console.log('compiled details:', details);
        successFunc(details);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log('GET failed [' + textStatus + ']: ' + errorThrown);
        failFunc();
      }
    });
  };

  _.findStringInArray = function(string, stringArray) {
    var num_entries = stringArray.length;
    for (var j=0; j< num_entries; j++) {
      //console.log('findStringInArray: '+string+' == '+stringArray[j]);
      if (stringArray[j].match (string)) return true;
    }
    return false;
  };

  return pub;
});