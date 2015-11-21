/* global before */
import Result,{transfer,coerce,read,when,pending,defer,unbox,failed,wrap} from '..'
import ResultType from 'result-type'
import inherit from 'inherit'
import chai from 'chai'

const delay = value => {
  var result = pending()
  setTimeout(() => {
    if (value instanceof Error) result.error(value)
    else result.write(value)
  }, Math.random() * 10)
  return result
}

const inc = n => n + 1

var spy
var result
var failedResult
var value
var error
var test = 1

before(function(){
  result = pending()
  error = new Error('from test #' + test++)
  failedResult = failed(error)
  value = wrap(1)
  spy = chai.spy()
})

describe('.read()', function(){
  describe('returning failed results', function(){
    it('when "done"', function(done){
      value.read(function(){
        return failedResult
      }).read(function(){
        done()
      })
    })

    it('when "pending"', function(done){
      result.read(function(){
        return failedResult
      }).read(done).write()
    })
  })
})

describe('.then()', function(){
  it('should return a new Result based of `this`', function(){
    value.then(inc).read(spy)
    spy.should.have.been.called.with(2)
  })

  describe('context for functions', function(){
    it('when "done"', function(done){
      value.then(function(){
        value.should.equal(this)
        failedResult.then(null, function(){
          failedResult.should.equal(this)
          done()
        })
      })
    })

    it('when "pending"', function(done){
      result.then(function(){
        result.should.equal(this)
        var fail = pending()
        fail.then(null, function(){
          fail.should.equal(this)
          done()
        })
        fail.error(error)
      })
      result.write(1)
    })
  })

  describe('error handling', function(){
    it('should propagate failed results', function(){
      failedResult.then(inc).read(null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should catch sync errors', function(){
      value.then(function(){
        throw error
      }).read(null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should catch sync error handling errors', function(){
      var error = new Error('test ' + test)
      failedResult.then(null, function(){
        throw error
      }).read(null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should catch async errors', function(done){
      value.then(function(){
        return delay(error)
      }).then(null, spy).read(function(){
        spy.should.have.been.called.with(error)
        done()
      })
    })

    it('should catch async error handling errors', function(done){
      var error = new Error('test ' + test)
      failedResult.then(null, function(){
        return delay(error)
      }).then(null, spy).read(function(){
        spy.should.have.been.called.with(error)
        done()
      })
    })
  })
})

describe('.get()', function(){
  it('should return a Result for a property', function(done){
    wrap({a:done}).get('a').then(done => done())
  })
})

describe('.yield()', function(){
  it('should always result in a done promise', function(done){
    wrap().yield(1).then(function(n){
      n.should.equal(1)
      done()
    })
  })
})

describe('functions', function(){
  function Dummy(value){
    this.state = 'pending'
    if (value instanceof Error) Result.prototype.error.call(this, value)
    else if (value != null) Result.prototype.write.call(this, value)
    this.read = function(a, b){
      switch (this.state) {
        case 'done': a(this.value); break
        case 'fail': b(this.value); break
        default: Result.prototype.listen.call(this, a, b)
      }
    }
  }
  inherit(Dummy, ResultType)

  describe('when', function(){
    it('should return an unboxed value if possible', function(){
      when(value, inc).should.equal(2)
      when(1, inc).should.equal(2)
    })

    it('should return a new Result otherwise', function(done){
      when(delay(1), inc)
        .then(n => n.should.equal(2))
        .then(() => done(), done)
    })

    it('should propagate rejection', function(){
      when(failedResult, null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should catch errors on sync operations', function(){
      when(1, () => {throw new Error('fail')}).read(null, spy)
      spy.should.have.been.called(1)
    })

    it('should not require an onError function', function(done){
      when(failedResult, done).then(null, function(e){
        e.should.equal(error)
        done()
      })
    })

    it('should not require an onValue function when async', function(done){
      when(delay(1)).then(function(value){
        value.should.equal(1)
      }).then(() => done())
    })

    it('should not require an onValue function when sync', function(){
      when(1).should.equal(1)
    })
  })

  describe('unbox', function(){
    it('should return a plain value', function(){
      unbox(1).should.equal(1)
    })

    it('should unbox a "done" result', function(){
      unbox(wrap(1)).should.equal(1)
    })

    it('should throw a "fail" result', function(){
      (function(){
        unbox(failedResult)
      }).should.throw(error)
    })

    it('should throw on a "pending" result', function(){
      (function(){
        unbox(new Result)
      }).should.throw(/can't unbox a pending result/i)
    })
  })

  describe('read', function(){
    it('should call the onValue function with the value', function(){
      read(true, spy)
      spy.should.have.been.called.with(true)
    })

    it('should handle "done" Results', function(){
      read(value, spy)
      spy.should.have.been.called.with(1)
    })

    it('should handle "failed" results', function(){
      read(failedResult, null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should handle funny Result instances', function(){
      read(new Dummy(1), spy)
      spy.should.have.been.called.with.exactly(1)
      read(new Dummy(error), null, spy)
      spy.should.have.been.called.with(error)
    })
  })

  describe('coerce(value)', function(){
    it('should return a trusted Result', function(){
      coerce().should.be.an.instanceOf(Result)
    })

    it('should convert untrusted Results to trusted', function(){
      coerce(new Dummy(1)).should.be.an.instanceOf(Result)
    })

    it('should extract the value of the untrusted Result', function(){
      coerce(new Dummy(1)).read(spy)
      spy.should.have.been.called.with(1)
    })

    it('should extract the error an untrusted Result', function(){
      coerce(new Dummy(new Error(1))).read(null, spy)
      spy.should.have.been.called.with(new Error(1))
    })
  })

  describe('transfer', function(){
    it('should transfer eventual results', function(done){
      var b = pending()
      transfer(delay(1), b)
      b.read(function(val){
        val.should.equal(1)
        done()
      })
    })

    it('should transfer eventual errors', function(done){
      var b = pending()
      transfer(delay(error), b)
      b.read(null, function(e){
        error.should.equal(e)
        done()
      })
    })

    it('should transfer immediate values', function(done){
      var b = pending()
      transfer(1, b)
      b.read(function(val){
        val.should.equal(1)
        done()
      })
    })
  })
})

describe('defer', function(){
  var spy
  before(function(){
    spy = chai.spy()
  })

  describe('then()', function(){
    it('should execute `ƒ` if `this` is "awaiting"', function(){
      var result = defer(spy)
      spy.should.not.have.been.called(1)
      result.then()
      spy.should.have.been.called(1)
    })

    it('should return a normal Result', function(){
      defer(spy).then().should.be.instanceOf(Result)
    })

    it('should not ever execute `ƒ` twice', function(){
      var result = defer(spy)
      spy.should.not.have.been.called(1)
      result.then()
      result.then()
      spy.should.have.been.called(1)
    })

    it('should propagate values', function(done){
      defer((write, error) => write(1))
        .then(inc)
        .then(n => n.should.equal(2))
        .then(()=>done(), done)
    })

    describe('return values', function(){
      it('async', function(done){
        defer(()=> delay(1))
          .then(val => val.should.equal(1))
          .then(()=>done(), done)
      })

      it('sync', function(done){
        defer(()=> 1)
          .then(val=> val.should.equal(1))
          .then(()=>done(), done)
      })
    })
  })

  describe('read()', function(){
    it('should execute `ƒ` if `this` is "awaiting"', function(){
      var result = defer(spy)
      spy.should.not.have.been.called(1)
      result.read()
      spy.should.have.been.called(1)
    })
  })

  describe('write()', function(){
    it('should work even if the deferred has\'t been needed', function(done){
      var result = defer(spy)
      result.write(1)
      result.read(function(){
        spy.should.not.have.been.called
        done()
      })
    })
  })

  describe('error()', function(){
    it('should work even if the deferred has\'t been needed', function(done){
      var result = defer(spy)
      result.error(1)
      result.read(null, function(){
        spy.should.not.have.been.called
        done()
      })
    })
  })

  describe('error handling', function(){
    it('should catch sync errors', function(){
      var error = new Error('boom')
      defer(() =>{ throw error }).then(null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should catch async errors', function(done){
      var error = new Error('boom')
      defer(()=> delay(error))
        .then(null, e => {
          e.should.equal(error)
          done()
        })
    })
  })

  it('should support standard cb API\'s', function(done){
    var error = new Error('boom')
    defer(function(cb){
      cb(error)
    }).read(null, function(e){
      e.should.equal(error)
      defer(function(cb){
        cb(null, 1)
      }).read(function(n){
        n.should.equal(1)
        done()
      })
    })
  })
})
