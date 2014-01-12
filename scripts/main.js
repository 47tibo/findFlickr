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
    },
    _$window = $( window ),
    _viewportHeight = null,
    // containerTop is relative to document
    _containerTop = null,
    _containerHeight = 0;

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

  function _isContainerBottom() {
    var
      windowScrollTop = _$window.scrollTop(),
      containerScrollTop = windowScrollTop + _containerTop;

    return (( _viewportHeight + containerScrollTop ) >= _containerHeight);
  }

  function _infiniteScroll() {
    $.when( this.loadPage( _currentPageNb ) )
      .then(
        $.proxy(
        function() {
          // new page added, get new height and let's load the next one!
          _containerHeight = this.$container.height();
          _currentPageNb++;

          _$window.on( 'scroll', $.proxy(
            function scrollInContainer() {
              if ( _isContainerBottom.call( this ) ) {

                console.log('bottom');

                _$window.off('scroll');
                _infiniteScroll.call( this );
              }
            }, this) );
        }, this ),
        function( errorType ) {
          console.log('an error occurs of type: ' + errorType);
        },
        function() {
          console.log('fetchnig datas....');
        }
      );
  }


  function FindFlickr( $elem ) {

    // misc vars
    var
      breakWidth = 768,
      viewportWidth = _$window.width();

    // private instance vars
    _viewportHeight = _$window.height(); // TODO update on resize


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
      moreButton = document.createElement('button');
      framesContainer = document.createElement('section');

    // add some style
    framesContainer.id = 'frames-container';
    searchButton.innerHTML = 'Search';
    moreButton.innerHTML  = 'More results';

    header.appendChild(searchField);
    header.appendChild(searchButton);
    container.appendChild(header);
    container.appendChild(framesContainer);

    // only one append operation = optimize reflow
    $elem[ 0 ].parentNode.replaceChild( container, $elem[ 0 ] );

    // now, let's wrap in jQuery
    this.$container = $( container );
    // for infinite scroll
    _containerTop = this.$container.offset().top;

    this.$header = $( header );
    this.$searchField = $( searchField );
    this.$searchButton = $( searchButton );
    this.$moreButton = $( moreButton );
    this.$framesContainer = $( framesContainer );

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
      
      // initialize scrolling
      _infiniteScroll.call( this );
    },

    loadPage: function loadPage( pageNumber ) {
      var deffered = new $.Deferred();

      $.when( _fetchPagePhotos( pageNumber ) )
        .then(
          $.proxy(
            function( photosBatch ) {
            var
              photos = photosBatch.photos.photo,
              photoSizes = _fetchParams.photoSizes.split(','),
              frame = document.createElement('div'),
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
              frame.appendChild( aEl );
            }

            // single append, imgs have dimensions -> reflow 1
            this.$framesContainer[ 0 ].appendChild( frame );

            // load imgs -> repaint
            for ( i = 0, l = imgEls.length; i < l; i +=1 ) {
              imgEls[ i ].src = imgEls[ i ].getAttribute('data-url');
            }

            // isotope all this stuff -> reflow 2
            $( frame ).masonry({
              itemSelector : '.photo',
              gutter: 10
            });

            deffered.resolve();
          },
          this ),
          function( errorType ) {
            deffered.reject( errorType );
          },
          function() {
            deffered.notify();
          }
        );
      return deffered.promise();
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