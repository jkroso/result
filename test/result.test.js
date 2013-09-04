
var ResultType = require('result-type')
var unhandled = require('unhandled')
var inherit = require('inherit')
var chai = require('./chai')
var Result = require('..')
var coerce = Result.coerce
var read = Result.read

function inc(n){
	return n + 1
}

var spy
beforeEach(function(){
	spy = chai.spy()
})

describe('Result', function(){
	var result
	var failed
	var value
	var error
	var test = 1
	beforeEach(function(){
		result = new Result
		error = new Error(test++)
		failed = Result.failed(error)
		value = Result.wrap(1)
	})

	describe('.read()', function(){
		describe('context for functions', function(){
			it('when "done"', function(done){
				value.read(function(){
					value.should.equal(this)
					failed.read(null, function(){
						failed.should.equal(this)
						done()
					})
				})
			})

			it('when "pending"', function(done){
				result.read(function(){
					result.should.equal(this)
					var fail = new Result
					fail.read(null, function(){
						fail.should.equal(this)
						done()
					}).error(error)
				}).write(1)
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
					failed.then(null, function(){
						failed.should.equal(this)
						done()
					})
				})
			})

			it('when "pending"', function(done){
				result.then(function(){
					result.should.equal(this)
					var fail = new Result
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

	describe('.get()', function(){
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

function Dummy(value){
	this.read = function(onValue, onError){
		if (value instanceof Error) onError(value)
		else onValue(value)
	}
}

inherit(Dummy, ResultType)

describe('Result.read(value, onValue, onError)', function(){
	it('should call the onValue function with the value', function(){
		read(true, spy)
		spy.should.have.been.called.with(true)
	})

	it('should handle "done" Results', function(){
		read(new Result().write(1), spy)
		spy.should.have.been.called.with(1)
	})

	it('should handle "failed" results', function(){
		read(new Result().error(1), null, spy)
		spy.should.have.been.called.with(1)
	})

	it('should handle funny Result instances', function(){
		read(new Dummy(1), spy)
		spy.should.have.been.called.with(1)
		read(new Dummy(new Error(1)), null, spy)
		spy.should.have.been.called.with(new Error(1))
	})
})

describe('Result.coerce(value)', function(){
	it('should return a trusted Result', function(){
		coerce().should.be.an.instanceOf(Result)
	})

	it('should convert untrusted Results to trusted', function(){
		coerce(new Dummy).should.be.an.instanceOf(Result)
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