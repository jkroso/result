
# result

  Reify your function's result. In JavaScript (JS) function calls result in the creation of a stack frame behind the scenes. This contains the state of the function as its code is being processed. On completion the stack frame is popped of the stack and a value is effectively substituted into the place where the function was originally called. You can say the result travels back up the stack which usually maps to traveling backwards through your source code. However functions aren't always given correct input and therefore can't always return correct values. To handle this we `throw` values instead of `return`ing them (usually that "value" is an `Error` instance). The JS engine handles `throw` in a similar way to `return`, that is, it walks the value back up the stack. However, while its walking back up its not looking for normal code its looking for code you have explicitly declared to be for the purpose of handling errors. In JS that means a kind of goofy `try catch` arrangement. When it finds this special error handling code it substitutes in the "value" as it would if we were `return`ing and then carries on as per usual. If it never manages to find any error handling code it logs the "value" to the console and kills the process. So we can say that whenever we code in JS we are coding for two paths, the success path and the error path. The JS engine passes values up and down these paths implicitly. That is we don't explicitly tell the engine where we want values to go, other than the `return`/`throw` path. The path values take is implied by the positioning of functions. Put one function to the right of another and their results will combine. Its a simple and kind of limited system but it makes a lot of sense give the interface we use to create programs is textual. 

  A big problem arises when your programs input comes from outside of memory though. If your loading data from the hard-drive or across the Internet the CPU is going to end up spending so much time waiting around for something to work on that its ridiculous the expect to to just sit there and wait. We can't speed this data up but we might be able write our programs in such a way that the CPU can do other tasks while its waits for data required by another. Now we are talking about asynchronous or concurrent programming. We can't express this type of program to a JS engine simply by sticking two functions next to each other like we would normally though. It won't know that its meant to wait and think your asynchronous function simply `return`ed `undefined` or something. Though if we reify the concept of a functions result we can create our own dependency tree and recreate the value passing system normally provided implicitly by the JS engine in such a way that its tolerant of undefined time gaps between operations. The "result-core" module focuses purely on reifying the concept of a functions result while this module also tries to provide a mechanism for constructing dependency trees out of them with a method call "then". It also ended up reimplementing "result-core" which I don't like but it allowed for significant performance gains.

  I just realized this takes a bit more explaining than I originally thought. I've probably not done a very good job of it either so please let me know where you get lost if you do so I can fix my explanation. I promise its worth learning. Oh and speaking of promises if this sounds a lot like a promise implementation thats because it is :). haha same concept but hopefully less nonsense.

## TODO:

  create a completely unoptimized version for learners to read.

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
