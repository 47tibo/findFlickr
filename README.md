#A portable search engine for Flickr


## Usage
In the markup:
  - include the stylesheets (normalize.css, main.css, ie*.css) and the scripts (jquery, isotope, main.js)
  - insert an element anywhere, which acts as a placeholder and will be replaced by the search widget

In your script:
```javascript
// 'search-placeholder' is the placeholder's id
var findFlickr = FindFlickr('#search-placeholder');
```
That's it! You can now request Flickr's photos in an infinite scroll.

You can also handle the instance programmatically:
```javascript
// search a term and trigger an infinite scroll
  findFlickr.search('funk');
// search a term and retrieve a specific page in the matched photos
findFlickr.loadPage( 6, 'red apple' );
```
*Tip* : #loadPage can be use to easily implement a classical pagination

see a [demo](http://tcamp.fr/test/flickr/) here. Also try on a smartphone.




## Dependencies
**jQuery**:
For :
  - cross browser compatibility regards to elements dimensions and computed styles
  - events registration syntaxic sugar
  - ajax implementation. jQuery.ajax allows to implement Ajax calls in a breaze,
  from IE7 to Chrome Canary
  - Function.prototype.bind support for old browsers (jQuery.proxy)
  - jQuery.extend()
  - jQuery.Deferred() and promises 's control flow. Tremendously improve code comprehension and maintainability
  in a callback driven environment

**Isotope**:
For each request, the server returns a batch of 40 or 80 photos' urls. Those photos have various formats
and sizes. Isotope allows us to easily place them along a grid. The grid is also responsive.
We're using the masonry layout, but instead of the Masonry library, Isotope supports IE7.




## Architecture and technical constraints
The UI components and JS logic are wrapped into a FindFlickr interface (or class if you prefer).
Considering the access point to this interface, I didn't stick to classic jQuery pluggin template ($.fn).
Indeed FindFlickr doesn't need to inherit of jQuery. It's a standalone interface with some very specific
concerns.

There is two layouts, one for mobiles, the other for desktops, with the corresponding media querries.
For performance sake the batch's size is limited to 40 photos under smartphones and 80 under large screens.
Images are displayed in their original dimensions. Thus the images requested for mobiles devices are smaller than
large devices.
In order to optimize browser's reflows and repaints, I defined




## Implementation, issues, solutions

  - all code is wrapped within an immediate function: avoid polluting namespace and allow to
  retrieve reliable references of basic elements (eg window)
  - the only access point to the interface is the FindFlickr property, created on the global
  object. This property is a function which wraps the instanciation statement (facade pattern)
  - at first I used the jQuery constructor to instanciate and append to the DOM the UI elements 
  (HTML5 elements, like section). Unfortunately this approach raised some bug under IE8- and finally
  I handled those elements with JS API's statements. Ultimately most of DOM manipulations are done *natively*
  - I first tried to use XHR to retrieve datas but that implied to work in a CORS mode and
  it was buggy under IE. I resolved the issue by using jQuery's JSONP.
  - I crafted a little GIF to act as a spinner




## Browser support
  - Ubuntu 12.04: FF, CH
  - Windows Xp: FF, CH, Opera, IE7+
  - iPad, iPhone: Safari
  - Android: FF




## Improvements
  - hook onto the resize event to recompute viewport's height
  - improve infinite scroll under Android tab
  - each photo is wrapped into a link -> display the image in original size when
  clicking