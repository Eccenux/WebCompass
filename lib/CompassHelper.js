/**
 * Compass helper class.
 *
 * @author Maciej Nux Jaros 2014
 *
 * @note Naming conventions for some functions taken from Apache Cordova (PhoneGap). Especially: getCurrentHeading, watchHeading, clearWatch.
 *
 * Licensed under (at ones choosing)
 *   <li>MIT License: http://www.opensource.org/licenses/mit-license
 *   <li>or CC-BY: http://creativecommons.org/licenses/by/3.0/
 *
 * @requires Logger
 * @optional CompassInBrowser
 * @optional CompassMock
 *
 * @param {Boolean} mockingEnabled If true then mocking mode will be available as a fallback.
 * @returns {CompassHelper}
 */
function CompassHelper(mockingEnabled) {
	/**
	 * After `init` call this will contain information on compass availibilty.
	 *
	 * @readonly
	 */
	this.availability = {
		'native' : false,
		'browser': false,
		'mock': typeof(mockingEnabled)=='undefined' ? false : mockingEnabled
	};

	/**
	 * True if compass is available.
	 *
	 * @note read after `init` call.
	 * @note when mocking is enabled this will also be true.
	 *
	 * @readonly
	 * @type Boolean
	 */
	this.available = false;

	/**
	 * Watch frequency.
	 *
	 * For now this only works for new watch registartions.
	 *
	 * @type Number
	 */
	this.frequency = 100;

	/**
	 * This is actualy a Cordova navigator.compass object.
	 * The type is for Netbeans.
	 * @type CompassHelper
	 */
	this.nativeCompass;

	/**
	 * @type CompassInBrowser
	 */
	this.browserCompass;

	/**
	 * Called when calibration just finished.
	 *
	 * Use it to hide user information.
	 *
	 * @note You should instruct user to rotate his/her phone clockwise up until this is called.
	 * @warning You MUST start watching heading first.
	 */
	this.onCalibrationFinalization = function() {};
}

(function(){
	var LOG = new Logger('CompassHelper');

	/**
	 * Choosen compass type.
	 *
	 * @note mock is disguised as native.
	 *
	 * @type String
	 */
	var compassType = 'native|browser';

	/**
	 * Error object returned in onError functions.
	 *
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#CompassError
	 *
	 * @param {Object} cordovaError Mapping to `this.errorCodes`.
	 */
	CompassHelper.prototype.Error = function(cordovaError) {
		this.code = this.codes.INTERNAL_ERROR;

		// custom/own error
		if (typeof(cordovaError)=='string') {
			this.code = cordovaError;
			return;
		}

		// check object
		if (typeof(cordovaError)=='undefined'
				|| !('COMPASS_NOT_SUPPORTED' in cordovaError)
				|| !('code' in cordovaError)
		) {
			LOG.error('mapping error object:', cordovaError);
			return;
		}

		// map
		if (cordovaError.code == cordovaError.COMPASS_NOT_SUPPORTED) {
			this.code = this.codes.NOT_SUPPORTED;
		}
	};
	/**
	 * Error codes returned in onError function.
	 * @readonly
	 */
	CompassHelper.prototype.Error.prototype.codes = {
		INTERNAL_ERROR : 'internal',
		NOT_SUPPORTED : 'not supported',
		/**
		 * Only returned by `getCurrentHeading`.
		 */
		NEEDS_CALIBRATION : 'calibrating'
	};

	// alias
	var errorCodes = CompassHelper.prototype.Error.prototype.codes;
	
	/**
	 * Maps watchID if onFalsePositiveDetected happened.
	 */
	function watchIdMapping(watchID) {
		return watchID;
	}

	/**
	 * Disable browser compass.
	 *
	 * Used internally after onFalsePositiveDetected.
	 *
	 * @note re-inits compass (with possible fallback to mock) and re-wrties current watches.
	 */
	CompassHelper.prototype.disableBrowserCompass = function(){
		var _self = this;
		// make sure it's off and re-init
		_self.browserCompass.stop();
		_self.browserCompass.onAngleChange = function(){};
		_self.availability.browser = false;
		_self.available = false;
		_self.init();
		// rewrite current watches
		if (_self.available) {
			var watchIDMap = [];
			for (var i=0; i<browserWatches.length; i++) {
				if (browserWatches[i].enabled) {
					var newID = _self.watchHeading(browserWatches[i].onSuccess, browserWatches[i].onError);
					watchIDMap[i] = newID;
				}
			}
			// add mapping
			watchIdMapping = function (watchID) {
				if (watchID in watchIDMap) {
					return watchIDMap[watchID];
				};
				return watchID;
			};
			browserWatches = [];
			browserWatchesActivityCount = 0;
		}
	};

	/**
	 * Compass initialization.
	 *
	 * Should be called before reading compass.
	 *
	 * @note PhoneGap/Cordova compass might be not avialable immediately, so this has to be delayed until device is ready
	 * (document.ready should be enough).
	 *
	 * @returns {CompassHelper} self.
	 */
	CompassHelper.prototype.init = function()
	{
		var _self = this;
		
		// check availability
		if ('navigator' in window && 'compass' in window.navigator) {
			this.nativeCompass = window.navigator.compass;
			this.availability['native'] = true;
			this.available = true;
		}
		if ('CompassInBrowser' in window) {
			if (typeof(this.browserCompass) != 'object') {
				this.browserCompass = new CompassInBrowser();
			}
			if (this.browserCompass.available) {
				this.availability.browser = true;
				this.available = true;
				// make sure browser compass is supported
				this.browserCompass.onFalsePositiveDetected = function(){
					LOG.warn("browserCompass not available!");
					_self.disableBrowserCompass();
				};
			}
		}
		if ('CompassMock' in window && this.availability.mock) {
			if (typeof(this.nativeCompass) != 'object') {
				this.nativeCompass = new CompassMock();
			}
			this.available = true;
		}

		// choose compass
		if (this.availability['native']) {
			compassType = 'native';
		}
		else if (this.availability.browser) {
			compassType = 'browser';
		}
		else if (this.availability.mock) {
			compassType = 'native';
		}

		return this;
	};

	/**
	 * Error proxy (helper).
	 *
	 * @param {CompassHelper} compassHelper CompassHelper instance
	 * @param {Function} onError User function.
	 * @param {Object|String} cordovaError error returned by Cordova.
	 */
	function onErrorProxy(compassHelper, onError, cordovaError) {
		// error mapping
		var error = new compassHelper.Error(cordovaError);

		// call user function
		if (typeof (onError) == "function") {
			onError(error);
		}
		// default
		else {
			LOG.error('error code:'+error.code);
		}
	}

	var browserWatchesActivityCount = 0;
	var browserWatches = [];
	
	/**
	 * Due to instability and quirks depending on platform we just return `magneticHeading`.
	 * @param {Object} cordovaHeading
	 * @returns {Number} N=0, E=90
	 */
	function cordovaHeadingToHeading(cordovaHeading) {
		return cordovaHeading.magneticHeading;
	}

	/**
	 * At a regular interval, get the compass heading in degrees.
	 * 
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#compass.watchHeading
	 *
	 * @todo compassType = 'browser';
	 *
	 * @param {Function} onSuccess Function to call upon successful read.
	 *		Example: function(alpha) {LOG.info('compass angle (heading):'+alpha)}
	 * @param {Function} onError [optional] Function to call upon error.
	 *		Example: function(error) {LOG.error('error code:'+error.code)}
	 *		See this.Error for information on
	 * @returns {Number} Watch ID (use it to stop watching compass).
	 */
	CompassHelper.prototype.watchHeading = function(onSuccess, onError) {
		var _self = this;

		// check if antyhing is available...
		if (!this.available) {
			onErrorProxy(_self, onError, errorCodes.NOT_SUPPORTED);
			return -1;
		}

		var watchID;
		LOG.info('watchHeading, ', watchID);

		// run native (or mock)
		if (compassType == 'native') {
			_self.onCalibrationFinalization();	// call to avoid behaviour differences
			watchID = this.nativeCompass.watchHeading(function(cordovaHeading) {
				onSuccess(cordovaHeadingToHeading(cordovaHeading));
			}, function(cordovaError) {
				onErrorProxy(_self, onError, cordovaError);
			}, {
				frequency : _self.frequency
			});
		// browser
		} else {
			var watchID = browserWatches.length;
			/* @type CompassInBrowser */
			var compass = this.browserCompass;
			if (!compass.started) {
				LOG.info('starting');
				compass.start();
			}
			if (!compass.inCalibration) {
				LOG.info('calibration already done');
				_self.onCalibrationFinalization();
			} else {
				LOG.info('calibration');
				compass.onCalibrationFinalization = function(){
					LOG.info('calibration done');
					_self.onCalibrationFinalization();
				};
			}
			browserWatchesActivityCount++;
			browserWatches[watchID] = {
				enabled : true,
				onSuccess : onSuccess,
				onError : onError
			};
			compass.onAngleChange = function(alpha){
				for (var i=0; i<browserWatches.length; i++) {
					if (browserWatches[i].enabled) {
						browserWatches[i].onSuccess(alpha);
					}
				}
			};
		}

		return watchID;
	};

	/**
	 * Stop watching the compass referenced by the watch ID parameter.
	 *
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#compass.clearWatch
	 *
	 * @param {Number} watchID The ID returned by `compass.watchHeading`.
	 */
	CompassHelper.prototype.clearWatch = function(watchID) {
		// check if antyhing is available...
		if (!this.available) {
			LOG.error('error code:'+errorCodes.NOT_SUPPORTED);
			return;
		}

		// run native (or mock)
		if (compassType == 'native') {
			this.nativeCompass.clearWatch(watchIdMapping(watchID));
		// browser
		} else {
			if (watchID in browserWatches && browserWatches[watchID].enabled) {
				browserWatches[watchID].enabled = false;
				browserWatchesActivityCount--;
				if (browserWatchesActivityCount <= 0) {
					browserWatchesActivityCount = 0;
					this.browserCompass.stop();
				}
			}
		}
	};

	/**
	 * Get the current compass heading in degrees.
	 *
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#compass.getCurrentHeading
	 * @note Due to instability and quirks depending on platform `onSuccess` function is simplified and only returns `magneticHeading`.
	 *
	 * @todo compassType = 'browser';
	 *
	 * @param {Function} onSuccess Function to call upon successful read.
	 *		Example: function(alpha) {LOG.info('compass angle (heading):'+alpha)}
	 * @param {Function} onError [optional] Function to call upon error.
	 *		Example: function(error) {LOG.error('error code:'+error.code)}
	 *		error is an instance of `CompassHelper.prototype.Error`.
	 *		See CompassHelper.prototype.Error.prototype.codes for information on expected errors.
	 */
	CompassHelper.prototype.getCurrentHeading = function(onSuccess, onError) {
		var _self = this;

		// check if antyhing is available...
		if (!this.available) {
			onErrorProxy(_self, onError, errorCodes.NOT_SUPPORTED);
			return;
		}

		// run native (or mock)
		if (compassType == 'native') {
			this.nativeCompass.getCurrentHeading(function(cordovaHeading) {
				onSuccess(cordovaHeadingToHeading(cordovaHeading));
			}, function(cordovaError) {
				onErrorProxy(_self, onError, cordovaError);
			});
		// browser
		} else {
			/* @type CompassInBrowser */
			var compass = this.browserCompass;
			if (compass.inCalibration) {
				onErrorProxy(_self, onError, errorCodes.NEEDS_CALIBRATION);
			}
			else {
				if (!compass.started) {
					compass.start().onAngleChange = function(alpha){
						onSuccess(alpha);
						compass.stop();
					};
				} else {
					onSuccess(compass.lastAlpha);
				}
			}
		}
	};
})();
