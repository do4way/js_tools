'use strict'
var utils = require('./utils.js');
var esprima = require('esprima');
var escodegen = require('escodegen');

var refine = (function(){

    var encoder = {
        in: utils.NoopIconv,
        out: utils.NoopIconv
    };

    function refineFile(file) {
        var srcCode = utils.fs.read(file,encoder);
        var ast = esprima.parse(srcCode, {range:true, attachComment:true});
        var statementsIdx = {};
        var noIdentify = [];
        for (var idx in ast.body ) {
            var statement = ast.body[idx];
            var identify = utils.identify(statement);
            if ( identify != '' ) {
                statementsIdx[identify] = statement;
            }else {
                noIdentify.push(statement);
            }
        }
        var keys = Object.keys(statementsIdx);
        keys.sort(function(k1,k2){ return k1 > k2});
        var sortedStatements = [];
        keys.forEach(function(key){sortedStatements.push(statementsIdx[key]);});
        ast.body = sortedStatements.concat(noIdentify);
        return escodegen.generate(ast);

    }

    return function(files,config) {

        if (config.encoder)
            encoder = config.encoder;

        var outdir = config.output;
        for ( var idx in files ) {
            var file = files[idx];
            var contents = refineFile(file);
            if (outdir) {
                utils.fs.mkdir(utils.fs.mkpath(outdir, utils.fs.dirname(file)));
                utils.fs.write(utils.fs.mkpath(outdir, files[idx]), contents,encoder);
            }else {
                console.log(contents);
            }

        }
    };


}());

module.exports = refine;
