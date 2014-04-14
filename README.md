WebCompass
==========

*WebCompass* is a collection of helper functions/classes that ease creating web based compass. There is support for both HTML5 (in-browser) compass and Apache Crodova (also known as [PhoneGap](http://docs.phonegap.com/)). I've also provided a working example application that works both in mobile internet browsers and in [PhoneGap Build](https://build.phonegap.com/).

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

There are two tricky parts in PhoneGap Build:

1. What is call "features" in Cordova documentation is called "plugins" in PhoneGap Build.
2. Compass is available within "Device orientation" plugin.

Knowing that you are all set. You just need this additional line in `config.xml` to enable compass:
```xml
	<gap:plugin name="org.apache.cordova.device-orientation" />
```

Also don't forget to include `phonegap.js` in your HTML:
```html    
    <script src="phonegap.js"></script>
```
Remember that you should NOT add `phonegap.js` to your repository. It will be added by PhoneGap Build automatically.

In `example` folder you will find an example application.

Browser support
---------------

For in-browser compass support see: [Can I use information](http://caniuse.com/#feat=deviceorientation). That's not that good, but with PhoneGap it should work in more devices. 

Note that PhoneGap Build now only support 3 platforms. You can still build for other ones using older version of PhoneGap on Phonegap Build (pre 3.0) or just install PhoneGap on your computer and build to all platforms.