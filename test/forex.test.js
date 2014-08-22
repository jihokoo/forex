var Forex = require('../forex');
    request = require('request'),
    should = require('should'),
    fs = require('fs'),
    chai = require("chai"),
    chaiAsPromised = require("chai-as-promised");

var localeData;

chai.use(chaiAsPromised);
var assert = chai.assert;
var expect = chai.expect;

describe('forex', function() {
  var exchangeRate;

  before(function(done) {
    request.get({url: 'http://www.localeplanet.com/api/auto/currencymap.json', json:true}, function(e, r, body){
      fs.writeFile('locale_data.json', JSON.stringify(body, null, 4), function(err, datum){
        if(err) throw err;
        localeData = require('../locale_data.json');
        done();
      });
    });
  });

  beforeEach(function() {
    exchangeRate = new Forex('test_file.json');
  });

  it("should return an instance of itself when called as a function", function() {
    var instance = Forex('test_file.json');
  });

  it("should have a getter method in the contructor for filePath", function(){
    (Forex.prototype.filePath === undefined).should.be.true;
    (Forex.filePath === undefined).should.be.true;
    exchangeRate.filePath.should.be.an.instanceOf(Function);
  });

  it("should take a filePath in its contructor", function(){
    exchangeRate.filePath().should.equal('test_file.json');
  });

  it("should replace file extensions to .json", function(){
    var test = new Forex('other_file.csv');
    test.filePath().should.equal('other_file.json');
  });

  it("should set a default file path if it is not specified", function(){
    var test = new Forex();
    test.filePath().should.equal('saved_rates.json');
  });

  it("should have methods 'getLatestRate' and 'getSavedRate'", function() {
    exchangeRate.getLatestRate.should.be.an.instanceOf(Function);
    exchangeRate.getSavedRate.should.be.an.instanceOf(Function);
  });

  it("can take a currency code and report the latest exchange rate", function(done) {
    exchangeRate.getLatestRate('USD').then(function(data) {
      data.should.equal('$ 1');
      done();
    }).catch(function(err){
      done(err);
    });
  });

  it("saves the latest exchange rates into a static file at specified file path", function() {
    var rates = require('../'+exchangeRate.filePath()).conversionRates['USD'];
    rates.should.have.properties('USD', 'EUR', 'KRW');
  });


  it("updates the static file when getLatestRate is called", function(){
    var oldTime = require('../'+exchangeRate.filePath()).date;
    exchangeRate.getLatestRate('USD').then(function() {
      var currentTime = require('../'+exchangeRate.filePath()).date;
      currentTime.should.be.greaterThan(oldTime);
      done();
    }).catch(function(err){
      done(err);
    });
  });

  // it("can take a currency code and report the latest exchange rate", function() {
  //  return expect(exchangeRate.getLatestRate('EUR')).to.eventually.equal('hello');
  // });
  // *** alternative method in mocha

  it("can take a currency code and report a saved exchange rate", function(done) {
    exchangeRate.getSavedRate('EUR').then(function(data) {
      var rate = require('../'+exchangeRate.filePath()).conversionRates['USD']['EUR'];
      var symbol = localeData['EUR']['symbol_native'];

      data.should.equal(symbol+ ' ' +rate);
      done();
    }).catch(function(err){
      done(err);
    });
  });
  /*
    If we were using just chai, we could do
    return exchangeRate.getLatestRate('EUR').should.eventually.equal();
    the only reason i am not is because the rest of the tests are written
    with should

    *** note for the future, chai > should
  */

  it("can be configured to return from static store or live api through a second parameter", function(done) {
    var test = new Forex('test_file.json', true);
    test.loadFromFile.should.be.true;

    var oldTime = require('../'+exchangeRate.filePath()).date;
    test.getRate('EUR').then(function(data) {
      var currentTime = require('../'+exchangeRate.filePath()).date;
      currentTime.should.equal(oldTime);
      done();
    }).catch(function(err){
      done(err);
    });
  });
});