
var ResultType = require('result-type')
var inherit = require('inherit')
var chai = require('./chai')
var Result = require('..')
var transfer = Result.transfer
var coerce = Result.coerce
var read = Result.read
var when = Result.when

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
		error = new Error('from test #' + test++)
		failed = Result.failed(error)
		value = Result.wrap(1)
	})

	describe('.read()', function(){
		describe('returning failed results', function(){
			it('when "done"', function(done){
				value.read(function(){
					return failed
				}).read(function(){
					done()
				})
			})

			it('when "pending"', function(done){
				result.read(function(){
					return failed
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

	describe('when(result, onValue, onError)', function(){
		it('should create a new Result', function(){
			when(value, function(v){
				return v + 1
			}).read(spy)
			spy.should.have.been.called.with(2)
		})

		it('should propagate rejection', function(){
			when(result, null, spy)
			result.error(error)
			spy.should.have.been.called.with(error)
		})

		it('should return a plain value if it can', function(){
			when(1, function(value){
				value.should.equal(1)
				return value + 1
			}).should.equal(2)
		})

		it('should catch errors on sync operations', function(){
			when(1, function(){
				throw new Error('fail')
			}).read(null, spy)
			spy.should.have.been.called(1)
		})

		it('should forward `this` to the handlers', function(done){
			when.call(done, delay(1), function(one){
				one.should.equal(1)
				this.should.equal(done)
			}).node(done)
		})
	})

	function Dummy(value){
		this.read = function(onValue, onError){
			if (value instanceof Error) onError(value)
			else onValue(value)
		}
	}
	inherit(Dummy, ResultType)

	describe('read(value, onValue, onError)', function(){
		it('should call the onValue function with the value', function(){
			read(true, spy)
			spy.should.have.been.called.with(true)
		})

		it('should handle "done" Results', function(){
			read(value, spy)
			spy.should.have.been.called.with(1)
		})

		it('should handle "failed" results', function(){
			read(failed, null, spy)
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

	describe('transfer(a, b)', function(){
		it('should transfer eventual results', function(done){
			var b = new Result
			transfer(delay(1), b)
			b.read(function(val){
				val.should.equal(1)
				done()
			})
		})

		it('should transfer eventual errors', function(done){
			var b = new Result
			transfer(delay(error), b)
			b.read(null, function(e){
				error.should.equal(e)
				done()
			})
		})

		it('should transfer immediate values', function(done){
			var b = new Result
			transfer(1, b)
			b.read(function(val){
				val.should.equal(1)
				done()
			})
		})
	})
})