var scenario = require('gerbil').scenario;
var window = { XMLHttpRequest: require('xmlhttprequest').XMLHttpRequest }
var VCR = require('../lib/vcr');

scenario("Ajax interception", {
  'setup': function() {
    VCR.configure(function(c) {
      c.hookInto = window.XMLHttpRequest;
    });
  },

  'Recording ajax request': function(g) {
    VCR.useCassette('test', function(v) {
      XMLHttpRequest = v.XMLHttpRequest;

      var makeRequest = function() {
        var ajax = new XMLHttpRequest();

        ajax.open('GET', 'http://localhost:9292/test.html');
        ajax.onreadystatechange = function() {
          if(ajax.readyState === 4) {
            g.assertEqual("Hello World!\n", ajax.responseText);
          }
        };
        ajax.send(null);
      }
      // Record First Request
      makeRequest();

      // Wait for it...
      g.setTimeout(function() {
        makeRequest();
      }, 1000);
    });
 }
});
