
var ResultType = require('result-type')
var inherit = require('inherit')
var Result = require('./index')

/**
 * Deferred class
 */

function Deferred(fn){
	this.onNeed = fn
}

inherit(Deferred, Result) // inherit from Result

Deferred.prototype.state = 'awaiting'
Deferred.prototype.then = trigger(Result.prototype.then)
Deferred.prototype.read = trigger(Result.prototype.read)
Deferred.prototype.write = unawait(Result.prototype.write)
Deferred.prototype.error = unawait(Result.prototype.error)

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
				var val = this.onNeed()
				if (val !== undefined) {
					if (val instanceof ResultType) {
						var self = this
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
 *   defer(function(cb){
 *     cb(null, 'hello')
 *   })
 *
 *   defer(function(write, error){
 *     write('hello')
 *   })
 *
 * @param {Function} onNeed(write, error)
 * @return {Deferred}
 */

function defer(onNeed){
	switch (onNeed.length) {
		case 2: return new Deferred(function(){
			var self = this
			onNeed.call(this,
				function(v){ self.write(v) },
				function(e){ self.error(e) })
		})
		case 1: return new Deferred(function(){
			var self = this
			onNeed.call(this, function(e, v){
				if (e != null) self.error(e)
				else self.write(v)
			})
		})
		default: return new Deferred(onNeed)
	}
}

module.exports = defer // expose defer
defer.prototype = Deferred.prototype // share prototypes
defer.Deferred = Deferred // expose class
