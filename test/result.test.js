
var chai = require('./chai')
  , Result = require('..')

function inc(n){
	return n + 1
}

function delay(value){
	var result = new Result
	setTimeout(function () {
		if (value instanceof Error) result.error(value)
		else result.write(value)
	}, Math.random() * 10)
	return result
}

describe('result', function(){
	var result
	var failed
	var value
	var spy
	var error
	var test = 1
	beforeEach(function(){
		result = new Result
		error = new Error(test++)
		failed = Result.failed(error)
		value = Result.wrap(1)
		spy = chai.spy()
	})

	describe('then()', function(){
		it('should return a new Result based of `this`', function(){
			value.then(inc).read(spy)
			spy.should.have.been.called.with(2)
		})

		describe('error handling', function(){
			it('should propagate failed results', function(){
				failed.then(inc).read(null, spy)
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
				failed.then(null, function(){
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
				failed.then(null, function(){
					return delay(error)
				}).then(null, spy).read(function(){
					spy.should.have.been.called.with(error)
					done()
				})
			})
		})
	})

	describe('unhandled errors', function(){
		var onError = Result.onError
		var onCatch = Result.onCatch
		beforeEach(function(){
			Result.onError = chai.spy()
			Result.onCatch = chai.spy()
		})
		describe('when a Result enters the "fail" state without any readers', function(){
			it('should call `Result.onError`', function(){
				result.error(error)
				Result.onError.should.have.been.called.with.exactly(result, error)
				Result.onCatch.should.not.have.been.called
			})
		})
		describe('when a Result in the "fail" state', function(){
			describe('is `read` with an `onError` handler', function(){
				it('call `Result.onCatch`', function(){
					failed.read(null, spy)
					spy.should.have.been.called
					Result.onError.should.not.have.been.called
					Result.onCatch.should.have.been.called.with.exactly(failed)
				})
			})
			describe('is `then` with an `onError` handler', function(){
				it('call `Result.onCatch`', function(){
					failed.read(null, spy)
					spy.should.have.been.called
					Result.onError.should.not.have.been.called
					Result.onCatch.should.have.been.called.with.exactly(failed)
				})
			})
		})
	})
})