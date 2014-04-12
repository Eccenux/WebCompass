WebCompass
==========

*WebCompass* is a collection of helper functions/classes to make a HTML5 Compass with support for Apache Crodova (also known as [PhoneGap](http://docs.phonegap.com/)). There is also an example application that works both in mobile internet browsers and in [PhoneGap Build](https://build.phonegap.com/).

You can use any of the types of compass separately or use all of them (with fallback). By default order of fallback is following:
1. PhoneGap (native) compass - should be most accurate.
2. Browser compass - needs calibration, but should acurate after that.
3. Mocked compass - this is mainly for testing and so not advised in production code.

How to use libraries
--------------------

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

