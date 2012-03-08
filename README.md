# VCR.js

[![Build Status](https://secure.travis-ci.org/MoriTanosuke/FitbitAnalyzr.png?branch=master)](http://travis-ci.org/MoriTanosuke/FitbitAnalyzr)

![VCR](http://upload.wikimedia.org/wikipedia/commons/thumb/5/56/N1500_v2.jpg/275px-N1500_v2.jpg)

Record XMLHttpRequest calls and saves them using localStorage or files if using
Nodejs.
It's a js implementation of myronmarston's [VCR](https://github.com/myronmarston/vcr)
but for javasccript without any dependencies

```bash
$ npm install vcr
```

## Config

```javascript
VCR.configure(function(c) {
  c.hookInto = window.XMLHttpRequest;
  c.cassetteLibraryDir = "recorder"; // default: 'cassettes'
  c.host = "http://localhost:9393/"; // will prepend req url
});
```

The only required config it's wich object to intercept, for now only works with
XMLHttpRequest to catch ajax requests.

hookInto: object to intercept
cassetteLibraryDir: when using nodejs defines where to store cassettes
host: usefull when running within node and want to cache request to save,
destroy, update, etc.

## How to use it

I try to make it as similar to original VCR as possible.
Using [Gerbil](http://github.com/elcuervo/gerbil) it's something like this:

```javascript
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

        ajax.open('GET', 'test.html');
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
      g.setTimeout(function() { makeRequest(); }, 100);
    });
  }
});
```

## What will happen?

If you are using nodejs .json files will be created as cassetes to reproduce
afterwards. In the other hand if you are running it in a browser localStorage
will be used to persist the recordings.

## Special Thanks
[Pablo Dejuan](https://github.com/pdjota) for the idea.
