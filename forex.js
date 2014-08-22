var fs = require('fs'),
  request = require('request'),
  Q = require('q'),
  saved_rates;

var Forex = function(filePath){
  if((this instanceof Forex) == false) {
      return new Forex(filePath);
  }
  // file path is kept as a private variable
  var _filePath_ = (filePath && filePath.replace(/\.[^\.]+$/, '.json')) || 'saved_rates.json';
  // getter method to get the filePath, cannot be set
  this.filePath = function(){
    return _filePath_;
  };
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

module.exports = Forex;