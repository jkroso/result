
var ResultType = require('result-type')
  , Result = require('./index')
  , write = Result.prototype.write
  , error = Result.prototype.error
  , then = Result.prototype.then
  , read = Result.prototype.read
  , inherit = require('inherit')

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
DeferredResult.prototype.write = unawait(write)
DeferredResult.prototype.error = unawait(error)

function trigger(method){
	return function(onValue, onError){
		if (this.state === 'awaiting') {
			this.state = 'pending'
			try {
				var self = this 
				if (this.ƒ.length) {
					this.ƒ(
						function(val){ self.write(val) },
						function(err){ self.error(err) })
				} else {
					var val = this.ƒ()
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

function unawait(method){
	return function(value){	
		if (this.state === 'awaiting') this.state = 'pending'
		return method.call(this, value)
	}
}