var test = require('tap').test;

var tconsole = require('../index');


function Person(first, last, age) {
  this.first = first;
  this.last = last;
  this.age = age;
}

var personFields = {
  'First': function() { return this.first; },
  'Last': function() { return this.last; },
  'Name': function() { return this.first+' '+this.last; },
  'Age': function() { return this.age; }
};

var config = {
  'person': {
    test: function() {
      return (this instanceof Person);
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

  var konsole = tconsole(config);

  t.equal(konsole.toString(harry), '┌──────┬──────────────┐\n│ Name │ Harry Potter │\n├──────┼──────────────┤\n│ Age  │              │\n└──────┴──────────────┘');
  t.end();
});


test('Example: Array of Person', function(t) {
  var harry = new Person('Harry', 'Potter');
  var sirius = new Person('Sirius', 'Black', 37);

  var konsole = tconsole(config);

  t.equal(konsole.toString([ harry, sirius ]), '┌────────┬────────┬─────┐\n│ First  │ Last   │ Age │\n├────────┼────────┼─────┤\n│ Harry  │ Potter │     │\n├────────┼────────┼─────┤\n│ Sirius │ Black  │ 37  │\n└────────┴────────┴─────┘')

  t.end();
});


