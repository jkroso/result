
var ResultType = require('result-type')
var inherit = require('inherit')
var Result = require('./index')
var write = Result.prototype.write
var error = Result.prototype.error
var then = Result.prototype.then
var read = Result.prototype.read

/**
 * the Deferred class
 */

function Deferred(fn){
	this.onNeed = fn
}

/**
 * inherit from Result
 */

inherit(Deferred, Result)

Deferred.prototype.state = 'awaiting'
Deferred.prototype.then = trigger(then)
Deferred.prototype.read = trigger(read)
Deferred.prototype.write = unawait(write)
Deferred.prototype.error = unawait(error)

/**
 * add a trigger aspect to `method`. This aspect
 * ensures `onNeed` is called on first read().
 *
 * @param {Function} method
 * @return {Function}
 * @api private
 */

function trigger(method){
	return function(onValue, onError){
		if (this.state === 'awaiting') {
			this.state = 'pending'
			try {
				var self = this
				var val
				if (this.onNeed.length) {
					this.onNeed(
						function(val){ self.write(val) },
						function(err){ self.error(err) })
				} else if ((val = this.onNeed()) !== undefined) {
					if (val instanceof ResultType) {
						val.read(
							function(val){ self.write(val) },
							function(err){ self.error(err) })
					} else {
						this.write(val)
					}
				}
			} catch (e) {
				this.error(e)
			}
		}
		return method.call(this, onValue, onError)
	}
}

/**
 * add a state switching aspect to `method`.
 * Otherwise write/error would behave incorrectly
 *
 * @param {Function} method
 * @return {Function}
 * @api private
 */

function unawait(method){
	return function(value){
		if (this.state === 'awaiting') this.state = 'pending'
		return method.call(this, value)
	}
}

/**
 * create a Deferred which is associated with the
 * Function `onNeed`. `onNeed` will only be called
 * once someone actually reads from the Deferred.
 *
 *   defer(function(){
 *     this.write('hello')
 *   })
 *
 *   defer(function(write){
 *     write('hello')
 *   })
 *
 * @param {Function} onNeed(write, error)
 * @return {Deferred}
 */

module.exports = exports = function(onNeed){
	return new Deferred(onNeed)
}

/**
 * share prototypes
 */

exports.prototype = Deferred.prototype

/**
 * expose Deferred
 */

exports.Deferred = Deferred