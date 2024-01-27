WebCompass
==========

**WebCompass** is a collection of helper functions/classes that ease creating web based compass. There is support for both HTML5 (in-browser) compass and Apache Crodova (also known as [PhoneGap](http://docs.phonegap.com/)). I've also provided a working example application that works both in mobile internet browsers and in [PhoneGap Build](https://build.phonegap.com/).

**2024 update**: PhoneGap is long gone, and even though [Cordova is still used](https://cordova.apache.org/announcements/2024/01/12/survey-results.html), I've mostly [moved on to PWA](https://enux.pl/article/en/2018-04-02/responsive-website-pwa-one-day?language=en). Not that I think Cordova is not useful anymore; it is. It just costs more to produce than PWA. I'm closing down this repo for more reasons... With years of playing GPS-based games, I'd say that compasses in phones are not that useful in practice. I think they might not be feasible in a city environment (too many distortions, too much noise). So in practice navigation is more based on postion changes then actual compass. I still think manufactures could do more to make this more stable, but I won't hold my breath 😉

Working examples
----------------
* [Full version](http://m.enux.pl/compass/).
* [Using only browser compass](http://m.enux.pl/compass/browserOnly.html).
* [Mobile app](https://build.phonegap.com/apps/872131/share) (note that iPhone build is made with developer certificate and so will probably not work for you).

Source for examples is in the `example` folder of this repository. Note that this repository can also be used as a source for PhoneGap Build (PGB searches for a folder with `index.html`).

How to use libraries
--------------------

### Overview ###

You can use any of the types of compass separately or use all of them (with fallback). By default order of fallback is following:
1. PhoneGap (native) compass - should be most accurate.
2. Browser compass - needs calibration, but should acurate after that.
3. Mocked compass - this is mainly for testing and so not advised in production code.

### Basic API information ###

All files have full docs in the comments but here are some highlights:
* `CompassHelper` is a central class which uses `CompassInBrowser` and `CompassMock` to support different types of compass. Additionally `Logger` is required for logging to console.
* `CompassHelper` used alone is a proxy class for PhoneGap which simplifies it's API and makes it solid.
	* To check if compass is available you need to call `init` function. Note that all libraries need to be loaded before this check.
	* To have a live compass use `watchHeading` and pass it a function that receives current angle (0°-360°). Note that you should call `clearWatch` when compass is not needed anymore.
	* To read current angle once use `getCurrentHeading`. As browser compass needs calibration you will need use `watchHeading`.
* To use just `CompassInBrowser` alone you should use an example provided in the comment.
	* First you check `available` property.
	* Then you start compass with `start` function.
	* If compass is in calibration (`inCalibration` property) you need to display instructions for user and wait for `onCalibrationFinalization` call.
	* Then just replace `onAngleChange` function with image rotation or other angle (alpha) visualization function.

Quick example
-------------

jQuery is NOT required, but for this example I used it for sanity.

```js
var compassHelper = new CompassHelper();
var compassWatchID = null;

var $img = $('.compass img');
var $startButton = $('input[name=start]').click(function(){
	if (compassHelper.init().available && compassWatchID != null) {
		compassWatchID = compassHelper.watchHeading(function(angle){
			$img.rotate(angle);
		});
	}
})
var $stopButton = $('input[name=stop]').click(function(){
	if (compassWatchID != null) {
		compassHelper.clearWatch(compassWatchID);
		compassWatchID = null;
	}
})
```

In this example I use `rotate` function which is available with [jQuery Rotate library](http://code.google.com/p/jqueryrotate/). You can draw an image on canvas or use a different rotation library of course.

PhoneGap Build usage
--------------------

In `example` folder you will find an example application with basic stuff already setup.

### Compass plugin ###

There are two tricky parts in PhoneGap Build:

1. What is call "features" in Cordova documentation is called "plugins" in PhoneGap Build.
2. Compass is available within "Device orientation" plugin.

Knowing that you are all set. You just need this additional line in `config.xml` to enable compass:
```xml
	<gap:plugin name="org.apache.cordova.device-orientation" />
```
In later versions of Cordova/PhoneGap (at least 5.0+) the syntax is a bit different:
```xml
	<gap:plugin name="cordova-plugin-device-orientation" source="npm" />
```

### PhoneGap script ###

Also don't forget to include `phonegap.js` in your HTML:
```html    
    <script src="phonegap.js"></script>
```
Remember that you should NOT add `phonegap.js` to your repository. It will be added by PhoneGap Build automatically.

###Orientation lock###

The compass behaviour might be weird if you will not lock orientation of the device. Thankfully it's possible to lock orientation in PhoneGap. What you need is a [Screen orientation lock plugin](https://github.com/apache/cordova-plugin-screen-orientation).

You add the plugin by adding this to your `config.xml` (5.0+ syntax):
```xml
	<gap:plugin name="cordova-plugin-device-orientation" source="npm" />
```
Then you can lock orientation with something like:
```javascript
	document.addEventListener("deviceready", function(){
		screen.lockOrientation('portrait-primary');
	});
```
That would lock the whole app in portrait mode though.

If you are using *jQuery Mobile* you might want to lock only when navigating to the compass page and unlock when navigating away:
```javascript
	$(document).on("pageshow", "#page-compass", function() {
		screen.lockOrientation('portrait-primary');
	});
	$(document).on("pagehide", "#page-compass", function() {
		screen.unlockOrientation();
	});
```

Browser support
---------------

For in-browser compass support see: [Can I use information](http://caniuse.com/#feat=deviceorientation). That's not that good, but with PhoneGap it should work in more devices. 

Note that PhoneGap Build now only support 3 platforms. You can still build for other ones using older version of PhoneGap on Phonegap Build (pre 3.0) or just install PhoneGap on your computer and build to all platforms.
