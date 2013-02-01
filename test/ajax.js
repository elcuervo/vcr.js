if(typeof module != 'undefined') {
  var scenario = require('gerbil').scenario;
  var $ = require('jquery');
  var window = { XMLHttpRequest: require('xmlhttprequest').XMLHttpRequest }
  var VCR = require('../lib/vcr');
}

scenario("Ajax interception", {
  'setup': function() {
    VCR.configure(function(c) {
      c.hookInto = window.XMLHttpRequest;
      c.cassetteLibraryDir = "test/cassettes"
      c.host = "http://localhost:9292/"
    });
  },

  'Recording a jquery ajax request': function(g) {
    VCR.useCassette('jquery', function(v) {
      XMLHttpRequest = v.XMLHttpRequest;

      $.ajaxSettings.xhr = function(){
        return new v.XMLHttpRequest();
      }

      var promise = $.get('test/test.html');

      promise.then(function(response) {
        g.assertEqual("Hello World!\n", response);
      })

    });
  },

  'Recording vanilla ajax request': function(g) {
    VCR.useCassette('vanilla', function(v) {
      XMLHttpRequest = v.XMLHttpRequest;

      var makeRequest = function() {
        var ajax = new XMLHttpRequest();

        ajax.open('GET', 'test/test.html');
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
