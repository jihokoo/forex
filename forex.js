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

Forex.prototype.getLatestRate = function(){

};

Forex.prototype.getSavedRate = function(){

};