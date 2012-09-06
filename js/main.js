if(!net) var net={};
if(!net.silverbucket) net.silverbucket={};
if(!net.silverbucket.vidmarks) net.silverbucket.vidmarks={};

net.silverbucket.vidmarks.navMenu = function() {
    var pub = {};
    var _ = {};

    pub.init = function(pages) {
        _.pages = pages;
    }

    pub.toggle = function(page) {
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
    }
    
    return pub;
}();

net.silverbucket.vidmarks.DBModel = function() {
    var pub = {}; // public variable and functions container
    var _ = {}; // private variable and functions container

    pub.init = function() {
        console.log('- DB: init()');
        remoteStorage.claimAccess('bookmarks', 'rw');
        //remoteStorage.claimAccess('tags', 'rw');
        //remoteStorage.claimAccess('mappings', 'rw');
        remoteStorage.displayWidget('remotestorage-connect'); //after that (not before that) display widget

        console.log('- DB: getting priviteLists...');
        _.bookmarks = remoteStorage.bookmarks.getPrivateList('vidmarks');
        //_.tags      = remoteStorage.tags.getPrivateList('vidmarks');
        //_.mappings  = remoteStorage.mappings.getPrivateList('vidmarks');

        console.log('- DB: bookmarks obj:');
        console.log(_.bookmarks);
        //console.log('-- DB: tags');
        //console.log(_.tags);
        //console.log('-- DB: mappings');
        //console.log(_.mappings);

        _.bookmarks.on('error', function(err) {
            console.log('DB ERROR: '+err);
        });

        // XXX - this function returns only obj, not id
        _.bookmarks.on('change', function(obj) {
            console.log('DB CHANGE: bookmarks on(change) fired.');
            console.log(obj);
        });

        //console.log('MAIN: stats');
        //stats = _.bookmarks.getStats();
        //console.log(stats);
    }

    pub.addBookmark = function(url, title, description) {
        if (!description) { 
            var description = 'this is an example description, yours will be much more descriptive, of course.';
        }
        if (!title) {
            var title = 'Bookmark Title!'; 
        }

        var new_id = _.bookmarks.add(url, title, description);
        console.log('...submitted ['+url+'], got id['+new_id+']');
        return new_id;
    }

    pub.getAll = function() {
        console.log('- DB: getAll()');
        var ids = _.bookmarks.getIds();
        console.log(ids);
        var all = {};
        for (id in ids) {
            obj = _.bookmarks.get(id);
            console.log(obj);
            all[id] = obj;
        }
        return all;
    }

    pub.getById = function(id) {
        return _.bookmarks.get();
    }

    pub.deleteAll = function() {
        console.log('- DB: deleteAll()');
        var ids = _.bookmarks.getIds();
        console.log(ids);
        var all = {};
        for (id in ids) {
            _.bookmarks.remove(id);
        }
        return all;
    }


    return pub;
}();


$(document).ready(function() {
    var navMenu = net.silverbucket.vidmarks.navMenu;
    navMenu.init(['list', 'submit']);
    navMenu.toggle('submit');

    var DB = net.silverbucket.vidmarks.DBModel;
    DB.init();

    $("a#link-submit").click(function() {
        navMenu.toggle('submit');
        return false;
    }); 

    $("a#link-list").click(function() {
        navMenu.toggle('list');

        var vidmark_list = DB.getAll();

        for (e in vidmark_list) {
            $('#list_area tbody').append(
                    '<tr><td>'+e['title']+'</td></tr><tr><td>'+e['url']+
                    '</td></tr><tr colspan="2"><td>'+e['description']+
                    '</td></tr>'
                );
        }

        return false;
    });

    $("form#submit_url_form").validate({
        //set the rules for the field names
        rules: {
            vid_url: {
                minlength: 4,
                url: true
            },
        },
        //set messages to appear inline
        messages: {
            vid_url: ""
        },
        submitHandler: function(form) {
            console.log('form submittion passed validation');
            url = $('#input_vid_url').val();
            DB.addBookmark(url);

            return false;
        }
    });
    
});