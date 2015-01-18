module.exports = createConsole;
module.exports.getCellContent = getCellContent;
module.exports.insert = insert;
module.exports.load = load;


var Table = require('cli-table');
var requireAll = require('require-all');


function createConsole(objects) {
  var oldLog = console.log;

  var konsole = function printObject(input, fields) {
    var str = toString(objects, input, fields);
    if (str) {
      oldLog(str);
    }
    else {
      oldLog(input);
    }
  };

  // populate methods from console
  for (var key in console) {
    konsole[key] = console[key];
  }

  // replace .log()
  konsole.log = function log() {
    var args = [];
    var str;
    for (var i = 0; i < arguments.length; i++) {
      str = toString(objects, arguments[i]);
      if (str) {
        oldLog(str);
      }
      else {
        args.push(arguments[i]);
      }
    }
    oldLog.apply(this, args);
  };

  // add .toString()
  konsole.toString = function objectToString(input, fields) {
    return toString(objects, input, fields);
  };

  // save config
  konsole._tconsoleConfig = objects;

  return konsole;
}


function toString(objects, input, fields) {
  for (var type in objects) {
    if (objects[type].test && objects[type].test.call(input)) {
      fields = fields || objects[type].defaultFields || Object.keys(objects[type].fields);

      return fromObject(objects, input, type, fields);
    }
  }

  if (input instanceof Array) {
    var satisfiesAll = false;
    var tester;

    for (var type in objects) {
      tester = objects[type].test;
      if (!tester && /^array:/.test(type) && objects[type.replace(/^array:/, '')]) {
        tester = objects[type.replace(/^array:/, '')].test;
      }

      satisfiesAll = input.every(function(row) {
        return tester.call(row);
      });

      if (satisfiesAll) {
        if (!fields && objects['array:'+type])
          fields = objects['array:'+type].defaultFields || Object.keys(objects['array:'+type].fields);
        if (!fields)
          fields = objects[type].defaultFields || Object.keys(objects[type].fields);

        return fromObject(objects, input, type, fields, true);
      }
    }
  }

  if (typeof input === 'object') {
    var satisfiesAll = false;
    var tester;

    var keys = Object.keys(input).filter(function(key) {
      return key[0] !== '_';
    });

    for (var type in objects) {
      tester = objects[type].test;
      if (!tester && /^array:/.test(type) && objects[type.replace(/^array:/, '')]) {
        tester = objects[type.replace(/^array:/, '')].test;
      }

      satisfiesAll = keys.every(function(key) {
        return tester.call(input[key]);
      });

      if (satisfiesAll) {
        if (!fields && objects['array:'+type])
          fields = objects['array:'+type].defaultFields || Object.keys(objects['array:'+type].fields);
        if (!fields)
          fields = objects[type].defaultFields || Object.keys(objects[type].fields);

        var arr = keys.map(function(key) {
          return input[key];
        });

        return fromObject(objects, arr, type, fields);
      }
    }
  }

  return false;
}


function fromObject(objects, input, type, fields) {
  var fieldNames = fields.map(function(field) {
    if (typeof field === 'string')
      return field;
    if (typeof field === 'object' && field.hasOwnProperty('name'))
      return field.name;
    return '';
  });

  if (input instanceof Array || objects[type].horizontal) {
    var colAligns = [];
    fields.forEach(function(field, ix) {
      if (typeof field === 'object' && field.align)
        colAligns[ix] = field.align;
    });

    var headers = objects[type].header ? objects[type].header(fieldNames, input) : fieldNames;
    if (objects[type].horizontal) {
      headers = false;
    }

    var table = new Table({
      head: headers,
      colAligns: colAligns
    });
  }
  else {
    // Vertical table
    var table = new Table();
  }

  if (objects[type].insert) {
    objects[type].insert.call(input, table, fieldNames);
  }
  else {
    if (!objects[type].fields && /^array:/.test(type)) {
      insert(objects[type.replace(/^array:/, '')], input, table, fieldNames);
    }
    else {
      insert(objects[type], input, table, fieldNames);
    }
  }

  return table.toString();
}


/**
 * Default renderer.insert function.
 * @param {Any} input
 * @param  {Table} table  cli-table
 * @param  {Array} fields fields to show
 */
function insert(object, input, table, fields) {
  if (input instanceof Array) {
    input.forEach(function addRow(entry, rowNo) {
      var tableRow = fields.map(function cell(fieldName) {
        return getCellContent.call(entry, object.fields[fieldName], rowNo);
      });
      table.push(tableRow);
    });
  }
  else {
    fields.forEach(function addField(field) {
      var cells = {};
      cells[field] = getCellContent.call(input, object.fields[field]);
      table.push(cells);
    });
  }
}


/**
 * Get the content of a cell. `field` is the function or string 
 *   to use. `this` should be bound to the actual entry.
 * Additional parameters are forwarded to the function `field`.
 * @param  {Function|String} field
 * @return {String}
 */
function getCellContent(field) {
  var entry = this;
  var args = Array.prototype.slice.call(arguments, 1);

  if (typeof field === 'string')
    return field;
  if (typeof field === 'function')
    return field.apply(entry, args) || '';
  return '';
}


/**
 * Create a console by requiring all renderers in a given
 *   location.
 * @param  {String} location Filesystem path to use with require-all
 * @return {tconsole}
 */
function load(location) {
  var required = requireAll(location);
  var config = {};
  for (var key in required) {
    config[key.replace(/^array\./, 'array:')] = required[key];
  }
  var konsole = createConsole(config);
  return konsole;
}
