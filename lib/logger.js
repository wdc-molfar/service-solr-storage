const fs = require('fs');
const util = require('util');
const moment = require("moment")
const path = require("path")
const { mkdirs } = require("fs-extra")

module.exports = filepath => {
	
	const dirname = path.dirname(filepath)
	
	if(!fs.existsSync(dirname)){
		mkdirs(dirname)
	}
	
	const log_file = fs.createWriteStream(filepath, { flags: 'a' });
	const log_stdout = process.stdout;

	console.log = function () { //
	    [...arguments].forEach(element => {
	        log_file.write(`${moment(new Date()).format("YYYY-MM-DD hh:mm:ss")} -> ${util.format(element)}\n`);
	        // log_stdout.write(`${moment(new Date()).format("YYYY-MM-DD hh:mm:ss")} -> ${util.format(element)}\n`);
	    })
	}
	

	return console

}


