
var defer = require('../lazy')
  , chai = require('./chai')
  , Result = require('..')

function inc(n){
	return n + 1
}

describe('lazy', function(){
	var spy
	beforeEach(function(){
		spy = chai.spy()
	})

	describe('then()', function(){
		it('should execute `ƒ` if `this` is pending', function(){
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
			defer(function(write){
				write(1)
			}).then(inc).then(function(n){
				n.should.equal(2)
			}).node(done)
		})
	})

	describe('read()', function(){
		it('should execute `ƒ` if `this` is pending', function(){
			var result = defer(spy)
			spy.should.not.have.been.called(1)
			result.read()
			spy.should.have.been.called(1)
		})
	})

	describe('error handling', function(){
		it('should catch sync errors', function(){
			var error = new Error(this.test.title)
			defer(function(){
				throw error
			}).then(null, spy)
			spy.should.have.been.called.with(error)
		})
	})
})