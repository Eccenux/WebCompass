
// Logger.js, line#0

// EOC
function Logger(tag) {
	this.enabled = true;
	this._tag = tag;
	this.performanceEnabled = true;
	this.performancePrevious = 0;
	if (this.performanceEnabled) {
		this.performanceNow = (typeof(performance)!='undefined' && 'now' in performance)
		? function () {
			return performance.now();
		}

		: function () {
			return (new Date()).getTime();
		};
		this.performancePrevious = this.performanceNow();
	}
}
// EOC
Logger.prototype.isEnabled = function (level) {
// EOC
	if (this.enabled && typeof(console)!='undefined' && 'log' in console) {
		return true;
	}
	var enabled = false;
	switch (level) {
		case 'info':
		break;
		case 'warn':
			if ('warn' in console) {
				enabled = true;
			}
		break;
		case 'error':
			if ('error' in console) {
				enabled = true;
			}
		break;
	}
	return enabled;
};
// EOC
Logger.prototype._variableToReadableString = function (variable) {
	var text = variable;
	if (typeof(text) == 'undefined') {
		text = '[undefined]';
	}
	else if (typeof(text) != 'string') {
		try {
			text = JSON.stringify(text);
		} catch (e) {
			try {
				text = JSON.stringify(JSON.decycle(text, true));
			} catch (e) {
				text = text.toString();
			}
		}
		text = text
				.replace(/","/g, '",\n"')
				.replace(/\{"/g, '{\n"')
				.replace(/"\}(?=[,}]|$)/g, '"\n}')
		;
	}
	return text;
};
// EOC
Logger.prototype._renderArguments = function (argumentsArray) {
	var text = "";
	for (var i = 0; i < argumentsArray.length; i++) {
		text += this._variableToReadableString(argumentsArray[i]);
	}
	if (this._tag.length) {
		return "["+this._tag+"] " + text;
	}
	return text;
};
// EOC
Logger.prototype.performance = function (comment) {
	if (this.performanceEnabled && this.isEnabled('info')) {
		var now = this.performanceNow();
		this.info(comment, '; diff [ms]: ', now - this.performancePrevious);
		this.performancePrevious = now;
	}
};
// EOC
Logger.prototype.info = function () {
	if (this.isEnabled('info')) {
		console.log(this._renderArguments(arguments));
	}
};
// EOC
Logger.prototype.warn = function () {
	if (this.isEnabled('warn')) {
		console.warn(this._renderArguments(arguments));
	}
};
// EOC
Logger.prototype.error = function () {
	if (this.isEnabled('error')) {
		console.error(this._renderArguments(arguments));
	}
};
// Logger.js, EOF
// CompassInBrowser.js, line#0

// EOC
function CompassInBrowser() {
// EOC
	this.available = true == ('addEventListener' in window && 'ondeviceorientation' in window);
// EOC
	this.falsePostivieDetected = false;
// EOC
	this.onFalsePostivieDetected = function(){};
// EOC
	this.inCalibration = true;
// EOC
	this.started = false;
// EOC
	this.lastAlpha = 0;
// EOC
	this.onCalibrationFinalization = function() {};
// EOC
	this.onAngleChange = function(alpha) {};
// EOC
	this.onCalibration = function(alpha) {};
}
(function(){

	var directionTranslation = function(){};

	var inBasicCalibration = true;

	var initCalibrationAngle = 0;
// EOC
	CompassInBrowser.prototype.resetCalibration = function() {
		directionTranslation = function(browserDirection)
		{
			return browserDirection;
		};
		inBasicCalibration = true;
		initCalibrationAngle = 0;
		this.inCalibration = true;
	};
// EOC
	CompassInBrowser.prototype.start = function(){
		if (!this.started) {
			this.started = true;
			window.addEventListener('ondeviceorientation', this, false);


			var _self = this;
			setTimeout(function(){
				if (_self.started && _self.lastAlpha == 0) {
					_self.falsePostivieDetected = true;
					_self.available = false;
					_self.onFalsePostivieDetected();
				}
			}, 500);
		}
		return this;
	};
// EOC
	CompassInBrowser.prototype.stop = function(){
		window.removeEventListener('ondeviceorientation', this, false);
		this.started = false;

		if (this.inCalibration) {
			this.resetCalibration();
		}
		return this;
	};
// EOC
	function basicCalibration(alpha) {

		if (alpha < 0)
		{
			directionTranslation = function(browserDirection)
			{
				return Math.abs(browserDirection - 180);
			};
			initCalibrationAngle = Math.round(directionTranslation(alpha));
			return false;
		}

		else if (alpha > 180)
		{
			initCalibrationAngle = Math.round(directionTranslation(alpha));
			return false;
		}
		return true;
	}
// EOC
	function sidesCalibration(alpha) {

		var a = Math.round(directionTranslation(alpha));

		a = (360 + a - initCalibrationAngle) % 360;


		if (60 < a && a < 120)
		{
			return false;
		}


		else if (240 < a && a < 300)
		{
			var prevDirectionTranslation = directionTranslation;
			directionTranslation = function(browserDirection)
			{
				return Math.abs(360 - prevDirectionTranslation(browserDirection));
			};

			return false;
		}
		return true;
	}
// EOC
	CompassInBrowser.prototype.handleEvent = function(event)
	{
		if (this.inCalibration)
		{

			if (inBasicCalibration)
			{
				inBasicCalibration = basicCalibration(event.alpha);
			}

			else
			{
				this.inCalibration = sidesCalibration(event.alpha);
				if (this.inCalibration) {
					this.onCalibrationFinalization();
				}
			}
		}


		var alpha = directionTranslation(event.alpha);
		this.lastAlpha = alpha;
		if (this.inCalibration)
		{
			this.onCalibration(alpha);
		}
		else
		{
			this.onAngleChange(alpha);
		}
	};
})();

// CompassInBrowser.js, EOF
// CompassMock.js, line#0

// EOC
function CompassMock() {
// EOC
	this.changeFrequency = 200;
// EOC
	this.angleChange = 0.4;

	var changeID = null;
	var watchID = null;
	var currentAngle = 0;
// EOC
	this.start = function() {
		var _self = this;
		changeID = setInterval(function() {
			currentAngle += _self.angleChange;
			if (currentAngle < 0) {
				currentAngle = 360 + currentAngle;
			}
			else if (currentAngle > 360) {
				currentAngle = currentAngle - 360;
			}
		}, _self.changeFrequency);
		return this;
	};
// EOC
	this.stop = function() {
		clearInterval(changeID);
		return this;
	};
// EOC
	this.watchHeading = function(onSuccess, onError, options) {
		this.start();


		var frequency = 150;
		try {
			frequency = options.frequency;
		} catch(e) {}


		watchID = setInterval(function() {
			onSuccess({magneticHeading:currentAngle});
		}, frequency);

		return watchID;
	};
// EOC
	this.clearWatch = function(watchID) {
		clearInterval(watchID);
	};
// EOC
	this.getCurrentHeading = function(onSuccess) {
		onSuccess({magneticHeading:currentAngle});
	};
}

// CompassMock.js, EOF
// CompassHelper.js, line#0

// EOC
function CompassHelper(mockingEnabled) {
// EOC
	this.availability = {
		'native' : false,
		'browser': false,
		'mock': typeof(mockingEnabled)=='undefined' ? false : mockingEnabled
	};
// EOC
	this.available = false;
// EOC
	this.frequency = 100;
// EOC
	this.nativeCompass;
// EOC
	this.browserCompass;
// EOC
	this.onCalibrationFinalization = function() {};
}

(function(){
	var LOG = new Logger('CompassHelper');
// EOC
	var compassType = 'native|browser';
// EOC
	CompassHelper.prototype.Error = function(cordovaError) {
		this.code = this.codes.INTERNAL_ERROR;


		if (typeof(cordovaError)=='string') {
			this.code = cordovaError;
			return;
		}


		if (typeof(cordovaError)=='undefined'
				|| !('COMPASS_NOT_SUPPORTED' in cordovaError)
				|| !('code' in cordovaError)
		) {
			LOG.error('mapping error object:', cordovaError);
			return;
		}


		if (cordovaError.code == cordovaError.COMPASS_NOT_SUPPORTED) {
			this.code = this.codes.NOT_SUPPORTED;
		}
	};
// EOC
	CompassHelper.prototype.Error.prototype.codes = {
		INTERNAL_ERROR : 'internal',
		NOT_SUPPORTED : 'not supported',
// EOC
		NEEDS_CALIBRATION : 'calibrating'
	};


	var errorCodes = CompassHelper.prototype.Error.prototype.codes;
// EOC
	function watchIdMapping(watchID) {
		return watchID;
	}
// EOC
	CompassHelper.prototype.init = function()
	{
		var _self = this;


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

				this.browserCompass.onFalsePostivieDetected = function(){
					LOG.warn("browserCompass not available!");
					// make sure it's off and re-init
					_self.browserCompass.stop();
					_self.browserCompass.onAngleChange = function(){};
					_self.availability.browser = false;
					_self.available = false;
					_self.init();

					if (_self.available) {
						var watchIDMap = [];
						for (var i=0; i<browserWatches.length; i++) {
							if (browserWatches[i].enabled) {
								var newID = _self.watchHeading(browserWatches[i].onSuccess, browserWatches[i].onError);
								watchIDMap[i] = newID;
							}
						}

						watchIdMapping = function (watchID) {
							if (watchID in watchIDMap) {
								return watchIDMap[watchID];
							};
							return watchID;
						}
						browserWatches = [];
						browserWatchesActivityCount = 0;
					}
				};
			}
		}
		if ('CompassMock' in window && this.availability.mock) {
			if (typeof(this.nativeCompass) != 'object') {
				this.nativeCompass = new CompassMock();
			}
			this.available = true;
		}


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
// EOC
	function onErrorProxy(compassHelper, onError, cordovaError) {

		var error = new compassHelper.Error(cordovaError);


		if (typeof (onError) == "function") {
			onError(error);
		}

		else {
			LOG.error('error code:'+error.code);
		}
	}

	var browserWatchesActivityCount = 0;
	var browserWatches = [];
// EOC
	CompassHelper.prototype.watchHeading = function(onSuccess, onError) {
		var _self = this;


		if (!this.available) {
			onErrorProxy(_self, onError, errorCodes.NOT_SUPPORTED);
			return -1;
		}

		var watchID;


		if (compassType == 'native') {
			watchID = this.nativeCompass.watchHeading(function(cordovaHeading) {
				onSuccess(cordovaHeading.magneticHeading);
			}, function(cordovaError) {
				onErrorProxy(_self, onError, cordovaError);
			}, {
				frequency : _self.frequency
			});

		} else {
			var watchID = browserWatches.length;
// EOC
			var compass = this.browserCompass;
			if (!compass.started) {
				compass.start();
			}
			if (!compass.inCalibration) {
				_self.onCalibrationFinalization();
			} else {
				compass.onCalibrationFinalization = function(){
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
				for (var i=0; i<browserWatches; i++) {
					if (browserWatches[i].enabled) {
						browserWatches[i].onSuccess(alpha);
					}
				}
			};
		}

		return watchID;
	};
// EOC
	CompassHelper.prototype.clearWatch = function(watchID) {

		if (!this.available) {
			LOG.error('error code:'+errorCodes.NOT_SUPPORTED);
			return;
		}


		if (compassType == 'native') {
			this.nativeCompass.clearWatch(watchIdMapping(watchID));

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
// EOC
	CompassHelper.prototype.getCurrentHeading = function(onSuccess, onError) {
		var _self = this;


		if (!this.available) {
			onErrorProxy(_self, onError, errorCodes.NOT_SUPPORTED);
			return;
		}


		if (compassType == 'native') {
			this.nativeCompass.getCurrentHeading(function(cordovaHeading) {
				onSuccess(cordovaHeading.magneticHeading);
			}, function(cordovaError) {
				onErrorProxy(_self, onError, cordovaError);
			});

		} else {
// EOC
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

// CompassHelper.js, EOF