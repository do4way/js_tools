ASTをベースにしたJavascriptソースファイル変換ツール
----

## ツールのインストール

下記のコマンドでパッケージをインストールします。
```
git clone git@github.com:do4way/js_tools.git
cd js_tools
npm install
```

**ヘルプ表示**
コマンドに-h, または-helpにつけると、下記のように、コマンドのヘルプが表示されます。

```
$ ./js_tools.js -h
Usage: js_tools.js command [options]
    command := [split|concat|refine]
    options := [split_options|concat_options|refine_options]
        split_options  := input_file1... -o output_directory --encoding=file_encoding
        concat_options := input_file1... -o output_filename  --encoding=file_encoding
        refine_options := input_file1... -o output_directory --encoding=file_encoding
        file_encoding := [sjis|cp932|euc-jp|iso-8859-1|utf8]
        default file_encoding is utf8
```

Windows プラットフォームで実行する場合に、下記のようにnodeコマンドを付ける必要があります。

```
node js_tools.js -h
```

## Javascriptのソース変換コマンド

### split

１つJavascriptファイルをコメントに書かれている@fileタグに記述されている
ファイル名に分割し、出力します。

使用例：
```
$ ./js_tools.js split examples/ex03.js -o outs
WARN   :  Not found expected comment block for the statement( type:VariableDeclaration, identify : g_o1 )
```
コメントやもしくは、コメントブロックに@fileタグが見つからない場合に、警告
として、そのノードタイプ及び名称を表示するようにしています。

出力されたOutsファオルダーに下記のファイルが出力されます。

```
$ tree outs
outs
├── applet.js
├── dom.js
├── global.js
└── image.js
```

また、ファイルデフォルトEncodingはUTF-8としますが、それ以外文字列を使用
する際に、--encoding=sjisように指定することも可能です。


### concat

複数javascriptファイルを指定順に１つファイルにまとめる機能です。

使用例：
```
./js_tools.js concat outs/applet.js outs/dom.js outs/global.js outs/image.js -o outs/ex03_concated.js
```


### refine

指定されたJavascriptファイルを名前のアルファベット順にソートして、ソートされた
ファイルを書き出す機能です。

使用例：
```
./js_tools.js refine examples/ex03.js outs/ex03_concated.js -o outs
```

出力：
```
$ tree outs
outs
├── examples
│   └── ex03.js
└── outs
    └── ex03_concated.js
```

diffコマンドを利用して、出力される二つファイルを比較してみると
```
$ diff outs/examples/ex03.js outs/outs/ex03_concated.js
15d14
< var g_o1 = 'some global definition';
```
ファイルを分割する際に、@fileタグを記述していないため、１つのステーテメントを分割、連結
の操作により１行が欠落することを検出可能です。
