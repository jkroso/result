
# result

  reify your results

## Installation

_With [component](//github.com/component/component), [packin](//github.com/jkroso/packin) or [npm](//github.com/isaacs/npm)_  

	$ {package mananger} install jkroso/result

then in your app:

```js
var Result = require('result')
var defer = require('result/lazy')
```

## API

 - [result()](#result)
 - [Result.read()](#resultreadonvaluefunctiononerrorfunction)
 - [Result.write()](#resultwritevaluex)
 - [Result.error()](#resulterrorreasonx)
 - [Result.then()](#resultthenonvaluefunctiononerrorfunction)
 - [Result.always()](#resultalwaysfnfunction)
 - [Result.node()](#resultnodecallbackerrorfunction)
 - [Result.yeild()](#resultyeildvaluex)
 - [failed()](#failed)
 - [wrap()](#wrap)
 - [defer()](#deferfunction)

### result()

  the Result class

### Result.read(onValue:Function, onError:Function)

  Read the value of `this`

### Result.write([value]:x)

  Give the Result it's value

### Result.error(reason:x)

  put the Result into a failed state

### Result.then(onValue:Function, onError:Function)

  Create a Result for a transformation of the value
  of `this` Result


### Result.always(fn:Function)

  use the same `fn` for both `onValue` and `onError`

### Result.node(callback(error,:Function)

  read using a node style function

```js
result.node(function(err, value){})
```

### Result.yeild(value:x)

  Create a child Result destined to fulfill with `value`

```js
return result.then(function(value){
  // something side effect
}).yeild(e)
```

### failed()

  wrap `reason` in a "failed" result

### wrap()

  wrap `value` in a "done" Result

### defer(ƒ:Function)

  create a DeferredResult which is associated with procedure `ƒ`.
  `ƒ` will only be evaluated once someone actually reads from the
  DeferredResult. `then` returns a normal Result so from there on
  out you revert to eager evaluation. For a fully fledged lazy 
  evaluation strategy [see](//github.com/jkroso/lazy-result).

```js
var results = ['google.com', 'bing.com'].map(function(engine){
  return defer(function(write, error){
    return request(engine+'?q=hello')
      .on('response', write)
      .on('error', error)
  })
})
detect(results, function(result){
  return result.ok
}).then(display)
```

## Running the tests

Just run `make`. It will install and start a development server so all you then need to do is point your browser to `localhost:3000/test`. Likewise to run the examples.
