module.exports = createConsole;

var Table = require('cli-table');


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
  }

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

  return konsole;
}


function toString(objects, input, fields) {
  for (var type in objects) {
    if (objects[type].check.call(input))
      return fromObject(objects, input, type, fields);
  }

  return false;
}


function fromObject(objects, input, type, fields) {
  fields = fields || objects[type].defaultFields;

  var fieldNames = fields.map(function(field) {
    if (typeof field === 'string')
      return field;
    if (typeof field === 'object' && field.hasOwnProperty('name'))
      return field.name;
    return '';
  });

  if (objects[type].vertical === true) {
    // Vertical table
    var table = new Table();
  }
  else {
    var colAligns = [];
    fields.forEach(function(field, ix) {
      if (typeof field === 'object' && field.align)
        colAligns[ix] = field.align;
    });

    var table = new Table({
      head: objects[type].header ? objects[type].header(fieldNames, input) : fieldNames,
      colAligns: colAligns
    });
  }

  if (objects[type].insert) {
    objects[type].insert.call(input, table, fieldNames);
  }
  else {
    insert(objects[type], input, table, fieldNames);
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
    input.forEach(function addRow(entry) {
      var tableRow = fields.map(function cell(fieldName) {
        return object.fields[fieldName].call(entry) || '';
      });
      table.push(tableRow);
    });
  }
  else {
    fields.forEach(function addField(field) {
      var tableRow = {}
      tableRow[field] = object.fields[field].call(input) || '';
      table.push(tableRow);
    });
  }
}