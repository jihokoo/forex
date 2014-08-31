var fs = require('fs'),
  request = require('request'),
  Q = require('q'),
  dns = require('dns'),
  saved_rates;


// appID: 0812d387198f4342bb179c7e1b9a2aa2

var getSymbol = function(currencyCode){
  var localData = require('./locale_data.json');
  if(localData[currencyCode]){
    return localData[currencyCode]['symbol_native'];
  } else{
    return {error: new Error('This is either an incorrect code or this code is not yet supported.')}
  }
};

var Forex = function(options){
  if((this instanceof Forex) == false) {
      return new Forex(options);
  }
  // file path is kept as a private variable
  options = options || {}
  var _filePath_ = (options.filePath && options.filePath.replace(/\.[^\.]+$/, '.json')) || 'saved_rates.json';
  // getter method to get the filePath, cannot be set
  this.filePath = function(){
    return _filePath_;
  };
  this.loadFromFile = !!options.loadFromFile;
};

Forex.prototype.getLatestRate = function(currencyTo){
  var deferred = Q.defer();
  var self = this;
  var currencyCodes = arguments;
  var results = [];
  if(!currencyTo) deferred.reject({error: true, message: "please enter a currency code"});
  request.get({url: 'http://openexchangerates.org/api/latest.json?app_id=0812d387198f4342bb179c7e1b9a2aa2', json:true}, function(err, r, body){
    if(err) deferred.reject(err);
    if(body.error) deferred.reject(body);
    fs.writeFile('./'+self.filePath(), JSON.stringify({conversionRates: {USD: body.rates}, date: Date.now()}, null, 4), function(err, datum){
      if(err) deferred.reject(err);
      var symbol;
      for(var i=0; i<currencyCodes.length; i++){
        symbol = getSymbol(currencyCodes[i]);
        if(symbol.error) deferred.reject(symbol.error);
        results.push({
          rate: body.rates[currencyCodes[i]],
          symbol: symbol
        });
      }
      deferred.resolve(results);
    });
  });
  return deferred.promise;
};

Forex.prototype.getSavedRate = function(currencyTo){
  var deferred = Q.defer();
  var self = this;
  var currencyCodes = arguments;
  var results = [];
  if(!currencyTo) deferred.reject(new Error("Please enter a currency code"));
  fs.readFile('./'+self.filePath(), function(err, datum){
    var savedRates = JSON.parse(datum)['conversionRates']['USD']
    var symbol;
    for(var i=0; i<currencyCodes.length; i++){
      symbol = getSymbol(currencyCodes[i]);
      if(symbol.error) deferred.reject(symbol.error);
      results.push({
        rate: savedRates[currencyCodes[i]],
        symbol: symbol
      });
    }
    deferred.resolve(results);
  });
  return deferred.promise;
};

// Module will default to loading from live
Forex.prototype.getRate = function(currencyTo){
  var deferred = Q.defer();
  var self = this;
  if(!currencyTo) {
    deferred.reject(new Error("Please enter a currency code"));
    return deferred.promise;
  }
  if (this.loadFromFile) {
    self.getSavedRate(currencyTo)
      .then(function(rate){
        deferred.resolve(rate);
      }, function(err){
        deferred.reject(err);
      });
  }
  else {
    self.getLatestRate(currencyTo)
      .then(function(rate){
        deferred.resolve(rate);
      }, function(err){
        deferred.reject(err);
      });
  }
  return deferred.promise;
};

// gets locale data from localeplanet.com on load, since JavaScript doesn't have locale data
// wondering if i need to pull this everytime, or saving locally is okay
(function initialize(){
  request.get({url: 'http://www.localeplanet.com/api/auto/currencymap.json', json:true}, function(e, r, body){
    fs.writeFile('./locale_data.json', JSON.stringify(body, null, 4), function(err, datum){
      if(err) throw err;
    });
  });
})()

module.exports = Forex;