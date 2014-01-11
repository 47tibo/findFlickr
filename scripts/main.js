;(function( window, document, $, undefined ) {
  $( document ).ready(function() {

    var i,
      _term = null,
      _fetchParams = null,
      _currentPageNb = null,
      _url = 'http://api.flickr.com/services/rest/?api_key=e2deebbdd91747fef895ebdbf71b6c70'
        + '&format=json&nojsoncallback=1';

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

      $.ajax({
        url: url,
        success: function( photosBatch ) {
          deffered.resolve( photosBatch );
        },
        error: function( jqXHR, errorType ) {
          deffered.reject( errorType );
        },
      });

      setTimeout(function fetchPending() {
        if ( deffered.state() === "pending" ) {
          deffered.notify();
          setTimeout( fetchPending, 500 );
        }
      }, 0 );

      return deffered.promise();
    }


    function FindFlickr( elem ) {

      // UI components
      this.$container = $('<article id="flickr-search">');
      this.$header = $('<header id="search-header">');
      this.$searchField = $('<input id="search-field" type="search" placeholder="search..." autocomplete="off" />');
      this.$searchButton = $('<button id="search-button">Search</button>');
      this.$moreButton = $('<button id="more-button">More results</button>');
      this.$body = $('<section id="search-body"></section>');

      var
        breakWidth = 768,
        viewportWidth = $( window ).width();

      if ( viewportWidth > breakWidth ) {
        _fetchParams = { batchSize: 20, photoSize: 'm' };
      } else {
        _fetchParams = { batchSize: 80, photoSize: 'z' };
      }

      // init UI
      $( elem ).replaceWith( $.proxy(
        function initUI() {
          this.$header
            .append( this.$searchField )
            .append( this.$searchButton );
          return this.$container
            .append( this.$header )
            .append( this.$body );
        },
        this)
      );

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
              console.log( photosBatch )
            },
            function( errorType ) {
            },
            function( status ) {
              console.log('in progress');
            }
          );
      }
    }

    
    
    window.FindFlickr = function( selector ) {
      var elem = $( selector ),
        ret;
      if ( elem.length === 1 ) {
        ret = new FindFlickr( elem );
      } else {
        ret = null;
      }
      return ret;
    };

    window.FindFlickr('#search-placeholder');

  }); // domready
})( this, this.document, jQuery );