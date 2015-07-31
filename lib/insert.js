module.exports = insert
module.exports.Array = insertArray
module.exports.Object = insertObject

/**
 * Default renderer.insert function, `this` bound to the input.
 * @param  {Table} table       cli-table
 * @param  {Object} object     renderer object
 * @param  {Array} fields      fields to show
 */
function insert (table, object, fields) {
  var input = this

  if (input instanceof Array) {
    insertArray.call(input, table, object, fields)
  } else {
    insertObject.call(input, table, object, fields)
  }
}

/**
 * renderer.insert function for rendering arrays,
 *   `this` bound to the input.
 * @param  {Table} table       cli-table
 * @param  {Object} object     renderer object
 * @param  {Array} fields      fields to show
 */
function insertArray (table, object, fields) {
  var input = this

  input.forEach(function addRow (entry, rowNo) {
    var tableRow = fields.map(function cell (fieldName) {
      return getCellContent.call(entry, object.fields[fieldName], rowNo)
    })
    table.push(tableRow)
  })
}

/**
 * renderer.insert function for rendering objects,
 *   `this` bound to the input.
 * @param  {Table} table       cli-table
 * @param  {Object} object     renderer object
 * @param  {Array} fields      fields to show
 */
function insertObject (table, object, fields) {
  var input = this

  fields.forEach(function addField (field) {
    var cells = {}
    cells[field] = getCellContent.call(input, object.fields[field])
    table.push(cells)
  })
}

/**
 * Get the content of a cell. `field` is the function or string
 *   to use. `this` should be bound to the actual entry.
 * Additional parameters are forwarded to the function `field`.
 * @param  {Function|String} field
 * @return {String}
 */
function getCellContent (field) {
  var entry = this
  var args = Array.prototype.slice.call(arguments, 1)

  if (typeof field === 'string') {
    return field
  }
  if (typeof field === 'function') {
    var value
    try {
      value = field.apply(entry, args)
    } catch (e) {
      value = '(err)'
    }
    if (value === undefined || value === null) {
      return ''
    }

    return value.toString()
  }
  return ''
}
