/**
 * Hydro configuration
 *
 * @param {Hydro} hydro
 */

module.exports = function(hydro) {
  require('babel-core/register')({
    extensions: ['.js']
  })
  hydro.set({
    suite: 'result',
    plugins: [
      require('hydro-chai'),
      require('hydro-bdd')
    ],
    chai: {
      chai: require('chai'),
      plugins: [ require('chai-spies') ],
      styles: ['should'],
      stack: true
    }
  })
}
