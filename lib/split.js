'use strict'
var utils = require('./utils.js');
var esprima = require('esprima');
var escodegen = require('escodegen');
var _ = require('underscore');
var split = (function(){

    var encoder = {
        in: utils.NoopIconv,
        out: utils.NoopIconv
    };

    function tokenize(code) {
        var files = {};
        var ast = utils.removeDuplicateComments(esprima.parse(code, {range: true, attachComment: true}));
        for ( var idx in ast.body || []) {
            var statement = ast.body[idx];
            if ( statement.leadingComments ) {

                var fileTag = utils.jsdoc.file(statement.leadingComments);
                if ( fileTag == null || !fileTag.description) {
                    utils.logger.warn("Not found expected file tag for the statement( type:"
                    + statement.type + ", identify : "+ utils.identify(statement) + " )");;
                }
                var fragments = files[fileTag.description];
                if ( fragments == null ) {
                    fragments = [];
                    files[fileTag.description] = fragments;
                }
                fragments.push(escodegen.generate(statement,{comment: true}));

            }else {
                utils.logger.warn("Not found expected comment block for the statement( type:"
                    + statement.type + ", identify : "+ utils.identify(statement) + " )");;
            }
        }
        return files;
    }

    function writeToConsole(files) {

        for (var file in files ) {
            console.log(file);
            var fragments = files[file] || [];
            for (var fragment in fragments) {
                console.log(fragments[fragment]);
            }
        }
    }

    function writeToFile(out, files) {
        utils.fs.mkdir(out);
        for (var file in files ) {
            var fragments = files[file] || [];
            var contents ='';
            for (var idx in fragments) {
                contents += fragments[idx] + '\n'
            }
            utils.fs.write(utils.fs.mkpath(out, file), contents, encoder);
        }
    }

    function mergeFragments(f1, f2) {
        var k1 = Object.keys(f1);
        var k2 = Object.keys(f2);
        var o = {};
        _.union(k1,k2).forEach(function(k){
            o[k] = (f1[k]||[]).concat(f2[k]||[]);
        });
        return o;
    }

    return function(files, config) {

        if (config.encoder)
            encoder = config.encoder;

        var fragments = files.map(function(f){
            return tokenize(utils.fs.read(f,encoder));
        }).reduce(mergeFragments);

        if ( config.output ) {
            writeToFile(config.output, fragments);
        }else {
            writeToConsole(fragments)
        }
    };

}());

module.exports = split;
