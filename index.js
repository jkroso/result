
var ResultType = require('result-type')
var ResultCore = require('result-core')
var listen = ResultCore.addListener
var inherit = require('inherit')

/**
 * expose `Result`
 */

module.exports = exports = Result

/**
 * expose helpers
 */

exports.wrap = exports.done = wrap
exports.transfer = transfer
exports.coerce = coerce
exports.failed = failed
exports.when = when
exports.read = read

/**
 * the Result class
 */

function Result(){}

/**
 * inherit from ResultCore
 */

inherit(Result, ResultCore)

/**
 * Create a Result for a transformation of the value
 * of `this` Result
 *
 * @param  {Function} onValue
 * @param  {Function} onError
 * @return {Result}
 */

Result.prototype.then = function(onValue, onError) {
	switch (this.state) {
		case 'pending':
			var x = new Result
			listen(this, '_onValue', handle(x, onValue, 'write', this))
			listen(this, '_onError', handle(x, onError, 'error', this))
			return x
		case 'done':
			return typeof onValue == 'function'
				? run(onValue, this.value, this)
				: wrap(this.value)
		case 'fail':
			return typeof onError == 'function'
				? run(onError, this.value, this)
				: failed(this.value)
	}
}

/**
 * use the same `fn` for both `onValue` and `onError`
 *
 * @param  {Function} fn
 * @return {Result}
 */

Result.prototype.always = function(fn){
	return this.then(fn, fn)
}

/**
 * read using a node style function
 *
 *   result.node(function(err, value){})
 *
 * @param  {Function} callback(error, value)
 * @return {this}
 */

Result.prototype.node = function(fn){
	return this.read(function(v){ fn(null, v) }, fn)
}

/**
 * Create a child Result destined to fulfill with `value`
 *
 *   return result.then(function(value){
 *     // some side effect
 *   }).yeild(e)
 *
 * @param  {x} value
 * @return {Result}
 */

Result.prototype.yeild = function(value){
	return this.then(function(){ return value })
}

/**
 * return a Result for `this[attr]`
 *
 * @param {String} attr
 * @return {Result}
 */

Result.prototype.get = function(attr){
	return this.then(function(obj){
		return obj[attr]
	})
}

/**
 * run `value` through `handler` and ensure the result
 * is wrapped in a trusted Result
 *
 * @param {Function} handler
 * @param {x} value
 * @param {Any} ctx
 * @api private
 */

function run(handler, value, ctx){
	try { return coerce(handler.call(ctx, value)) }
	catch (e) { return failed(e) }
}

/**
 * wrap `reason` in a "failed" result
 *
 * @param {x} reason
 * @return {Result}
 * @api public
 */

function failed(reason){
	var res = new Result
	res.value = reason
	res.state = 'fail'
	return res
}

/**
 * wrap `value` in a "done" Result
 *
 * @param {x} value
 * @return {Result}
 * @api public
 */

function wrap(value){
	var res = new Result
	res.value = value
	res.state = 'done'
	return res
}

/**
 * coerce `value` to a Result
 *
 * @param {x} value
 * @return {Result}
 * @api public
 */

function coerce(value){
	if (value instanceof ResultType) {
		if (value instanceof Result) return value
		var result = new Result
		value.read(
			function(v){ result.write(v) },
			function(e){ result.error(e) })
		return result
	}
	return wrap(value)
}

/**
 * create a function which will propagate a value/error
 * onto `result` when called. If `fn` is present it
 * will transform the value/error before assigning the
 * result to `result`
 *
 * @param {Function} result
 * @param {Function} fn
 * @param {String} method
 * @param {Any} [ctx]
 * @return {Function}
 * @api private
 */

function handle(result, fn, method, ctx){
	return typeof fn != 'function'
		? function(x){ return result[method](x) }
		: function(x){
			try { x = fn.call(ctx, x) }
			catch (e) { return result.error(e) }

			if (x instanceof ResultType) {
				x.read(
					function(v){ result.write(v) },
					function(e){ result.error(e) })
			} else {
				result.write(x)
			}
		}
}

/**
 * run `value` through `onValue`. If `value` is a
 * "failed" promise it will be passed to `onError`
 * instead. Any errors will result in a "failed"
 * promise being returned rather than an error
 * thrown so you don't have to use a try catch
 *
 * @param {Any} result
 * @param {Function} onValue
 * @param {Function} onError
 * @return {Any}
 */

function when(value, onValue, onError){
	if (value instanceof ResultType) switch (value.state) {
		case 'fail': onValue = onError;
		case 'done': value = value.value; break
		default:
			var x = new Result
			value.read(
				handle(x, onValue, 'write', this),
				handle(x, onError, 'error', this))
			// unbox if possible
			return x.state == 'done'
				? x.value
				: x
	}
	try { return onValue(value) }
	catch (e) { return failed(e) }
}

/**
 * read `value` even if its within a promise
 *
 * @param {x} value
 * @param {Function} onValue
 * @param {Function} onError
 */

function read(value, onValue, onError){
	if (value instanceof ResultType) value.read(onValue, onError)
	else onValue(value)
}

/**
 * transfer the value of `a` to `b`
 *
 * @param {Any} a
 * @param {Result} b
 */

function transfer(a, b){
	read(a,
		function(val){ b.write(val) },
		function(err){ b.error(err) })
}
