;(function( window, document, $, undefined ) {
$( document ).ready(function() {

  var
    // loop vars
    i, j, l, innerl,

    // -- FindFlickr's "private" attributes
    // ajax config
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
    // window's dimensions (for infinitescroll)
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

  function _fetchPagePhotos() {
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
    $.when( this.loadPage() )
      .then(
        $.proxy(
        function() {
          // new page added, get new height and let's load the next one!
          _containerHeight = this.$container.height();
          _currentPageNb++;

          _$window.on( 'scroll', $.proxy(
            function scrollInContainer() {
              if ( _isContainerBottom() ) {

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

  function _clearContainer() {
    // remove handler
    _$window.off('scroll');

    var framesContainer = document.createElement('section');
    framesContainer.id = 'frames-container';
    
    if ( this.$framesContainer ) {
      // refresh
      this.$container[ 0 ].replaceChild( framesContainer, this.$framesContainer[ 0 ] );
    } else {
      // init
      this.$container[ 0 ].appendChild( framesContainer );
    }
    this.$framesContainer = $( framesContainer );
  }

  function _setTerm( term ) {
    // coercice input
    _term = '' + term;
    this.$searchField.val( _term );
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
      // photo size sorted by interest
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
      searchButton = document.createElement('button');

    // add some style
    header.id = 'search-header';
    searchField.id = 'search-field';
    searchField.setAttribute( 'type', 'search');
    searchField.setAttribute( 'placeholder', 'search...');
    searchField.setAttribute( 'autocomplete', 'off');
    searchButton.id = 'search-button';
    searchButton.innerHTML = '<img src="' + window.location.href + '/assets/flickr_logo.png">';

    header.appendChild(searchField);
    header.appendChild(searchButton);
    container.appendChild(header);

    // only one append operation = optimize reflow
    $elem[ 0 ].parentNode.replaceChild( container, $elem[ 0 ] );

    // now, let's wrap in jQuery
    this.$container = $( container );
    // for infinite scroll
    _containerTop = this.$container.offset().top;

    this.$header = $( header );
    this.$searchField = $( searchField );
    this.$searchButton = $( searchButton );

    this.$searchButton.on('click', $.proxy(
      function triggerSearch( e ) {
        var term = this.$searchField.val();
        this.search( term );

        e.preventDefault();
      },
      this)
    );

  }


  FindFlickr.prototype = {
    search: function search( term ) {
      term = term.replace(/\s+/g, '');
      if ( term ) {
        _setTerm.call( this, term );
        _currentPageNb = 1;
        
        // initialize or clear container
        _clearContainer.call( this );
        // initialize scrolling
        _infiniteScroll.call( this );
      } else {
        return null;
      }
    },

    loadPage: function loadPage( pageNumber, term ) {
      var deffered = new $.Deferred();

      if ( pageNumber && term ) {
        // #loadPage( 23, 'beer' )
        _clearContainer.call( this );
        // clean inputs
        _currentPageNb = parseInt( pageNumber );
        _setTerm.call( this, term );
      } else if ( !pageNumber && !term ) {
        // called from _infiniteScroll()
      } else {
        // user misuses
        return null;
      }

      $.when( _fetchPagePhotos() )
        .then(
          $.proxy(
            function( photosBatch ) {
            var
              photos = photosBatch.photos.photo,
              photoSizes = _fetchParams.photoSizes.split(','),
              frame = document.createElement('div'),
              photo, aEl, imgEl, url, width, height, sizeLabel,
              photoKey, imgEls = [];

            // for each photo, retrieve appropriate size
            // if not available, try another (3 attempts)
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

            // single append, imgs have their final dimensions -> reflow 1
            this.$framesContainer[ 0 ].appendChild( frame );

            // load imgs -> repaint
            for ( i = 0, l = imgEls.length; i < l; i +=1 ) {
              imgEls[ i ].src = imgEls[ i ].getAttribute('data-url');
            }

            // isotope all this stuff -> reflow 2
            $( frame ).isotope({
              itemSelector : '.photo',
              masonry: {
                gutterWidth: 5
              }
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

  // if selector dont target a unique element, do nothing
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

  window.findF = window.FindFlickr('#search-placeholder');

}); // domready
})( this, this.document, jQuery );