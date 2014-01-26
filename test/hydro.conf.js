
var Result = require('..')

/**
 * Hydro configuration
 *
 * @param {Hydro} hydro
 */

module.exports = function(hydro) {
  hydro.set({
    suite: 'result',
    formatter: require('hydro-dot'),
    plugins: [
      require('hydro-chai'),
      require('hydro-bdd')
    ],
    chai: {
      chai: require('chai'),
      plugins: [ require('chai-spies') ],
      styles: ['should'],
      stack: true
    },
    globals: {
      chai: require('chai'),
      delay: delay
    }
  })
}

function delay(value){
  var result = new Result
  setTimeout(function () {
    if (value instanceof Error) result.error(value)
    else result.write(value)
  }, Math.random() * 10)
  return result
}
