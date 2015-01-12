module.exports = createConsole;
module.exports.getCellContent = getCellContent;
module.exports.insert = insert;


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

  return konsole;
}


function toString(objects, input, fields) {
  for (var type in objects) {
    if (objects[type].check && objects[type].check.call(input)) {
      fields = fields || objects[type].defaultFields || Object.keys(objects[type].fields);

      return fromObject(objects, input, type, fields);
    }
  }

  if (input instanceof Array) {
    var satisfiesAll = false;

    for (var type in objects) {
      satisfiesAll = input.every(function(row) {
        return objects[type].check.call(row);
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

    var table = new Table({
      head: objects[type].header ? objects[type].header(fieldNames, input) : fieldNames,
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
