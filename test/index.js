var test = require('tap').test

var tconsole = require('../lib/index')
var combine = tconsole.combine

function Person (first, last, age) {
  this.first = first
  this.last = last
  this.age = age
}

var personFields = {
  'First': function () { return this.first },
  'Last': function () { return this.last },
  'Name': function () { return this.first + ' ' + this.last },
  'Age': function () { return this.age }
}

var personConfig = {
  'person': {
    test: function () {
      return (this instanceof Person)
    },
    fields: personFields,
    defaultFields: [
      'Name',
      'Age'
    ]
  },
  'array:person': {
    defaultFields: [
      'First',
      'Last',
      'Age'
    ]
  }
}

var dateConfig = {
  'date': {
    test: function () {
      return (this instanceof Date)
    },
    fields: {
      'Date': function () { return this.getDate() },
      'Year': function () { return this.getFullYear() },
      'Month': function () { return this.getMonth() + 1 }
    }
  }
}

/**
 * Create object instances
 */
var harry = new Person('Harry', 'Potter')
var sirius = new Person('Sirius', 'Black', 37)
// Sun Jan 18 2015 22:30:30 GMT+0100 (CET)
var date = new Date(1421616630508)

/**
 * Expected outputs
 */
var strings = {
  Harry: '┌──────┬──────────────┐\n│ Name │ Harry Potter │\n├──────┼──────────────┤\n│ Age  │              │\n└──────┴──────────────┘',
  HarryAndSirius: '┌────────┬────────┬─────┐\n│ First  │ Last   │ Age │\n├────────┼────────┼─────┤\n│ Harry  │ Potter │     │\n├────────┼────────┼─────┤\n│ Sirius │ Black  │ 37  │\n└────────┴────────┴─────┘',
  Date: '┌───────┬──────┐\n\│ Date  │ 18   │\n├───────┼──────┤\n│ Year  │ 2015 │\n├───────┼──────┤\n│ Month │ 1    │\n└───────┴──────┘'
}

test('has same footprint as console', function (t) {
  var konsole = tconsole({})

  for (var key in console) {
    t.ok(konsole.hasOwnProperty(key), 'has .' + key + ' property')
  }

  t.end()
})

test('.toString', function (t) {
  var konsole = tconsole({})

  t.ok(konsole.hasOwnProperty('toString'))
  t.type(konsole.toString, 'function')

  t.end()
})

test('Example: Person', function (t) {
  var konsole = tconsole(personConfig)

  t.equal(konsole.toString(harry), strings.Harry)
  t.end()
})

test('Example: Array of Person', function (t) {
  var konsole = tconsole(personConfig)

  t.equal(konsole.toString([ harry, sirius ]), strings.HarryAndSirius)

  t.end()
})

test('Example: Date', function (t) {
  var konsole = tconsole(dateConfig)

  t.equal(konsole.toString(date), strings.Date)

  t.end()
})

test('combine', function (t) {
  var konsole1 = tconsole(personConfig)
  var konsole2 = tconsole(dateConfig)

  var konsole = combine(konsole1, konsole2)

  t.equal(konsole.toString(date), strings.Date)
  t.equal(konsole.toString(harry), strings.Harry)

  t.end()
})
