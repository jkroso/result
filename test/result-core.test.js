
var Result = require('..')
var tryc = require('tryc')

var result
var spy
var failed
var value
var error
var test = 1

before(function(){
  result = new Result
  error = new Error('from test #' + test++)
  failed = new Result
  failed.state = 'fail'
  failed.value = error
  value = new Result
  value.state = 'done'
  value.value = 1
  spy = chai.spy()
})

describe('pending state', function(){
  it('should deliver its eventual value to readers', function(){
    result.read(function(val){
      val.should.equal(5)
      spy()
    }).write(5)
    spy.should.have.been.called(1)
  })

  it('should deliver its eventual rejection to readers', function(done){
    result.read(null, function(e){
      e.should.have.property('message', error.message)
      done()
    }).error(error)
  })

  describe('when readers are missing `onError`', function(){
    it('should throw async', function(done){
      tryc(function(){
        result.read(spy).error(error)
      }, function(e){
        e.message.should.match(/from test #\d+/)
        done()
      })
    })

    it('even if other readers have `onError` listeners', function(done){
      result.read(spy, spy).read(spy)
      tryc(function(){
        result.error(error)
      }, function(e){
        e.message.should.match(/from test #\d+/)
        done()
      })
    })
  })

  it('should call readers in the order they were added', function(){
    var calls = 0
    result.read(function(val){
      (calls++).should.equal(0)
      val.should.equal(5)
    }).read(function(val){
      (calls++).should.equal(1)
      val.should.equal(5)
    }).write(5)
    calls.should.equal(2)
  })

  it('should call readers added from within a reader immediatly', function(){
    result.read(function(){
      spy.should.not.have.been.called(1)
      result.read(function(){
        spy.should.not.have.been.called(1)
      })
    }).read(spy).write()
    spy.should.have.been.called(1)
  })

  it('should call functions in the correct context', function(done){
    result.read(function(){
      result.should.equal(this)
      var fail = new Result
      fail.read(null, function(){
        fail.should.equal(this)
        done()
      }).error(error)
    }).write(1)
  })

  it('should not be affected by errors in readers', function(done){
    tryc(function(){
      result.read(function(){
        spy.should.not.have.been.called()
        spy()
        throw error
      }).read(spy).write()
    }, function(e){
      spy.should.have.been.called(2)
      e.message.should.match(/from test #\d+/)
      done()
    })
  })

  it('should not throw if there aren\'t any readers', function(done){
    result.error(error)
    setTimeout(done, 0)
  })
})

describe('done state', function(){
  it('should deliver its cached value to readers', function(){
    value.read(spy)
    spy.should.have.been.called.with(1)
  })

  it('should call functions in the correct context', function(done){
    value.read(function(){
      value.should.equal(this)
      done()
    })
  })

  describe('when readers are missing onValue handlers', function(){
    it('should\'t have a problem', function(){
      value.read(null, spy)
      spy.should.not.have.been.called()
    })

    it('even when some readers do and some don\'t', function(){
      value
      .read(spy)
      .read(null, spy)
      spy.should.have.been.called(1)
    })
  })

  it('should not be affected by errors in readers', function(done){
    var sync = true
    tryc(function(){
      value.read(function(){ throw error })
    }, function(e){
      e.message.should.match(/from test #\d+/)
      if (sync) done(new Error('should not throw sync'))
      else done()
    })
    sync = false
  })
})

describe('fail state', function(){
  it('should deliver its cached reason to readers', function(){
    failed.read(null, spy)
    spy.should.have.been.called.with(error)
  })

  it('should call functions in the correct context', function(done){
    failed.read(null, function(){
      failed.should.equal(this)
      done()
    })
  })

  describe('when readers are missing onError handlers', function(){
    it('should throw async', function(done){
      var sync = true
      tryc(function(){
        failed.read(spy)
      }, function(e){
        e.message.should.match(/from test #\d+/)
        spy.should.not.have.been.called()
        sync.should.be.false
        done()
      })
      sync = false
    })

    it('should throw async when just one is missing an onError', function(done){
      tryc(function(done){
        failed.read(null, spy).read(spy)
      }, function(e){
        spy.should.have.been.called(1).with(error)
        e.message.should.match(/from test #\d+/)
        done()
      })
    })
  })

  it('should not be affected by errors in readers', function(done){
    var sync = true
    tryc(function(){
      failed.read(null, function(){ throw error })
    }, function(e){
      e.message.should.match(/from test #\d+/)
      sync.should.be.false
      done()
    })
    sync = false
  })
})
