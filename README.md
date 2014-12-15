# tconsole

![Screenshot](https://raw.github.com/fnogatz/tconsole/master/screenshot.png)

tconsole is a drop-in replacement for node's default console that renders objects as tables in your terminal.


## Installation

Use NPM:

```shell
$ npm install tconsole
```


## How to use it

You can override the `console` object itself or assign tconsole to another variable. It's completely safe to override the native console object because tconsole calls native console methods for methods that are already available in it or objects that are not defined to use with tconsole.

```
var config = { ... };
console = require('tconsole')(config);

console.log(new Person('Harry', 'Potter'));
console(new Person('Sirius', 'Black'), [ 'First', 'Last' ]);
```

tconsole only modifies the predefined `console.log` method to check if there is a special rendering for the given objects. Call `console(object, fields)` to specify which fields should be printed.


## Example

```
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
  'single person': {
    check: function() {
      return (this instanceof Person);
    },
    fields: personFields,
    defaultFields: [
      'Name',
      'Age'
    ],
    vertical: true
  },
  'array of persons': {
    check: function() {
      return (this instanceof Array && this[0] instanceof Person);
    },
    fields: personFields,
    defaultFields: [
      'First',
      'Last',
      'Age'
    ]
  }
};

var harry = new Person('Harry', 'Potter');
var sirius = new Person('Sirius', 'Black', 37);

var tconsole = require('tconsole')(config);

// use 'single person' renderer
tconsole.log(sirius);

// use 'array of persons' renderer
tconsole.log([ harry, sirius ]);

// set the shown fields
tconsole(harry, [ 'First', 'Last', 'Name' ]);
```


## Configuration

The configuration object taken by tconsole is an attribute-value pair specifying the renderer objects. The name of the renderer does not matter at all.

```
var config = {
  'name your renderer': some_renderer,
  ...
};
```

### renderer.check()

Function that is called on the given object to check if this renderer is appropriate. `this` bound to input. Required.

### renderer.insert(table, fields)

Function that gets called on the given input to generate the table entries. `this` bound to input. Optional, default loops over all elements.

### renderer.fields

Object with functions to compute the value of the requested field. Required.

### renderer.defaultFields

Array of field names that are shown if the fields are not explicitly set. Optional, default is `Object.keys(renderer.fields)`.

### renderer.vertical

Boolean value to mark a vertical table. Optional, default is false.
