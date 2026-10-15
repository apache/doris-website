---
{
    "title": "JSON_UNQUOTE",
    "language": "ja",
    "description": "JSON 値の引用符を取り除き、文字列として返します。パラメータが NULL の場合は NULL を返します。"
}
---

## 説明
JSON 値の引用符を取り除き、文字列として返します。パラメータが NULL の場合は NULL を返します。

特殊文字は次のとおりです。
* 二重引用符 (`"`)
* バックスラッシュ (`\`)
* バックスペース (`\b`)
* 改行 (`\n`)
* キャリッジリターン (`\r`)
* 水平タブ (`\t`)

制御文字の例:
* `CHAR(0)` は `\u0000` にエスケープされます。


## 構文
```sql
JSON_UNQUOTE (<str>)
```

## パラメータ
- `<str>`: 引用符を取り除く文字列です。

## 戻り値
文字列を返します。特殊な場合は次のとおりです。
* 入力が NULL の場合は NULL を返します。
* 入力が二重引用符で囲まれていない場合は、その値をそのまま返します。
* 入力が文字列でない場合は、自動的に文字列へ変換して、その値を返します。

## 例
1. 文字列内のエスケープ文字を取り除く
    ```sql
    select json_unquote('"I am a \\"string\\" that contains double quotes."');
    ```
    ```
    +--------------------------------------------------------------------+
    | json_unquote('"I am a \\"string\\" that contains double quotes."') |
    +--------------------------------------------------------------------+
    | I am a "string" that contains double quotes.                       |
    +--------------------------------------------------------------------+
    ```
2. 特殊文字のエスケープを解除する
    ```sql
    select json_unquote('"\\\\ \\b \\n \\r \\t"');
    ```
    ```
    +----------------------------------------+
    | json_unquote('"\\\\ \\b \\n \\r \\t"') |
    +----------------------------------------+
    | \ 
                                        |
    +----------------------------------------+
    ```
    > エスケープ文字が取り除かれるため、改行、バックスペース、タブなどの空白文字が表示されます。
3. 制御文字のエスケープを解除する
    ```sql
    select json_unquote('"\\u0000"');
    ```
    ```
    +---------------------------+
    | json_unquote('"\\u0000"') |
    +---------------------------+
    |                           |
    +---------------------------+
    ```
4. 無効な JSON 文字列
    ```sql
    select json_unquote('"I am a "string" that contains double quotes."');
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [RUNTIME_ERROR]Invalid JSON text in argument 1 to function json_unquote: "I am a "string" that contains double quotes."
    ```
5. 先頭は引用符で始まるが、末尾に引用符がない場合
    ```sql
    select json_unquote('"I am a "string" that contains double quotes.');
    ```
    ```
    +---------------------------------------------------------------+
    | json_unquote('"I am a "string" that contains double quotes.') |
    +---------------------------------------------------------------+
    | "I am a "string" that contains double quotes.                 |
    +---------------------------------------------------------------+
    ```
6. 末尾に引用符がある場合
    ```sql
    select json_unquote('I am a "string" that contains double quotes."');
    ```
    ```
    +---------------------------------------------------------------+
    | json_unquote('I am a "string" that contains double quotes."') |
    +---------------------------------------------------------------+
    | I am a "string" that contains double quotes."                 |
    +---------------------------------------------------------------+
    ```