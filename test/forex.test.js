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
    exchangeRate = new Forex({filePath: 'test_file.json'});
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
    var test = new Forex({filePath: 'other_file.csv'});
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

  describe('getLatestRate', function () {

    it("can take a currency code and report the latest exchange rate", function(done) {
      exchangeRate.getLatestRate(['USD']).then(function(data) {
        data[0].should.containDeep({ rate: 1, symbol: '$'});
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it("saves the latest exchange rates into a static file at specified file path", function() {
      var rates = require('../'+exchangeRate.filePath()).conversionRates['USD'];
      rates.should.have.properties('USD', 'EUR', 'KRW');
    });

    it("updates the static file when getLatestRate is called", function(done){
      var oldTime = require('../'+exchangeRate.filePath()).date;
      exchangeRate.getLatestRate(['USD']).then(function() {
        fs.readFile(exchangeRate.filePath(), function(err, datum){
          var currentTime = JSON.parse(datum).date
          currentTime.should.be.greaterThan(oldTime);
          done();
        });
      }).catch(function(err){
        done(err);
      });
    });

    it("throws an error when an invalid currency code is entered", function(done){
      exchangeRate.getLatestRate(['SD']).then(function() {
        done()
      }).catch(function(err){
        err.should.be.an.instanceof(Error);
        err.message.should.equal('This is either an incorrect code or this code is not yet supported.');
        done();
      });
    });
  });

  // it("can take a currency code and report the latest exchange rate", function() {
  //  return expect(exchangeRate.getLatestRate('EUR')).to.eventually.equal('hello');
  // });
  // *** alternative method in mocha

  describe('getSavedRate', function () {

    it("can take a currency code and report a saved exchange rate", function(done) {
      exchangeRate.getSavedRate(['EUR']).then(function(data) {
        var rate = require('../'+exchangeRate.filePath()).conversionRates['USD']['EUR'];
        var symbol = localeData['EUR']['symbol_native'];

        data[0].should.containDeep({ rate: rate, symbol: symbol});
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it("throws an error when an invalid currency code is entered", function(done){
      exchangeRate.getLatestRate(['SD']).then(function() {
        done()
      }).catch(function(err){
        err.should.be.an.instanceof(Error);
        err.message.should.equal('This is either an incorrect code or this code is not yet supported.');
        done();
      });
    });
  });
  /*
    If we were using just chai, we could do
    return exchangeRate.getLatestRate('EUR').should.eventually.equal();
    the only reason i am not is because the rest of the tests are written
    with should

    *** note for the future, chai > should
  */

  describe('getRate', function() {
    it("can be configured to return from static store or live api through a second parameter", function(done) {
      var test = new Forex({filePath: 'test_file.json', loadFromFile: true});
      test.loadFromFile.should.be.true;

      fs.readFile(exchangeRate.filePath(), function(err, old){
        var oldTime = JSON.parse(old).date;
        test.getRate(['EUR']).then(function(data) {
          fs.readFile(exchangeRate.filePath(), function(err, current){
            var currentTime = JSON.parse(current).date;
            currentTime.should.equal(oldTime);
            done();
          });
        }).catch(function(err){
          done(err);
        });
      });
    });

    it("defaults to return live rates", function(done) {
      var test = new Forex({filePath: 'test_file.json'});
      (test.loadFromFile === false).should.be.true;

      fs.readFile(exchangeRate.filePath(), function(err, old){
      var oldTime = JSON.parse(old).date;
        test.getRate(['EUR']).then(function(data) {
          fs.readFile(exchangeRate.filePath(), function(err, datum){
            var currentTime = JSON.parse(datum).date
            currentTime.should.be.greaterThan(oldTime);
            done();
          });
        }).catch(function(err){
          done(err);
        });
      });
    });

    it("throws an error when an invalid currency code is entered", function(done){
      exchangeRate.getRate(['SD']).then(function() {
        done()
      }).catch(function(err){
        err.should.be.an.instanceof(Error);
        err.message.should.equal('This is either an incorrect code or this code is not yet supported.');
        done();
      });
    });
  });
});