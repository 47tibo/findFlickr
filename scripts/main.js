;(function( window, document, $, undefined ) {
$( document ).ready(function() {

  var i, j, l, innerl,
    _term = null,
    _fetchParams = null,
    _currentPageNb = null,
    _url = 'http://api.flickr.com/services/rest/?api_key=e2deebbdd91747fef895ebdbf71b6c70'
      + '&format=json&jsoncallback=ieFix',
    _jsonpSettings = {
      dataType: 'jsonp',
      contentType: "application/json",
      jsonpCallback: 'ieFix'
    };

  // useless, only to properly process jsonp
  function ieFix(){}

  function _completeQuery( params ) {
    var url = _url;
    for ( i in params ) {
      url += ( '&' + i + '=' + params[ i ] );
    }
    return url;
  }

  function _fetchPagePhotos( pageNumber ) {
    var deffered = new $.Deferred(),
      params = {
        method: 'flickr.photos.search',
        text: _term,
        page: _currentPageNb,
        per_page: _fetchParams.batchSize,
        extras: _fetchParams.photoSizes
      },
      url = _completeQuery( params );

    $.ajax($.extend(
      _jsonpSettings,
      {
        url: url,
        success: function( photosBatch ) {
          deffered.resolve( photosBatch );
        },
        error: function( jqXHR, errorType ) {
          deffered.reject( errorType );
        }
      })
    );

    setTimeout(function fetchPending() {
      if ( deffered.state() === "pending" ) {
        deffered.notify();
        setTimeout( fetchPending, 300 );
      }
    }, 0 );

    return deffered.promise();
  }


  function FindFlickr( $elem ) {

    // misc vars
    var
      breakWidth = 768,
      viewportWidth = $( window ).width();

    if ( viewportWidth < breakWidth ) {
      // small devices
      // picture size sorted by interest
      _fetchParams = { batchSize: 40, photoSizes: 'url_t,url_s,url_q' };
    } else {
      _fetchParams = { batchSize: 80, photoSizes: 'url_n,url_m,url_z' };
    }


    // UI components
    // this.$container = $('<article id="flickr-search">');
    // and $elem.replaceWith() buggy under IE7 & 8
    // let's do it the classical way
    var
      container = document.createElement('article'),
      header = document.createElement('header'),
      searchField =document.createElement('input'),
      searchButton = document.createElement('button'),
      moreButton = document.createElement('button'),
      frame = document.createElement('section');

    // add some style
    frame.id = 'frame';
    searchButton.innerHTML = 'Search';
    moreButton.innerHTML  = 'More results';

    header.appendChild(searchField);
    header.appendChild(searchButton);
    container.appendChild(header);
    container.appendChild(frame);

    // only one append operation = optimize reflow
    $elem[ 0 ].parentNode.replaceChild( container, $elem[ 0 ] );

    // now, let's wrap in jQuery
    this.$container = $( container );
    this.$header = $( header );
    this.$searchField = $( searchField );
    this.$searchButton = $( searchButton );
    this.$moreButton = $( moreButton );
    this.$frame = $( frame );

    this.$searchButton.on('click', $.proxy(
      function triggerSearch( e ) {
        var term = this.$searchField.val();
        this.search( term );

        e.preventDefault();
      },
      this)
    );

    this.$moreButton.on('click', $.proxy(
      function loadNextPage( e ) {
        // TODO, load next page depending on current page

        e.preventDefault();
      },
      this)
    );

  }


  FindFlickr.prototype = {
    search: function search( term ) {
      _term = term;
      _currentPageNb = 1;
      this.loadPage( 1 );
    },

    loadPage: function loadPage( pageNumber ) {
      $.when( _fetchPagePhotos( pageNumber ) )
        .then(
          $.proxy(
            function( photosBatch ) {
            // here we're dealing in the old way because documentfragment is faster than jquery's append
            // http://jsperf.com/documentfragment-appendchild-vs-jquery-append
            var
              photos = photosBatch.photos.photo,
              photoSizes = _fetchParams.photoSizes.split(','),
              fragment = document.createDocumentFragment(),
              photo, aEl, imgEl, url, width, height, sizeLabel,
              photoKey, imgEls = [];

            for ( i = 0, l = photos.length; i < l; i +=1 ) {
              photo = photos[ i ];
              aEl = document.createElement('a');
              aEl.className = 'photo';
              imgEl = document.createElement('img');

              for ( j = 0, innerl = photoSizes.length; j <  innerl; j += 1 ) {
                for ( photoKey in photo ) {
                  if ( photoKey === photoSizes[ j ] ) {
                    url = photo[ photoKey ];
                    sizeLabel = photoKey.split('_')[1];
                    width = photo['width_' + sizeLabel];
                    height = photo['height_' + sizeLabel];
                    break;
                  }
                }
                if ( url ) {
                  break;
                }
              }

              imgEl.setAttribute( 'width', width );
              imgEl.setAttribute( 'height', height );
              imgEl.setAttribute( 'data-url', url );
              imgEls.push( aEl.appendChild( imgEl ) );
              fragment.appendChild( aEl );
            }

            // single append, imgs have dimensions -> reflow 1
            this.$frame[ 0 ].appendChild( fragment );

            // load imgs -> repaint
            for ( i = 0, l = imgEls.length; i < l; i +=1 ) {
              imgEls[ i ].src = imgEls[ i ].getAttribute('data-url');
            }

            // isotope all this stuff -> reflow 2
            this.$frame.masonry({
              itemSelector : '.photo',
              gutter: 10
            });
          },
          this),
          function( errorType ) {
          },
          function() {
            console.log('in progress');
          }
        );
    }
  }

  
  window.FindFlickr = function( selector ) {
    var $elem = $( selector ),
      ret;
    if ( $elem.length === 1 ) {
      ret = new FindFlickr( $elem );
    } else {
      ret = null;
    }
    return ret;
  };

  window.FindFlickr('#search-placeholder');

}); // domready
})( this, this.document, jQuery );