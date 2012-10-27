if(!net) var net={};
if(!net.silverbucket) net.silverbucket={};
if(!net.silverbucket.vidmarks) net.silverbucket.vidmarks={};

/**
 * navMenu - little helper utility to handle navigation tasks
 *
 * requires: jQuery
 */
net.silverbucket.vidmarks.navMenu = function() {
    var pub = {};
    var _ = {};

    pub.init = function(pages) {
        _.pages = pages;
    };

    pub.toggle = function(page) {
        console.log('navMenu - click received');
        var num_pages = _.pages.length;
        for ( var i = 0; i < num_pages; i++ ) {
            if ( _.pages[i] != page ) {
                $("a#link-"+_.pages[i]).removeClass('selected');
                $("section#"+_.pages[i]).hide();
            }
        }
        // fade in page content
        $("section#"+page+"").fadeIn('fast');
        $("a#link-"+page+"").addClass('selected');
    };

    return pub;
}();

/**
 * appLogic - generic app related methods and logic
 *
 * requires: jQuery
 */
net.silverbucket.vidmarks.appLogic = function() {
    var pub = {};
    var _ = {};

    pub.init = function() {
        _.util = net.silverbucket.vidmarks.utilityFunctions;
        _.nav = net.silverbucket.vidmarks.navMenu;
        _.nav.init(['list']);//, 'submit']);
        _.nav.toggle('list');
        _.vidAPI = net.silverbucket.videoSiteAPI;
        _.db = net.silverbucket.vidmarks.dbModel;
        _.db.init();

        _.db.onAction('change', function(event) {
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
            _.nav.toggle('submit');
            return false;
        });

        $("a#link-list").click(function() {
            _.nav.toggle('list');

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
                if (!_.vidAPI.retrieveDetails(url, pub.displayNewVidmark, pub.displayErrorVidmark)) {
                    pub.displayMessage(_.vidAPI.getErrorMessage(), 'error');
                }
            }, 100);
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
                _.db.addVidmark(url);
                $('#input_vid_url').val('');
                return false;
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
                _.db.updateTagsForRecord(id, tag_list, function(){_.updateTagStatus(id, 'tags updated!');});
                pub.displayTagList(); // update tags list
                e.preventDefault();
                return false;
            }
        });

        // delete button
        $("section#vidmarks").on('click', 'a.delete', function(e) {
            var id = $(this).parent().parent().attr('id');
            //console.log('id:'+id+' wants to be deleteded');
            _.db.removeVidmark(id);
            return false;
        });

        // auto tag suggestions
        var timer;
        $("section#vidmarks").on('keyup', 'input.tag_list', function(e) {
            clearTimeout(timer);
            var id = $(this).parent().parent().attr('id');
            var currentTags = _.getInputTags(id);
            timer = setTimeout(_.getTagSuggestions(currentTags[currentTags.length - 1]), 300);
        });
        /* */

        pub.displayTagList();
        pub.displayVidmarkList();
    };

    /*******************************/

    _.vidmarks = {};
    _.templates = {};


    // title, visit_url, visit_url (readable), description, thumbnail
    _.templates.display_vidmark = '<div class="video_controls"><a href="#" class="delete">x</a></div>'+
                '<div class="video_details"><h1>{0}</h1>'+
                '<a target="_blank" href="{2}">{3}</a>'+
                '<div class="description"><h3>description</h3><p class="description">{4}</p></div></div>'+
                '<div class="video_embed"><img src="{5}" alt="thumbnail"/></div>'+
                '<div class="tags"><label name="tag_label" class="tag_label">tags</label>'+
                '<input class="tag_list" type="text" size="50" name="tags" value="{6}"/>'+
                '<div class="tags_status"></div></div>';

    /*******************************/

    /*
     * present new vidmark data for submition
     */
    pub.displayNewVidmark = function(details) {
        var record_id = details['source']+'_'+details['vid_id'];
        var tags = [' ']; // new entries wont have any tags
        console.log('displayNewVidmark - vid_id:'+record_id, details);

        if (_.vidmarks[record_id]) {
            pub.displayMessage('that video already exists!', 'info');
            //pub.scrollToEntry(record_id);
            return false;
        }

        _.db.setCache('video', details); // cache the details in case of save

        $("#vidmarks").prepend('<article id="'+record_id+'" class="new_vidmark vidmark">'+
                    '<div id="save_status"><a href="#add" class="button stretch" id="add-vidmark">add video</a></div>'+
                    _.string_inject(_.templates.display_vidmark,
                            [details['title'], details['visit_url'], details['visit_url'],
                            details['description'], details['thumbnail'], tags])+
                    '</article>'
                );

        // add listener for save call
        $("a#add-vidmark").click(function() {
            var vidmark_id = $(this).parent().parent().attr('id');
            console.log('vidmark_id['+vidmark_id+']');
            $('#save_status').html('<p class="status">saving video</p>');
            _.db.addVidmark(vidmark_id);
            $('#save_status').html('<p class="success">video saved! view <a href="#videos" id="quicklink-list">video list</a></p>');
            $(this).parent().parent().addClass('saved');
            $("a#quicklink-list").click(function() {
                _.nav.toggle('list');
                pub.displayVidmarkList();
                return false;
            });

            return false;
        });

        // when you hit enter in the tag input field, we save the new tags
        $("article#"+record_id+' input.tag_list').keypress(function (e) {
            if (e.which == 13) {
                console.log('ENTER was pressed tag field');
                var tag_list = _.getInputTags(record_id);
                _.db.setCache('tags', tag_list);
                _.updateTagStatus(record_id, 'tags will be saved along with video');
                e.preventDefault();
                return false;
            }
        });
    };

    /*
     * display existing vidmark entries
     */
    pub.displayVidmarkList = function() {
        console.log('displayVidmarkList()');
        var list = _.db.getAll();
        _.vidmarks = list;
        $("#vidmarks").html('');
        var video_list = '';
        for (var id in list) {
            console.log('processing ['+id+'] '+list[id]+'|');
            if (list[id] === undefined) {
                // this video has been delted, update the tags
                console.log('displayVidmarksList() - this id['+id+
                            '] is no good, remove it from storage');
                _.db.removeVidmark(id);
                continue;
            }
            var tags = _.db.getTagsByRecord(id);
            var tags_formatted = _.formatTagList(tags);
            video_list = '<article id="'+id+'" class="vidmark">'+
                _.string_inject(_.templates.display_vidmark,
                        [list[id]['title'], list[id]['visit_url'], list[id]['visit_url'],
                        list[id]['description'], list[id]['thumbnail'], tags_formatted])+
                '</article>' + video_list;
            //console.log('END ['+id+']');
        }
        // write to dom for entire list just once
        $("#vidmarks").append(video_list);
    };

    /*
     * display tags and their counts in the aside bar
     */
    pub.displayTagList = function() {
        console.log('displayTagList()');
        var list = _.db.getTagCounts();
        console.log('displayTagList()  - return value: ',list);
        $("aside ul#full_tag_list").html('');

        for (var tag in list) {
            //console.log('processing ['+tag+']');
            //console.log('appending: <li id="'+tag+'">'+tag+' ('+list[tag]+')</li>');
            $('aside ul#full_tag_list').append('<li>'+tag+'</li> ('+list[tag]+')<br />');
            //console.log('END ['+id+']');
        }
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
        $('#'+id).html('<div><p class="removed">entry removed</p></div>')
            .fadeOut(1000, function() {
                $('#'+id).remove();
        });
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
    _.getTagSuggestions = function(word) {
        console.log('getSuggestions for '+word);
        var tags = _.db.getAllTags();
        var reg = new RegExp("^"+word+"\\w*");
        var suggestions = [];
        var numTags = tags.length;
        for (var i = 0; i < numTags; i++) {
            if (reg.test(tags[i])) {
                suggestions.push(tags[i]);
            }
        }
        console.log('- suggestions: ', suggestions);
        return suggestions;
    };

    /*
     * basic templating function, stolen from:
     * http://mattsnider.com/template-string-replacement-function/
     */
    _.string_inject = function(sSource, aValues) {
        var i = 0;
        if (aValues && aValues.length) {
            return sSource.replace(/\{\d+\}/g, function(substr) {
                    var sValue = aValues[i];
                    if (sValue) {
                        i += 1;
                        return sValue;
                    } else {
                        return substr;
                    }
                });
        }
        return sSource;
    };

    return pub;
}();

$(document).ready(function() {
    var app = net.silverbucket.vidmarks.appLogic;
    app.init();
});