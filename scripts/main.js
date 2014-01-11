;(function( window, document, $, undefined ) {
$( document ).ready(function() {

  var i,
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
        per_page: _fetchParams.batchSize,
        page: _currentPageNb
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

    if ( viewportWidth > breakWidth ) {
      _fetchParams = { batchSize: 20, photoSize: 'm' };
    } else {
      _fetchParams = { batchSize: 80, photoSize: 'z' };
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
      body = document.createElement('section');

    searchButton.innerHTML = 'Search';
    moreButton.innerHTML  = 'More results';

    header.appendChild(searchField);
    header.appendChild(searchButton);
    container.appendChild(header);
    container.appendChild(body);

    // only one append operation = optimize reflow
    $elem[ 0 ].parentNode.replaceChild( container, $elem[ 0 ] );

    // now, let's wrap in jQuery
    this.$container = $( container );
    this.$header = $( header );
    this.$searchField = $( searchField );
    this.$searchButton = $( searchButton );
    this.$moreButton = $( moreButton );
    this.$body = $( body );

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
          function( photosBatch ) {
            console.log( 'success!!!' );
            console.log( photosBatch );
          },
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