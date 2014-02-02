
var defer = require('../defer')
var Result = require('..')

function inc(n){ return n + 1 }

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
      defer(spy).then().constructor.should.equal(Result)
    })

    it('should not ever execute `ƒ` twice', function(){
      var result = defer(spy)
      spy.should.not.have.been.called(1)
      result.then().should.not.equal(result.then())
      spy.should.have.been.called(1)
    })

    it('should propagate values', function(done){
      defer(function(write, error){
        write(1)
      }).then(inc).then(function(n){
        n.should.equal(2)
      }).node(done)
    })

    describe('return values', function(){
      it('async', function(done){
        defer(function(){
          return delay(1)
        }).then(function(val){
          val.should.equal(1)
        }).node(done)
      })

      it('sync', function(done){
        defer(function(){
          return 1
        }).then(function(val){
          val.should.equal(1)
        }).node(done)
      })

      it('should not write `undefined`', function(){
        var result = defer(function(){})
        result.then(spy)
        spy.should.not.be.called()
        result.write(1)
        spy.should.have.been.called.exactly(1)
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
      defer(function(){
        throw error
      }).then(null, spy)
      spy.should.have.been.called.with(error)
    })

    it('should catch async errors', function(done){
      var error = new Error('boom')
      defer(function(){
        return delay(error)
      }).then(null, function(e){
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
