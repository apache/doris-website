---
{
    "title": "JSON_UNQUOTE",
    "language": "zh-CN",
    "description": "这个函数将去掉 JSON 值中的引号，并将结果作为字符串返回。如果参数为 NULL，则返回 NULL。"
}
---

## 描述
这个函数将去掉 JSON 值中的引号，并将结果作为字符串返回。如果参数为 NULL，则返回 NULL。

特殊字符包括：
* 引号 (`"`)
* 反斜杠 (`\`)
* Backspace	(`\b`)
* 换行 (`\n`)
* 回车 (`\r`)
* 水平制表符 (`\t`)

控制字符包括：
* `CHAR(0)` 被转义为 `\u0000`


## 语法
```sql
JSON_UNQUOTE (<str>)
```

## 参数
- `<str>` 要去除引号的字符串。

## 返回值
返回一个字符串。特殊情况如下：
* 如果传入的参数为 NULL，返回 NULL。
* 如果传入的参数不是一个带有双引号的值，则会返回值本身。
* 如果传入的参数不是一个字符串，则会被自动转换为字符串后，返回值本身。

## 举例
1. 字符串中的转义字符会被去掉
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
2. 特殊字符的转义
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
    > 因为转义字符被去掉，所以会打印一些空白的字符（换行、退格、制表符等）
3. 控制字符字符转义
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
4. 非法的 json 字符串
    ```sql
    select json_unquote('"I am a "string" that contains double quotes."');
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [RUNTIME_ERROR]Invalid JSON text in argument 1 to function json_unquote: "I am a "string" that contains double quotes."
    ```
5. 以引号开始但没有以引号结尾的情况
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
6. 以引号结尾的情况
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