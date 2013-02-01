if(typeof module != 'undefined') {
  var fs = require('fs');
  var IS_NODE = true;
}

var VCRConstructor = function VCR() {
  this.config = {
    hookInto: null,
    host: null,
    cassetteLibraryDir: 'cassettes'
  }
};

VCRConstructor.Store = {
  set: function(dir, name, cassette) {
    var data = JSON.stringify(cassette);

    if(IS_NODE) {
      if(!fs.existsSync(dir)) fs.mkdirSync(dir);
      fs.writeFile(dir + '/' + name + ".json", data);
    } else {
      localStorage.setItem(name, data);
    }
  },

  get: function(dir, name) {
    if(IS_NODE) {
      try{
        var data = fs.readFileSync(dir + '/' + name + ".json");
      } catch(e) {
        var data = false;
      }
    } else {
      var data = localStorage.getItem(name);
    }
    return !data ? false : JSON.parse(data);
  }
};

VCRConstructor.Context = function VCRContext(name, config) {
  var self = this;

  this.hookInto = config.hookInto;
  this.cassetteLibraryDir = config.cassetteLibraryDir;
  this.name = name;
  this.type = null;
  this.url = null;

  this.XMLHttpRequest = function() {
    var XHR = new self.hookInto;

    return self.intercept(XHR, {
      open: function(type, url) {
        self.type = type.toUpperCase();
        self.url = url;
      },

      send: function(data) {
        var response = self.getCassetteFor(self.type, self.url);
        var callback = this.onreadystatechange;
        var fakeXHR = this;

        if(!response) {
          XHR.open(self.type, (config.host || '') + self.url);
          XHR.send(data);
          XHR.onreadystatechange = function() {
            if(this.readyState === 4) {
              self.setCassetteFor(self.type, self.url, this)
            }
            self.extend(fakeXHR, this);
          }
        } else {
          self.extend(fakeXHR, {
            responseText: response.data,

            readyState: response.readyState,

            status: response.statusCode,

            getAllResponseHeaders: function() {
              var rawHeaders = "";
              for(var property in response.headers) {
                rawHeaders += property + ": " + response.headers[property] + "\n";
              }
              return rawHeaders;
            },
          });
        }
        typeof callback == 'function' && callback();
      }
    });
  };

  this.extend = function(destination, source, object) {
    for (var property in source) {
      destination[property] = object ? (object[property] || source[property]) : source[property];
    }
    return destination;
  };

  this.intercept = function(source, object) {
    return self.extend({}, source, object);
  };

  this.getCassetteFor = function(type, url) {
    var cassette = VCRConstructor.Store.get(self.cassetteLibraryDir, self.name);
    self.cassette = cassette ? cassette : {};
    return self.cassette[type + "," + url];
  };

  this.setCassetteFor = function(type, url, response) {
    var rawHeaders = response.getAllResponseHeaders().split("\n");
    var headers = {};

    for(var i = 0; i < rawHeaders.length; i++) {
      var cleanHeaders = rawHeaders[i].split(":");
      if(cleanHeaders[0]) {
        headers[cleanHeaders[0]] = cleanHeaders[1].replace(/(\r|\n|^\s+)/g, "");
      }
    }

    var flow = {
      statusCode: response.status,
      readyState: response.readyState,
      headers: headers,
      data: response.responseText
    };

    self.cassette[type + "," + url] = flow;

    VCRConstructor.Store.set(self.cassetteLibraryDir, self.name, self.cassette);
  }
};

VCRConstructor.prototype = {
  constructor: VCRConstructor,

  configure: function(fn) {
    fn(this.config);
  },

  useCassette: function(name, fn) {
    fn(new VCRConstructor.Context(name, this.config));
  }
};

if(IS_NODE) {
  module.exports = new VCRConstructor;
} else {
  var VCR = new VCRConstructor;
}
