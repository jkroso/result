
var ResultType = require('result-type')
var unhandled = require('unhandled')
var nextTick = require('next-tick')
var inherit = require('inherit')

/**
 * the Result class
 */

function Result () {
	this.i = 0
}

/**
 * inherit from ResultType
 */

inherit(Result, ResultType)

/**
 * default state
 * @type {String}
 */

Result.prototype.state = 'pending'

/**
 * Read the value of `this`
 *
 * @param  {Function} onValue
 * @param  {Function} onError
 * @return {this}
 */

Result.prototype.read = function(onValue, onError){
	switch (this.state) {
		case 'pending':
			this[this.i++] = {
				// Handlers are bound to the assignment properties
				// since they aren't run inside a try catch.
				write: onValue || noop,
				error: onError || thrower
			}
			break
		case 'done':
			onValue && onValue(this.value)
			break
		case 'fail':
			unhandled.remove(this.value)
			if (onError) onError(this.value)
			else thrower(this.value)
	}
	return this
}

function thrower(e){
	nextTick(function(){ throw e })
}
function noop(){}

/**
 * Give the Result it's value
 *
 * @param  {x} [value]
 * @return {this}
 */

Result.prototype.write = function(value){
	if (this.state === 'pending') {
		this.state = 'done'
		this.value = value
		var child
		var i = 0
		while (child = this[i++]) {
			if (!child._onValue) child.write(value)
			else propagate(child, child._onValue, value)
		}
	}
	return this
}

/**
 * put the Result into a failed state
 *
 * @param  {x} reason
 * @return {this}
 */

Result.prototype.error = function(reason){
	if (this.state === 'pending') {
		this.state = 'fail'
		this.value = reason
		var child = this[0]
		var i = 1
		if (child) do {
			if (!child._onError) child.error(reason)
			else propagate(child, child._onError, reason)
		} while (child = this[i++])
		else unhandled(reason)
	}
	return this
}

/**
 * Handle the processing of `child`
 *
 * @param {Result} child
 * @param {Function} fn
 * @param {x} value
 * @api private
 */

function propagate(child, fn, value){
	try { value = fn(value) }
	catch (e) { return child.error(e) }

	// auto lift one level
	if (value instanceof ResultType) {
		return value.read(
			function(val){ child.write(val) },
			function(err){ child.error(err) }
		)
	}

	child.write(value)
}

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
			var result = this[this.i++] = new Result
			result._onValue = onValue
			result._onError = onError
			return result
		case 'done':
			if (onValue) return run(onValue, this.value)
			return wrap(this.value)
		case 'fail':
			if (!onError) return failed(this.value)
			unhandled.remove(this.value)
			return run(onError, this.value)
	}
}

/**
 * run `value` through `handler` and ensure the result
 * is wrapped in a trusted Result
 *
 * @param {Function} handler
 * @param {x} value
 * @api private
 */

function run(handler, value){
	try { var result = handler(value) }
	catch (e) { return failed(e) }

	if (result instanceof ResultType) {
		if (result instanceof Result) return result
		return extract(result)
	}
	return wrap(result)
}

/**
 * Convert to a trusted Result
 *
 * @param {~Result} result
 * @return {Result}
 * @api private
 */

function extract(result){
	var trusted = new Result
	result.read(function(value){
		trusted.write(value)
	}, function(reason){
		trusted.error(reason)
	})
	return trusted
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
 *     // something side effect
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
 * read the value of `value` even if its
 * within a Result
 *
 * @param {x} value
 * @param {Function} onValue
 * @param {Function} onError
 */

Result.read = function(value, onValue, onError){
	if (value instanceof ResultType) value.read(onValue, onError)
	else onValue(value)
}

/**
 * coerce `value` to a Result
 *
 * @param {x} value
 * @return {Result}
 */

Result.coerce = function(value){
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

Result.wrap = Result.done = wrap
Result.failed = failed

module.exports = Result