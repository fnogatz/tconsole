module.exports = toString

var Table = require('cli-table')
var insert = require('./insert')

function toString (input, fields) {
  var objects = this

  var type
  for (type in objects) {
    if (objects[type].test && objects[type].test.call(input)) {
      fields = fields || objects[type].defaultFields || Object.keys(objects[type].fields)
      if (fields === '*') {
        fields = Object.keys(objects[type].fields)
      }

      return fromObject(objects, input, type, fields)
    }
  }

  var satisfiesAll
  var tester
  if (input instanceof Array) {
    satisfiesAll = false

    for (type in objects) {
      tester = objects[type].test
      if (!tester && /^array:/.test(type) && objects[type.replace(/^array:/, '')]) {
        tester = objects[type.replace(/^array:/, '')].test
      }

      satisfiesAll = input.every(function (row) {
        return tester.call(row)
      })

      if (satisfiesAll) {
        if (!fields && objects['array:' + type]) {
          fields = objects['array:' + type].defaultFields || Object.keys(objects['array:' + type].fields)
        }
        if (!fields) {
          fields = objects[type].defaultFields || Object.keys(objects[type].fields)
        }

        return fromObject(objects, input, type, fields, true)
      }
    }
  }

  if (typeof input === 'object') {
    satisfiesAll = false

    var keys = Object.keys(input).filter(function (key) {
      return key[0] !== '_'
    })

    for (type in objects) {
      tester = objects[type].test
      if (!tester) {
        if (/^array:/.test(type) && objects[type.replace(/^array:/, '')]) {
          tester = objects[type.replace(/^array:/, '')].test
        } else {
          throw new Error('No tester for type ' + type)
        }
      }

      satisfiesAll = keys.every(function (key) {
        return tester.call(input[key])
      })

      if (satisfiesAll) {
        if (!fields && objects['array:' + type]) {
          fields = objects['array:' + type].defaultFields || Object.keys(objects['array:' + type].fields)
        }
        if (!fields) {
          fields = objects[type].defaultFields || Object.keys(objects[type].fields)
        }

        var arr = keys.map(function (key) {
          return input[key]
        })

        return fromObject(objects, arr, type, fields)
      }
    }
  }

  return false
}

function fromObject (objects, input, type, fields) {
  var fieldNames = fields.map(function (field) {
    if (typeof field === 'string') {
      return field
    }
    if (typeof field === 'object' && field.hasOwnProperty('name')) {
      return field.name
    }
    return ''
  })

  var table
  if (input instanceof Array || objects[type].headers) {
    var colAligns = []
    fields.forEach(function (field, ix) {
      if (typeof field === 'object' && field.align) {
        colAligns[ix] = field.align
      }
    })

    var headers = objects[type].header ? objects[type].header(fieldNames, input) : fieldNames

    table = new Table({
      head: headers,
      colAligns: colAligns
    })
  } else {
    // Vertical table
    table = new Table()
  }

  var retInsert
  if (objects[type].insert) {
    retInsert = objects[type].insert.call(input, table, objects[type], fieldNames)
  } else {
    if (!objects[type].fields && /^array:/.test(type)) {
      retInsert = insert.call(input, table, objects[type.replace(/^array:/, '')], fieldNames)
    } else {
      retInsert = insert.call(input, table, objects[type], fieldNames)
    }
  }
  if (retInsert === false) {
    return false
  }

  return table.toString()
}
