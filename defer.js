
var Result = require('./index')
  , inherit = require('inherit')
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
DeferredResult.prototype.state = 'awaiting'
DeferredResult.prototype.then = trigger(then)
DeferredResult.prototype.read = trigger(read)

function trigger(method){
	return function(onValue, onError){
		if (this.state === 'awaiting') {
			this.state = 'pending'
			try {
				var self = this 
				this.ƒ(
					function(val){ self.write(val) },
					function(err){ self.error(err) })
			} catch (e) {
				this.error(e)
			}
		}
		return method.call(this, onValue, onError)
	}
}