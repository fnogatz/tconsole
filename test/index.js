var test = require('tap').test;

var konsole = require('../index')({});


test('has same footprint as console', function(t) {
  for (var key in console) {
    t.ok(konsole.hasOwnProperty(key));
  }

  t.end();
});
