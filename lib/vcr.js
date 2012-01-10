if(typeof module != 'undefined') {
  var fs = require('fs');
  var IS_NODE = true;
}

var VCRjs = function() {
  this.hookInto = null;
};

VCRjs.Store = {
  set: function(name, cassette) {
    var data = JSON.stringify(cassette);
    if(IS_NODE) {
      fs.writeFile('cassettes/' + name + ".json", data);
    } else {
      localStorage.setItem(name, data);
    }
  },

  get: function(name) {
    if(IS_NODE) {
      var data = fs.readFileSync('cassettes/' + name + ".json");
    } else {
      var data = localStorage.getItem(name);
    }
    return !data ? false : JSON.parse(data);
  }
};

VCRjs.Context = function(name, hookInto) {
  var self = this;

  this.hookInto = hookInto.length > 1 ? hookInto : [hookInto];
  this.name = name;
  this.type = null;
  this.url = null;

  this.XMLHttpRequest = function() {
    var XHR = new self.hookInto[0];

    return self.intercept(XHR, {
      open: function(type, url) {
        self.type = type;
        self.url = url;
      },
      send: function(data) {
        var response = self.getCassetteFor(self.type, self.url);
        var callback = this.onreadystatechange;
        var fakeXHR = this;

        if(!response) {
          XHR.open(self.type, self.url);
          XHR.send(data);
          XHR.onreadystatechange = function() {
            if(this.readyState === 4) {
              self.setCassetteFor(self.type, self.url, this)
            }
            self.extend(fakeXHR, this);
          }
        } else {
          self.extend(fakeXHR, response);
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
    var cassette = VCRjs.Store.get(self.name);
    self.cassette = cassette ? cassette : {};
    return self.cassette[type + "," + url];
  };

  this.setCassetteFor = function(type, url, response) {
    self.cassette[type + "," + url] = response;
    VCRjs.Store.set(self.name, self.cassette);
  }
};

VCRjs.prototype = {
  configure: function(fn) {
    fn(this);
  },

  useCassette: function(name, fn) {
    fn(new VCRjs.Context(name, this.hookInto));
  }
};

if(IS_NODE) {
  module.exports = new VCRjs;
} else {
  var VCR = new VCRjs;
}
