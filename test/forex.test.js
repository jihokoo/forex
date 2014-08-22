var Forex = require('../forex');
    request = require('request'),
    should = require('should');

describe('forex', function() {
  var exchangeRate;

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
});