#!/usr/bin/env node
'use strict'
var iconv = require('iconv-lite')
var minimist = require('minimist');
var color = require('colors');
var commands = {
    split: require('./lib/split.js')
    ,concat: require('./lib/concat.js')
    ,refine: require('./lib/refine.js')
}

function isFunction(object) {
    return object && ( typeof object === 'function' );
}

function usage() {
    console.log('Usage: js_tools.js command [options]'.cyan);
    console.log('    command := [split|concat|refine]'.cyan);
    console.log('    options := [split_options|concat_options|refine_options]'.cyan);
    console.log('        split_options  := input_file1... -o output_directory --encoding=file_encoding'.cyan);
    console.log('        concat_options := input_file1... -o output_filename  --encoding=file_encoding'.cyan);
    console.log('        refine_options := input_file1... -o output_directory --encoding=file_encoding'.cyan);
    console.log('        file_encoding := [sjis|cp932|euc-jp|iso-8859-1|utf8]'.cyan);
    console.log('        default file_encoding is utf8'.cyan);
}

function parseArgv() {
    var config = {};
    var argv = minimist(process.argv.slice(2));
    if ( argv.h || argv.help ) {
        usage();
        process.exit(0);
    }
    var command = argv._[0];

    if ( !command ||  !commands[command] || !isFunction(commands[command]) ) {
        usage();
        process.exit(1);
    }
    config.command = command;

    config.inputFiles = argv._.slice(1);

    if ( argv.o )
        config.output = argv.o;

    var encoding = argv.encoding;
    if ( encoding && ( encoding != 'UTF-8' || encoding != 'utf-8' || encoding != 'utf8')) {
        iconv.encodingExists(encoding);
        config.encoder = {
            in : {
                convert: function(str) {
                    return iconv.decode(str, encoding);
                }
            },
            out : {
                convert: function(str) {
                    return iconv.encode(str, encoding);
                }
            }
        };
    }
    return config;

}

try {
    var config = parseArgv();
    commands[config.command](config.inputFiles, config);
}catch(e) {
    usage();
    throw e;
}
