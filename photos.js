/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            elm.className = 'photo';

            var heartLink = document.createElement('a');
            heartLink.className = 'favorite';
            heartLink.href = '#';
            $(heartLink).click(toggleFavorite(img));

            var heart = document.createElement('i');
            heart.className = isFavorite(img) ? 'icon-heart' : 'icon-heart-empty';

            heartLink.appendChild(heart);
            elm.appendChild(img);
            elm.appendChild(heartLink);
            holder.appendChild(elm);
        };
    }

    function isFavorite(img) {
        return (favorites.indexOf(img.src) != -1);
    }

    function toggleFavorite(img) {
        return function(e) {
            e.preventDefault();

            var url = img.src;
            var index = favorites.indexOf(url);

            if(index != -1) {
                // remove cookie
                favorites.splice(index, 1);
                $(this).children()[0].className = 'icon-heart-empty';
            } else {
                // add cookie
                favorites.push(url);
                $(this).children()[0].className = 'icon-heart';
            }

            document.cookie = 'favorites=' + favorites.toString();
        }
    }

    function fetchFavorites() {
        var result = [];

        var cookie = document.cookie;
        var favorites = document.cookie.match(/favorites=[^; ]*/g);

        if(favorites && favorites.length) {
            result = favorites[0].replace(/favorites=/, '').split(",");
        }

        return result;
    }

    function isWindowFilled() {
        return ($(window).height() < $(document).height());
    }

    function isScrolledToBottom() {
        return ($(window).height() + $(window).scrollTop() == $(document).height());
    }

    // ----

    var max_per_tag = 5;
    var favorites = fetchFavorites();

    return function setup (tags, callback) {
        function refreshPhotos(max) {
            if(max == null) { max = max_per_tag; }

            loadAllPhotos(tags, max, function (err, items) {
                currentlyLoadingMore = false;
                $("#loading").fadeOut();
                if (err) { return callback(err); }

                each(items.map(renderPhoto), imageAppender('photos'));
                callback();

                if(!isWindowFilled()) {
                    refreshPhotos();
                }
            });
        }

        $(window).scroll(function() {
            if(isScrolledToBottom() && !currentlyLoadingMore) {
                $("#loading").fadeIn();

                currentlyLoadingMore = true;
                refreshPhotos(10);
            }
        });

        refreshPhotos();
    };
}(jQuery));
