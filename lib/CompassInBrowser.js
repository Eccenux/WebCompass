/**
 * In-browser compass initalization class.
 *
 * @author Maciej Nux Jaros 2013-2014
 *
 * @example Calibrate and rotate
 * <pre>
		function runCompass(compassImage, infoElement) {
			this.compass = new CompassInBrowser();
			if (!this.compass.available) {
				infoElement.innerHTML = "Sorry, compass is not available in your browser.";
				return;
			}

			this.compass.start();
			if (this.compass.inCalibration) {
				infoElement.innerHTML = "Please rotate your device clockwise.";
			}
			this.compass.onCalibrationFinalization = function(){
				infoElement.innerHTML = "Now we're cookin'";
			};
			this.compass.onAngleChange = function(alpha){
				// This works for any image when using: http://code.google.com/p/jqueryrotate/
				$(compassImage).rotate(-alpha);
				infoElement.innerHTML = alpha.toLocaleString();
			};
		}
 * </pre>
 *
 *
 * @warning In-browser compass is complicated due to browser differnces and needs calibration!
 *	Please instruct user to rotate his/her phone clockwise.
 *	More inromation: http://enux.pl/article/en/2014-01-15/html-compass-madness
 *
 * Licensed under (at ones choosing)
 *   <li>MIT License: http://www.opensource.org/licenses/mit-license
 *   <li>or CC-BY: http://creativecommons.org/licenses/by/3.0/
 *
 * @returns {CompassInBrowser}
 */
function CompassInBrowser() {
	/**
	 * True if compass is available.
	 *
	 * @readonly
	 * @type Boolean
	 */
	this.available = true == ('addEventListener' in window && 'ondeviceorientation' in window);

	/**
	 * Set to true when false positive availability was detected.
	 * @type Boolean
	 */
	this.falsePositiveDetected = false;

	/**
	 * Executed when false positive availability was detected.
	 * @type Boolean
	 */
	this.onFalsePositiveDetected = function(){};

	/**
	 * True if compass is still calibrating.
	 *
	 * @note read after `init` call.
	 *
	 * @type Boolean
	 */
	this.inCalibration = true;

	/**
	 * True if compass is already running.
	 *
	 * @type Boolean
	 */
	this.started = false;

	/**
	 * Meaningfull after calibration.
	 *
	 * @type Number
	 */
	this.lastAlpha = 0;

	/**
	 * Called when calibration just finished.
	 *
	 * Use it to hide user information.
	 *
	 * @note You should instruct user to rotate his/her phone clockwise up until this is called.
	 */
	this.onCalibrationFinalization = function() {};

	/**
	 * Called upon orientation change after calibration.
	 *
	 * @param {Number} alpha Current alpha.
	 */
	this.onAngleChange = function(alpha) {};

	/**
	 * Called upon orientation change when still calibrating.
	 *
	 * @warning Current alpha might not be what you expect. This function should be only used for debugging.
	 *
	 * @param {Number} alpha Current alpha.
	 */
	this.onCalibration = function(alpha) {};
}
(function(){
	// function for translating what is read from the browser to 0-360
	var directionTranslation = function(browserDirection)
	{
		return browserDirection;
	};
	// in basic calibration?
	var inBasicCalibration = true;
	// final angle after basicCalibration
	var initCalibrationAngle = 0;

	var LOG = new Logger('CompassInBrowser');

	/**
	 * Reset calibration process.
	 */
	CompassInBrowser.prototype.resetCalibration = function() {
		directionTranslation = function(browserDirection)
		{
			return browserDirection;
		};
		inBasicCalibration = true;
		initCalibrationAngle = 0;
		this.inCalibration = true;
	};

	/**
	 * Start reading compass.
	 * @returns {CompassInBrowser}
	 */
	CompassInBrowser.prototype.start = function(){
		if (!this.started) {
			this.started = true;
			window.addEventListener('deviceorientation', this, false);

			// make sure the device supports compass...
			var _self = this;
			setTimeout(function(){
				if (_self.started && _self.lastAlpha == 0) {
					LOG.info('still on 0 - assuming false positive ', _self);
					_self.falsePositiveDetected = true;
					_self.available = false;
					_self.onFalsePositiveDetected();
				}
			}, 1000);
		}
		return this;
	};

	/**
	 * Stop reading compass.
	 * @returns {CompassInBrowser}
	 */
	CompassInBrowser.prototype.stop = function(){
		window.removeEventListener('deviceorientation', this, false);
		this.started = false;
		// reset calibration if calibration was not finished to avoid confusion
		if (this.inCalibration) {
			this.resetCalibration();
		}
		return this;
	};


	/**
	 * Basic calibration (not yet know the range).
	 * 
	 * @note sets `directionTranslation`.
	 * @note also sets `initCalibrationAngle` - final angle.
	 * 
	 * @param {Number} alpha Alpha read from event.
	 * @returns {Boolean} false when done
	 */
	function basicCalibration(alpha) {
		// Nokia browser style (N9 tested): -180 to 180 where 180/-180 is North
		if (alpha < 0)
		{
			directionTranslation = function(browserDirection)
			{
				return Math.abs(browserDirection - 180);
			};
			initCalibrationAngle = Math.round(directionTranslation(alpha));
			return false;
		}
		// Android HTC HD, Fox+Opera; 0 to 360 where 0/360 is North
		else if (alpha > 180)
		{
			initCalibrationAngle = Math.round(directionTranslation(alpha));
			return false;
		}
		return true;
	}

	/**
	 * East-west calibration (checks if East is 90 or 270).
	 *
	 * @note sets `directionTranslation`.
	 *
	 * @param {Number} alpha Alpha read from event.
	 * @returns {Boolean} false when done
	 */
	function sidesCalibration(alpha) {
		// a is normalized to 0-360 integer
		var a = Math.round(directionTranslation(alpha));
		// normalize to 0-360 as if initCalibrationAngle where at 0
		a = (360 + a - initCalibrationAngle) % 360;
		// if user is between 60 and 120 deg. in the rotated space
		// this means we already have clock-wise compass (yupi!)
		if (60 < a && a < 120)
		{
			return false;
		}
		// if user is between 300 and 240 deg. in the rotated space
		// this means we need make it a clock-wise compass...
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

	/**
	 * Event hanlder.
	 *
	 * @private
	 * @param {type} event
	 */
	CompassInBrowser.prototype.handleEvent = function(event)
	{
		if (this.inCalibration)
		{
			// Figure out if range is -180; 180 or 0; 360.
			if (inBasicCalibration)
			{
				inBasicCalibration = basicCalibration(event.alpha);	// sets `inBasicCalibration` to false when done
			}
			// Figure out if East is 90 or 270.
			else
			{
				this.inCalibration = sidesCalibration(event.alpha);
				if (!this.inCalibration) {
					this.onCalibrationFinalization();
				}
			}
		}

		// send info. to user
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
