module.exports = createConsole;
module.exports.load = load;
module.exports.combine = combine;
module.exports.getCellContent = getCellContent;
module.exports.insert = insert;
module.exports.insert.Array = insertArray;
module.exports.insert.Object = insertObject;


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
      if (fields === '*')
        fields = Object.keys(objects[type].fields);

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
      if (!tester) {
        if (/^array:/.test(type) && objects[type.replace(/^array:/, '')]) {      
          tester = objects[type.replace(/^array:/, '')].test;
        }
        else {
          throw new Error('No tester for type '+type);
        }
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

  if (input instanceof Array || objects[type].headers) {
    var colAligns = [];
    fields.forEach(function(field, ix) {
      if (typeof field === 'object' && field.align)
        colAligns[ix] = field.align;
    });

    var headers = objects[type].header ? objects[type].header(fieldNames, input) : fieldNames;

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
    objects[type].insert.call(input, table, objects[type], fieldNames);
  }
  else {
    if (!objects[type].fields && /^array:/.test(type)) {
      insert.call(input, table, objects[type.replace(/^array:/, '')], fieldNames);
    }
    else {
      insert.call(input, table, objects[type], fieldNames);
    }
  }

  return table.toString();
}


/**
 * Default renderer.insert function, `this` bound to the input.
 * @param  {Table} table       cli-table
 * @param  {Object} object     renderer object
 * @param  {Array} fields      fields to show
 */
function insert(table, object, fields) {
  var input = this;

  if (input instanceof Array) {
    insertArray.call(input, table, object, fields);
  }
  else {
    insertObject.call(input, table, object, fields);
  }
}


/**
 * renderer.insert function for rendering arrays,
 *   `this` bound to the input.
 * @param  {Table} table       cli-table
 * @param  {Object} object     renderer object
 * @param  {Array} fields      fields to show
 */
function insertArray(table, object, fields) {
  var input = this;

  input.forEach(function addRow(entry, rowNo) {
    var tableRow = fields.map(function cell(fieldName) {
      return getCellContent.call(entry, object.fields[fieldName], rowNo);
    });
    table.push(tableRow);
  });
}


/**
 * renderer.insert function for rendering objects,
 *   `this` bound to the input.
 * @param  {Table} table       cli-table
 * @param  {Object} object     renderer object
 * @param  {Array} fields      fields to show
 */
function insertObject(table, object, fields) {
  var input = this;

  fields.forEach(function addField(field) {
    var cells = {};
    cells[field] = getCellContent.call(input, object.fields[field]);
    table.push(cells);
  });
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
  if (typeof field === 'function') {
    var value;
    try {
      value = field.apply(entry, args);
    } catch (e) {
      value = '(err)';
    }
    if (value === undefined || value === null) 
      return '';
    
    return value.toString();
  }
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


/**
 * Combine multiple tconsole instances.
 * @return {tconsole}
 */
function combine() {
  var config = {};
  Array.prototype.forEach.call(arguments, function(tconsoleInstance) {
    mergeObject(config, tconsoleInstance._tconsoleConfig);
  });
  return createConsole(config);
}


/**
 * Merge properties of obj2 into obj1.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 */
function mergeObject(obj1, obj2){
  for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
}
