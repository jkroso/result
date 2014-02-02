
var ResultType = require('result-type')
var inherit = require('inherit')
var Result = require('./index')
var transfer = Result.transfer

/**
 * Deferred class
 */

function Deferred(fn){
  this.onNeed = fn
}

/**
 * inherit from Result
 */

inherit(Deferred, Result)

Deferred.prototype.called = false
Deferred.prototype.then = trigger(Result.prototype.then)
Deferred.prototype.read = trigger(Result.prototype.read)

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
    if (this.state == 'pending' && !this.called) {
      this.called = true
      try {
        transfer(this.onNeed(), this)
      } catch (e) {
        this.error(e)
      }
    }
    return method.call(this, onValue, onError)
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
      var res = new Result
      onNeed.call(this,
        function(v){ res.write(v) },
        function(e){ res.error(e) })
      return res
    })
    case 1: return new Deferred(function(){
      var res = new Result
      onNeed.call(this, function(e, v){
        if (e != null) res.error(e)
        else res.write(v)
      })
      return res
    })
    default: return new Deferred(onNeed)
  }
}

module.exports = defer // expose defer
defer.prototype = Deferred.prototype // share prototypes
defer.Deferred = Deferred // expose class
