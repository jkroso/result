
var Result = require('./index')
  , inherit = require('inherit')
  , write = Result.prototype.write
  , error = Result.prototype.error
  , then = Result.prototype.then
  , read = Result.prototype.read

/**
 * create a DeferredResult which is associated with 
 * procedure `ƒ`. `ƒ` will only be evaluated once 
 * someone actually reads from the DeferredResult.
 * 
 * @param {Function} ƒ (write, error)
 * @return {DeferredResult}
 */

module.exports = function(ƒ){
	var deferred = new DeferredResult
	deferred.ƒ = ƒ
	return deferred
}

inherit(DeferredResult, Result)

function DeferredResult(){}

DeferredResult.prototype.i = 0
DeferredResult.prototype.then = await(then)
DeferredResult.prototype.read = await(read)
DeferredResult.prototype.write = unAwait(write)
DeferredResult.prototype.error = unAwait(error)

function await(method){
	return function(onValue, onError){
		var ret = method.call(this, onValue, onError)
		if (this.state === 'pending') {
			this.state = 'awaiting'
			try {
				var self = this 
				this.ƒ(
					function(val){ self.write(val) },
					function(err){ self.error(err) })
			} catch (e) {
				this.error(e)
			}
		}
		return ret
	}
}

function unAwait(method){
	return function(value){
		if (this.state === 'awaiting') this.state = 'pending'
		return method.call(this, value)
	}
}