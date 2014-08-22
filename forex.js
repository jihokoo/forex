var fs = require('fs'),
  request = require('request'),
  Q = require('q'),
  saved_rates;

var getSymbol = function(currencyCode){
  var localData = require('./locale_data.json');
  return localData[currencyCode]['symbol_native'];
};

var Forex = function(filePath, loadFromFile){
  if((this instanceof Forex) == false) {
      return new Forex(filePath);
  }
  // file path is kept as a private variable
  var _filePath_ = (filePath && filePath.replace(/\.[^\.]+$/, '.json')) || 'saved_rates.json';
  // getter method to get the filePath, cannot be set
  this.filePath = function(){
    return _filePath_;
  };
  this.loadFromFile = !!loadFromFile;
};

Forex.prototype.getLatestRate = function(currencyTo){
  var deferred = Q.defer();
  var self = this;
  if(!currencyTo) deferred.reject({error: true, message: "please enter a currency code"});
  request.get({url: 'http://openexchangerates.org/api/latest.json?app_id=0812d387198f4342bb179c7e1b9a2aa2', json:true}, function(err, r, body){
    if(err) deferred.reject(err);
    fs.writeFile(self.filePath(), JSON.stringify({conversionRates: {USD: body.rates}, date: Date.now()}, null, 4), function(err, datum){
      if(err) deferred.reject(err);
      var rate = body.rates[currencyTo];
      var symbol = getSymbol(currencyTo);
      deferred.resolve(symbol+ ' ' +rate);
    });
  });
  return deferred.promise;
};

Forex.prototype.getSavedRate = function(currencyTo){
  var deferred = Q.defer();
  var self = this;
  if(!currencyTo) deferred.reject({error: true, message: "please enter a currency code"});
  var rate = require('./'+self.filePath()).conversionRates.USD[currencyTo];
  var symbol = getSymbol(currencyTo);
  deferred.resolve(symbol+ ' ' +rate);
  return deferred.promise;
};

// Module will default to loading from live
Forex.prototype.getRate = function(currencyTo){
  var deferred = Q.defer();
  var self = this;
  if(!currencyTo) {
    deferred.reject({error: true, message: "please enter a currency code"});
    return deferred.promise;
  }
  if (this.loadFromFile) {
    self.getSavedRate(currencyTo)
      .then(function(rate){
        deferred.resolve(rate);
      })
      .then(function(err){
        deferred.reject(err);
      });
  }
  else {
    self.getLatestRate(currencyTo)
      .then(function(rate){
        deferred.resolve(rate);
      })
      .then(function(err){
        deferred.reject(err);
      });
  }
  return deferred.promise;
};

// gets locale data from localeplanet.com on load, since JavaScript doesn't have locale data
// wondering if i need to pull this everytime, or saving locally is okay
(function initialize(){
  request.get({url: 'http://www.localeplanet.com/api/auto/currencymap.json', json:true}, function(e, r, body){
    fs.writeFile('locale_data.json', JSON.stringify(body, null, 4), function(err, datum){
      if(err) throw err;
    });
  });
})()

module.exports = Forex;