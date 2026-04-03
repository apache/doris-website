---
{
  "title": "JSON_UNQUOTE",
  "description": "この関数はJSON値から引用符を削除し、結果を文字列として返します。パラメータがNULLの場合、NULLを返します。",
  "language": "ja"
}
---
## 説明
この関数はJSON値からクオートを削除し、結果を文字列として返します。パラメータがNULLの場合、NULLを返します。

特殊文字には以下が含まれます：
* クオート（`"`）
* バックスラッシュ（`\`）
* バックスペース（`\b`）
* 改行（`\n`）
* キャリッジリターン（`\r`）
* 水平タブ（`\t`）

制御文字には以下が含まれます：
* `CHAR(0)`は`\u0000`としてエスケープされます


## 構文

```sql
JSON_UNQUOTE (<str>)
```
## パラメータ
- `<str>` クォートを削除する対象の文字列。

## 戻り値
文字列を返します。特殊なケースは以下の通りです：
* 入力パラメータがNULLの場合、NULLを返します。
* 入力パラメータがダブルクォートで囲まれた値でない場合、値自体を返します。
* 入力パラメータが文字列でない場合、自動的に文字列に変換されてから値自体を返します。

## 例
1. 文字列内のエスケープ文字が削除されます

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
2. 特殊文字のエスケープ

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
> エスケープ文字が削除されるため、一部の空白文字（改行、バックスペース、タブなど）が出力されます
3. 制御文字のエスケープ

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
4. 無効なJSON文字列

    ```sql
    select json_unquote('"I am a "string" that contains double quotes."');
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [RUNTIME_ERROR]Invalid JSON text in argument 1 to function json_unquote: "I am a "string" that contains double quotes."
    ```
5. 引用符で始まるが引用符で終わらないケース

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
6. クォートで終わる場合

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
