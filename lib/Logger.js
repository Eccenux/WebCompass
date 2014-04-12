/**
 * Simple logger class.
 * 
 * Assuming Firebug style console object is avaiable: http://getfirebug.com/logging
 * BUT it abstracts you from `console` avilabilty and implementation
 * as it will simply not run if the functions are not available.
 * 
 * How it works:
 * ```
 * var LOG = new Logger('function or class name or any other tag');
 * LOG.info('some debug/notice information');
 * LOG.warn('some warning (usually non-critical) information');
 * LOG.error('some error (usually critical) information');
 * ```
 *
 * Note that you can pass any number of arguments and they will be stringified whenever possible.
 * ```
 * data = {"test":123,abc:"def"}
 * LOG.info('the json data:', data);
 * ```
 *
 * Output:
 * ```
 * [tag] the json data:{
 *	"test":123,"abc":"def"
 * }
 * ```
 * 
 * Author: Maciej Jaros
 * Web: http://enux.pl/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *   GPL v3 http://opensource.org/licenses/GPL-3.0
 *
 * @param {String} tag Tag to be put in console (e.g. class name).
 * @class Logger
 */
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
		// polly for iPhone...
		: function () {
			return (new Date()).getTime();
		};
		this.performancePrevious = this.performanceNow();
	}
}

/**
 * Check if logging is enabled for certain level.
 *
 * @param {String} level info|warn|error
 * @returns {Boolean} true if enabled
 */
Logger.prototype.isEnabled = function (level) {
	/*
	if (this._tag.search(/(ControllerIgnorance|mJ\.setup|mJ\.controller)$/)!=0) {
		return false;
	}
	*/
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

/**
 * Attempts to create a readable string from about anything.
 *
 * @private
 *
 * @param {mixed} variable Whatever to parse.
 * @returns {String}
 */
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
				.replace(/","/g, '",\n"')			// this should also work when a value is JSON.stringfied
				.replace(/\{"/g, '{\n"')
				.replace(/"\}(?=[,}]|$)/g, '"\n}')	// this should also work when a value is JSON.stringfied
		;
	}
	return text;
};

/**
 * Render arguments for display in console.
 *
 * @private
 *
 * @param {Array} argumentsArray
 *		This is either arguments array or a real Array object
 *		(see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/arguments).
 * @returns {String}
 */
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

/**
 * Performance info and checkpoint set.
 *
 * @param {String} comment Any comment e.g. tick info/ID.
 */
Logger.prototype.performance = function (comment) {
	if (this.performanceEnabled && this.isEnabled('info')) {
		var now = this.performanceNow();
		this.info(comment, '; diff [ms]: ', now - this.performancePrevious);
		this.performancePrevious = now;
	}
};

/**
 * Informational text, notice.
 *
 * @note All arugments are converted to text and passed to console.
 */
Logger.prototype.info = function () {
	if (this.isEnabled('info')) {
		console.log(this._renderArguments(arguments));
	}
};

/**
 * Warning text.
 *
 * @note All arugments are converted to text and passed to console.
 */
Logger.prototype.warn = function () {
	if (this.isEnabled('warn')) {
		console.warn(this._renderArguments(arguments));
	}
};

/**
 * Error text.
 *
 * @note All arugments are converted to text and passed to console.
 */
Logger.prototype.error = function () {
	if (this.isEnabled('error')) {
		console.error(this._renderArguments(arguments));
	}
};