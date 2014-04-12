/**
 * Compass mocking.
 *
 * @author Maciej Nux Jaros 2014
 *
 * @note Naming conventions for functions taken from Apache Cordova (PhoneGap).
 *
 * Licensed under (at ones choosing)
 *   <li>MIT License: http://www.opensource.org/licenses/mit-license
 *   <li>or CC-BY: http://creativecommons.org/licenses/by/3.0/
 *
 * @returns {CompassMock}
 */
function CompassMock() {
	/**
	 * Change frequency.
	 *
	 * @type Number
	 */
	this.changeFrequency = 200;

	/**
	 * Angle change on each tick.
	 *
	 * @type Number
	 */
	this.angleChange = 0.4;

	var changeID = null;
	var watchID = null;
	var currentAngle = 0;

	/**
	 * Start changes.
	 * @returns {CompassMock}
	 */
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
	/**
	 * Stop changes.
	 * @returns {CompassMock}
	 */
	this.stop = function() {
		clearInterval(changeID);
		return this;
	};

	/**
	 * At a regular interval, get the compass heading in degrees.
	 * 
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#compass.watchHeading
	 *
	 * @param {Function} onSuccess Function to call upon successful read.
	 *		Example: function(heading) {LOG.info('compass angle (heading):'+heading.magneticHeading)}
	 * @param {Function} onError unused
	 * @param {Object} options Optional options e.g. {frequency:100} // 100ms watch frequency
	 *
	 * @returns {Number} Watch ID (use it to stop watching compass).
	 */
	this.watchHeading = function(onSuccess, onError, options) {
		this.start();

		// frequency support
		var frequency = 150;
		try {
			frequency = options.frequency;
		} catch(e) {}

		// watch at given frequency
		watchID = setInterval(function() {
			onSuccess({magneticHeading:currentAngle});
		}, frequency);

		return watchID;
	};

	/**
	 * Stop watching the compass referenced by the watch ID parameter.
	 *
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#compass.clearWatch
	 *
	 * @param {Number} watchID The ID returned by `compass.watchHeading`.
	 */
	this.clearWatch = function(watchID) {
		clearInterval(watchID);
	};

	/**
	 * Get the current compass heading in degrees.
	 *
	 * @see http://cordova.apache.org/docs/en/3.1.0/cordova_compass_compass.md.html#compass.getCurrentHeading
	 *
	 * @param {Function} onSuccess Function to call upon successful read.
	 *		Example: function(heading) {LOG.info('compass angle (heading):'+heading.magneticHeading)}
	 */
	this.getCurrentHeading = function(onSuccess) {
		onSuccess({magneticHeading:currentAngle});
	};
}
