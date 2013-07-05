
var unhandled = require('unhandled')
  , chai = require('./chai')
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

	describe('get()', function(){
		it('should return a Result for a property', function(done){
			Result.wrap({a:done}).get('a').then(function(done){
				done()
			})
		})
	})

	describe('unhandled errors', function(){
		afterEach(function(){
			unhandled.remove(error)
		})
		it('should register when failing a promise without pending readers', function(){
			result.error(error)
			unhandled().should.eql([error])
		})

		it('should unregister when reading from a failed result', function(){
			result.error(error)
			result.read(null, function(e){
				e.should.equal(error)
			})
			unhandled().should.eql([])
		})

		it('should unregister when `then`ing from a failed result', function(){
			result.error(error)
			result.then(null, function(e){
				e.should.equal(error)
			})
			unhandled().should.eql([])
		})
	})
})