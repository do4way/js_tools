'use strict'
var color = require('colors');
var sysos = require('os');
var os = (function() {

    return {

        EOL: sysos.EOL,
        isWindows: sysos.type() == 'Windows_NT',
        newline: function(str) {
            return os.isWindows ? str.replace(/([^\r])\n/g, "$1\r\n") : str;
        },

    };

}());

module.exports = {

    NoopIconv : {
        convert: function(buffer) {
            return buffer;
        }
    },

    traverse: function (node, func) {
        func(node);
        for (var key in node){
            var child = node[key];
            var self = this;
            if(typeof child === 'object' && child != null){
                if (Array.isArray(child)){
                    child.forEach(function(node){
                        self.traverse(node,func);
                    });
                }else{
                    self.traverse(child, func);
                }
            }
        }
    },

    removeDuplicateComments: function(ast) {

        var rangesInLeadingComments = new Set();

        this.traverse(ast, function(node) {

            for ( var key in node.leadingComments || []) {

                var leadingComment = node.leadingComments[key] ;
                rangesInLeadingComments.add(leadingComment.range.join(','));
            }
        });
        this.traverse(ast, function(node) {
            if ( !node.trailingComments ) {
                return;
            }
            var trailingComments = [];
            for ( var key in node.trailingComments ) {
                var trailingComment = node.trailingComments[key];
                if (!rangesInLeadingComments.has(trailingComment.range.join(',')))
                    trailingComments.push(trailingComment);
            }
            node.trailingComments = trailingComments;
        });

        return ast;
    },

    identify : function(statement) {
        var statements = {
            FunctionDeclaration : function(node) {
                return node.id.name;
            },
            VariableDeclaration : function(node) {
                var declarations = node.declarations;
                var name = [];
                for ( var key in declarations) {
                    name.push(module.exports.identify(node.declarations[key]));
                }
                return name.join(':');
            },
            VariableDeclarator : function(node) {
                return node.id.name;
            },
            ExpressionStatement : function(node) {
                return module.exports.identify(node.expression);
            },
            FunctionExpression : function(node) {
                return node.id ? node.id.name : 'AnonymousFunc';
            },
            AssignmentExpression : function(node) {
                return module.exports.identify(node.left);
            },
            CallExpression : function(node) {
                var funcName =  module.exports.identify(node.callee);
                var argNames = [];
                for (var key in node.arguments) {
                    //console.log(node.arguments[key]);
                    argNames.push(module.exports.identify(node.arguments[key]));
                }
                return funcName + '(' + argNames.join(',') + ')';
            },
            MemberExpression: function(node) {
                var name = [node.property.name];
                function objectName(obj) {
                    name.push(module.exports.identify(obj));
                }
                objectName(node.object);
                return name.reverse().join('.');
            },
            ObjectExpression: function(node) {
                return node.properties;
            },
            Literal: function(node) {
                return node.value;
            },
            Identifier: function(node) {
                return node.name;
            },
            EmptyStatement: function(node) {
                return '';
            }
        };

        var identifier = statements[statement.type];
        if ( identifier ) {
            return identifier(statement);
        }else {
            this.logger.warn("No identifier found for :\n" + statement);
            return '';
        }

    },

    logger: {

        warn: function(msg) {
            console.log("WARN   :  ".red + msg);
        }
    },

    fs : (function() {
        var sysfs = require('fs');
        var path = require('path');
        var pathSeparatorRe = /[\/\\]/g;

        return  {

            dirname: function(filepath) {
                return path.dirname(filepath);
            },
            mkpath : function(dirname, filename) {
                return [dirname, filename].join(path.sep);
            },
            mkdir : function(dirpath, mode) {
                if ( mode == null ) {
                    mode = parseInt('0777',8) & (~process.umask());
                }
                dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
                    parts += part + '/';
                    var subpath = path.resolve(parts);
                    if ( !sysfs.existsSync(subpath)) {
                        sysfs.mkdirSync(subpath, mode);
                    }
                    return parts;

                }, '');

            },
            read: function(filepath, encoder) {
                return encoder.in.convert(sysfs.readFileSync(filepath));
            },
            write: function(filepath, contents, encoder) {
                sysfs.writeFileSync(filepath,os.lfcr(encoder.out.convert(contents)));
            }
        }

    }()),

    jsdoc : (function(){
        var doctrine = require('doctrine')
        var parser = {
            file : function( comments ) {
                var fileTag = {};
                for ( var key in comments) {
                    var comment = comments[key];
                    var data = doctrine.parse(comment.value,{unwrap: true});
                    data.tags.forEach(function(tag) {
                        if (tag.title === 'file')
                            fileTag = tag;
                    });
                }

                return fileTag;
            }
        };
        return parser;
    }())

};
