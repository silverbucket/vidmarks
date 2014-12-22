/**
 * appLogic - generic app related methods and logic
 *
 * requires: jQuery
 */
//define([], function(require) {
define(['rs/remoteStorage', 'js/plugins',
        'js/vidmarks/nav', 'js/video_site_api',
        'js/vidmarks/dbmodel'],
        function(remoteStorage, plugins, nav, vidAPI, db) {
  var pub = {};
  var _ = {};

  pub.init = function() {
    console.log('Vidmarks being inited');
    nav.init(['list']);
    nav.toggle('list');

    db.init(false, function () {

      db.onAction('change', function(event) {
        console.log('DB.onAction EVENT: ', event);
        if(event.newValue && event.oldValue) {
          //updateBookmarkRow(event.path, event.newValue);
        } else if(event.newValue) {
          //addBookmarkRow(event.path, event.newValue);
        } else if (event.oldValue !== undefined) {
          console.log('remove vidmark entry called');
          _.removeVidmarkEntry(event.oldValue.source+'_'+event.oldValue.vid_id);
        }
      });

      /*
       * navigation
       */
      $("a#link-submit").click(function() {
        nav.toggle('submit');
        return false;
      });

      $("a#link-list").click(function() {
        nav.toggle('list');

        pub.displayVidmarkList();

        return false;
      });
      /* */

      /*
       * form controls
       */
      $("input#input_vid_url").bind('paste', function(event) {
        var _this = this;
        // Short pause to wait for paste to complete
        setTimeout( function() {
          var url = $(_this).val();
          if (!vidAPI.retrieveDetails(url, pub.displayNewVidmark,
                                        pub.displayErrorVidmark)) {
            pub.displayMessage(vidAPI.getErrorMessage(), 'error');
          }
        }, 100);
      });

      $("#submit_url_form_area").on('keypress',
                                    'input#input_vid_url', function (e) {
        if (e.which == 13) {
          var url = $(this).val();
          if (!vidAPI.retrieveDetails(url, pub.displayNewVidmark,
                                        pub.displayErrorVidmark)) {
            pub.displayMessage(vidAPI.getErrorMessage(), 'error');
          }
          return false;
        }
      });

      $("form#submit_url_form").validate({
        //set the rules for the field names
        rules: {
          vid_url: {
            minlength: 4,
            url: true
          }
        },
        //set messages to appear inline
        messages: {
          vid_url: ""
        },
        submitHandler: function(form) {
          console.log('form submittion passed validation');
          var url = $('#input_vid_url').val();
          return db.addVidmark(url).then(function() {
            $('#input_vid_url').val('');
            return false;
          });
        }
      });

      // when you hit enter in the tag input field, we save the new tags
      // using the jquery 'delegate' function ('on')
      $("section#vidmarks").on('keypress', 'input.tag_list', function (e) {
        if (e.which == 13) {
          console.log(e);
          var id = $(this).parent().parent().attr('id');
          console.log('ENTER was pressed tag field ['+id+']');
          var tag_list = _.getInputTags(id);
          _.updateTagStatus(id, '... updating tags...');
          db.updateTagsForRecord(id, tag_list).then(function() {
            return _.updateTagStatus(id, 'tags updated!');
          });
          pub.displayTagList(); // update tags list
          e.preventDefault();
          return false;
        }
      });

      // delete button
      $("section#vidmarks").on('click', 'a.delete', function(e) {
        var id = $(this).parent().parent().attr('id');
        //console.log('id:'+id+' wants to be deleteded');
        db.removeVidmark(id);
        return false;
      });

      // auto tag suggestions
      var timer;
      $("section#vidmarks").on('keyup', 'input.tag_list', function(e) {
        clearTimeout(timer);
        var id = $(this).parent().parent().attr('id');
        var currentTags = _.getInputTags(id);
        timer = setTimeout(
                    _.getTagSuggestions(currentTags[currentTags.length - 1]),
                    300
                  );
      });

      /* */

      pub.displayTagList();
      pub.displayVidmarkList();
    });
  };

  /*******************************/

  _.vidmarks = {};
  _.templates = {};


  // title, visit_url, description, embed_url, thumbnail, tags
  _.templates.display_vidmark =
        '<div class="video_controls"><a href="#" class="delete">x</a></div>' +
        '<div class="video_details"><h1>{title}</h1>' +
        '<a target="_blank" href="{visit_url}">{visit_url}</a>' +
        '<div class="description"><h3>description</h3>' +
        '<p class="description">{description}</p></div></div>'+
        '<div class="video_embed">' +
        '<a class="various fancybox.iframe" href="{embed_url}">' +
        '<img src="{thumbnail}" alt="thumbnail"/></a></div>' +
        '<div class="tags">' +
        '<label name="tag_label" class="tag_label">tags</label>' +
        '<input class="tag_list" type="text" size="50" name="tags" ' +
          'value="{tags}"/>' +
        '<div class="tags_status"></div></div>';

  /*******************************/

  /*
   * present new vidmark data for submition
   */
  pub.displayNewVidmark = function(details) {
    var record_id = details['source'] + '_' + details['vid_id'];
    console.log('displayNewVidmark - vid_id:' + record_id, details);

    if (_.vidmarks[record_id]) {
      pub.displayMessage('that video already exists!', 'info');
      //pub.scrollToEntry(record_id);
      return false;
    }

    db.setCache('video', details['source']+'_'+details['vid_id'], details); // cache the details in case of save

    db.addVidmark(record_id).then(function () {
      $('#message').html('<p class="success">video saved!</p>');


      $("#vidmarks").prepend('<article id="' + record_id + '" class="vidmark">' +
            _.string_inject(_.templates.display_vidmark, {
                title: details['title'],
                visit_url: details['visit_url'],
                description: (details['description']) ?
                                    details['description'] : ' ',
                embed_url: details['embed_url'],
                thumbnail: details['thumbnail'],
                tags: ''
              }) + '</article>'
          );

      $('#message p').fadeOut('slow');
      //$('#'+record_id).removeClass('new_vidmark');
      $('#'+record_id).animate({backgroundColor: '#FFEAFF'}, 'slow', function() {
        $('#'+record_id).animate({backgroundColor: '#FFFFFF'}, 'slow');
      });
    });

  };

  /*
   * display existing vidmark entries
   */
  pub.displayVidmarkList = function() {
    console.log('displayVidmarkList()');
    var video_list = '';
    return db.getAll().then(function (list) {
      console.log('list:',list);
      _.vidmarks = list;
      $("#vidmarks").html('');
      return remoteStorage.util.asyncEach(Object.keys(list), function (id) {
        console.log('processing ['+id+'] '+list[id]+'|');
        if (list[id] === undefined) {
          // this video has been delted, update the tags
          console.log('displayVidmarksList() - this id[' + id +
                      '] is no good, removing it from storage');
          return db.removeVidmark(id);
        }
        return db.getTagsByRecord(id).then(function (tags) {
          var tags_formatted = _.formatTagList(tags);
          video_list = '<article id="' + id + '" class="vidmark">' +
            _.string_inject(_.templates.display_vidmark, {
              title: list[id]['title'],
              visit_url: list[id]['visit_url'],
              description: (list[id]['description']) ?
                                  list[id]['description'] : ' ',
              embed_url: list[id]['embed_url'],
              thumbnail: list[id]['thumbnail'],
              tags: tags_formatted
            }) + '</article>' + video_list;
          //console.log('video-list:'+video_list);
        });
        //console.log('END ['+id+']');
      }).then(function (result, errors) {
        console.log('displayVidmarkList() ERRORS:', errors);
        // write to dom for entire list just once
        $("#vidmarks").append(video_list);
      });
    });
  };

  /*
   * display tags and their counts in the aside bar
   */
  pub.displayTagList = function() {
    console.log('displayTagList()');
    db.getTagCounts().then(function (list) {
      console.log('displayTagList()  - return value: ',list);
      $("aside ul#full_tag_list").html('');

      for (var tag in list) {
        //console.log('processing ['+tag+']');
        //console.log('appending: <li id="'+tag+'">'+tag+' ('+list[tag]+')</li>');
        $('aside ul#full_tag_list').append('<li>' + tag + '</li> (' +
                                           list[tag] + ')<br />');
        //console.log('END ['+id+']');
      }
    });

  };

  pub.displayErrorVidmark = function() {
    console.log('errorVidmark called!');
  };

  pub.scrolToEntry = function(id) {
    $('#vidmarks').animate({scrollTop: $("#"+id).offset().top},'slow');
  };

  pub.displayMessage = function(message, type) {
    console.log('displayMessage('+message+')');
    if (!type) { type = 'info'; }
    $('#message').html('<p class="'+type+'">'+message+'</p>');
    $('#message p').delay(1000).fadeOut('slow');
  };

  /*
   * removes the specified video id from the display list
   */
  _.removeVidmarkEntry = function(id) {
    console.log('removeVidmarkEntry:'+id);
    delete _.vidmarks[id];
    $('#'+id).effect('explode', {}, 500);
  };
  _.updateTagStatus = function(id, message) {
    $('article#'+id+' div.tags_status').html(message);
  };
  _.getInputTags = function(id) {
    var tag_list = $('article#'+id+' input.tag_list').val()
                .replace(/^\s+/g, '').replace(/\s+$/g, '')
                .split(/\,\s*/);
    console.log('_.getInputTags: ',tag_list);
    return tag_list;
  };
  _.formatTagList = function(tags) {
    if (tags.length === 0) {
      tags.push(' ');
    }
    return tags.join(', ');
  };
  _.getTagSuggestions = function(word, cb) {
    console.log('getSuggestions for '+word);
    db.getAllTags(function (err, tags) {
      var reg = new RegExp("^"+word+"\\w*");
      var suggestions = [];
      var numTags = tags.length;
      for (var i = 0; i < numTags; i++) {
        if (reg.test(tags[i])) {
          suggestions.push(tags[i]);
        }
      }
      console.log('- suggestions: ', suggestions);
      cb(null, suggestions);
    });
  };

  /*
   * basic templating function (supplant)
   * uses keys from iValues and inserts value into string with {<key>} matches
   */
  _.string_inject = function(sSource, iValues) {
    if ((typeof iValues === 'object') && (iValues)) {
      return sSource.replace(/\{([^{}]*)\}/g, function(a, b) {
        var r = iValues[b];
        return typeof r === 'string' ? r : a;
      });
    } else {
      return sSource;
    }
  };

  return pub;
});
