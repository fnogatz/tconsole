module.exports = createConsole
module.exports.load = load
module.exports.combine = combine
module.exports.insert = require('./insert')

var requireAll = require('require-all')
var toString = require('./toString')

function createConsole (objects) {
  var oldLog = console.log

  var konsole = function printObject (input, fields) {
    var str = toString.call(objects, input, fields)
    if (str) {
      oldLog(str)
    } else if (str !== false) {
      oldLog(input)
    }
  }

  // populate methods from console
  for (var key in console) {
    konsole[key] = console[key]
  }

  // replace .log()
  konsole.log = function log () {
    var args = []
    var str
    for (var i = 0; i < arguments.length; i++) {
      str = toString.call(objects, arguments[i])
      if (str) {
        oldLog(str)
      } else if (str !== false) {
        args.push(arguments[i])
      }
    }
    oldLog.apply(this, args)
  }

  // add .toString()
  konsole.toString = function objectToString (input, fields) {
    return toString.call(objects, input, fields)
  }

  // save config
  konsole._tconsoleConfig = objects

  return konsole
}

/**
 * Create a console by requiring all renderers in a given
 *   location.
 * @param  {String} location Filesystem path to use with require-all
 * @return {tconsole}
 */
function load (location) {
  var required = requireAll(location)
  var config = {}
  for (var key in required) {
    config[key.replace(/^array\./, 'array:')] = required[key]
  }
  var konsole = createConsole(config)
  return konsole
}

/**
 * Combine multiple tconsole instances.
 * @return {tconsole}
 */
function combine () {
  var config = {}
  Array.prototype.forEach.call(arguments, function (tconsoleInstance) {
    mergeObject(config, tconsoleInstance._tconsoleConfig)
  })
  return createConsole(config)
}

/**
 * Merge properties of obj2 into obj1.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 */
function mergeObject (obj1, obj2) {
  for (var attrname in obj2) { obj1[attrname] = obj2[attrname] }
}
