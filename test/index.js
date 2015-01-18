var test = require('tap').test;

var tconsole = require('../index');
var combine = require('../combine');


function Person(first, last, age) {
  this.first = first;
  this.last = last;
  this.age = age;
}

var personFields = {
  'First': function() { return this.first; },
  'Last': function() { return this.last; },
  'Name': function() { return this.first+' '+this.last; },
  'Age': function() { return this.age; },
};

var personConfig = {
  'person': {
    test: function() {
      return (this instanceof Person);
    },
    fields: personFields,
    defaultFields: [
      'Name',
      'Age'
    ],
  },
  'array:person': {
    defaultFields: [
      'First',
      'Last',
      'Age'
    ],
  },
};

var dateConfig = {
  'date': {
    test: function() {
      return (this instanceof Date);
    },
    fields: {
      'Date': function() { return this.getDate(); },
      'Year': function() { return this.getFullYear(); },
      'Month': function() { return this.getMonth()+1; },
    }
  }
};


test('has same footprint as console', function(t) {
  var konsole = tconsole({});

  for (var key in console) {
    t.ok(konsole.hasOwnProperty(key));
  }

  t.end();
});


test('.toString', function(t) {
  var konsole = tconsole({});

  t.ok(konsole.hasOwnProperty('toString'));
  t.type(konsole.toString, 'function');

  t.end();
});


test('Example: Person', function(t) {
  var harry = new Person('Harry', 'Potter');

  var konsole = tconsole(personConfig);

  t.equal(konsole.toString(harry), '┌──────┬──────────────┐\n│ Name │ Harry Potter │\n├──────┼──────────────┤\n│ Age  │              │\n└──────┴──────────────┘');
  t.end();
});


test('Example: Array of Person', function(t) {
  var harry = new Person('Harry', 'Potter');
  var sirius = new Person('Sirius', 'Black', 37);

  var konsole = tconsole(personConfig);

  t.equal(konsole.toString([ harry, sirius ]), '┌────────┬────────┬─────┐\n│ First  │ Last   │ Age │\n├────────┼────────┼─────┤\n│ Harry  │ Potter │     │\n├────────┼────────┼─────┤\n│ Sirius │ Black  │ 37  │\n└────────┴────────┴─────┘');

  t.end();
});


test('Example: Date', function(t) {
  // Sun Jan 18 2015 22:30:30 GMT+0100 (CET)
  var date = new Date(1421616630508);

  var konsole = tconsole(dateConfig);

  t.equal(konsole.toString(date), '┌───────┬──────┐\n\│ Date  │ 18   │\n├───────┼──────┤\n│ Year  │ 2015 │\n├───────┼──────┤\n│ Month │ 1    │\n└───────┴──────┘');

  t.end();
});
