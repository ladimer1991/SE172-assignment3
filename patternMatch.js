#!/usr/bin/env node

var Transform = require('stream').Transform;
var util = require( "util" );
 

if (!Transform) {
  Transform = require('readable-stream/transform');
}

//obtained from developer.mozilla.org
function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//PatternMatch needs to parse every piece that gets transformed
function PatternMatch( pattern ) {

  // If invoked
  if ( !( this instanceof PatternMatch )) {

  return( new PatternMatch( pattern ) );
}
 
  //ObjectMode calculation here 
  Transform.call( this,  { objectMode: true  }  );
  
  //Check to see that pattern is not just a string and that it is an actual instance of the PatternMatch.
// check for 
  if (!(pattern instanceof RegExp)) {
    pattern = new RegExp(escapeRegExp(pattern), "i");
  }

  //create clone of the pattern.
  this._pattern = pattern;

  // Hold the unprocessed portion of the input stream.
  this._inputBuffer = "";
}

// Extend the Transform class.
// --
// NOTE: This only extends the class methods - not the internal properties. As such we
 // have to make sure to call the Transform constructor(above).
util.inherits(PatternMatch, Transform);

// Implement a single method called _transform.
PatternMatch.prototype._transform = function (chunk, encoding, getNextChunk){
  this._inputBuffer += chunk;
//  console.log("Current buffer: " + this._inputBuffer);

  var match = this._pattern.exec(this._inputBuffer);
  
  while (match) {
  //  console.log(match);
    //Get the part before the match and save it.
    var result = this._inputBuffer.substring(0, match.index);
    //Remove the match from the buffer.
    this._inputBuffer = this._inputBuffer.substring(match.index+1, this._inputBuffer.length);

    //console.log("result: " + result);
    //console.log("remainder: " + this._inputBuffer);
    //Return the match.
    this.push(result.trim());
    //Find next match.
    match = this._pattern.exec(this._inputBuffer);
  }

  getNextChunk();
}
//After stream has been read and transformed, the _flush method is called ( output stream and clean up existing data)
PatternMatch.prototype._flush = function (flushCompleted) {
  
  //clean up the interval buffer.
  this.inputBuffer = "";

  // The end of the output stream.
  this.push(null);

  //Input has been fully processed.
  flushCompleted();

}
//End of patternMatch module

//Program module                                
var inputProg = require("commander");
var fileSystem = require("fs");

inputProg
       .option('-p, --pattern <pattern>', 'Input Pattern such as . ,')

       .parse(process.argv);

// Input stream from the file system.                                       
var inputStream = fileSystem.createReadStream( "data.txt" );

// Run through the input and find pattern matches.                                               
var patternStream = inputStream.pipe( new PatternMatch(inputProg.pattern));

// Read matches from the stream.                                               
var matches = [];
       
patternStream.on(
  "readable",
  function() {
   
    var content = null;

    while ( content = this.read()){
    //  console.log("content: " + content);
      matches.push(content);
    }
  }
);
patternStream.on("end", function() {
  console.log(matches);
}
);

