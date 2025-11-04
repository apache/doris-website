---
{
    "title": "JSON_UNQUOTE",
    "language": "en"
}
---

## Description
This function removes quotes from JSON values and returns the result as a string. If the parameter is NULL, it returns NULL.

Special characters include:
* Quote (`"`)
* Backslash (`\`)
* Backspace	(`\b`)
* Newline (`\n`)
* Carriage return (`\r`)
* Horizontal tab (`\t`)

Control characters include:
* `CHAR(0)` is escaped as `\u0000`


## Syntax
```sql
JSON_UNQUOTE (<str>)
```

## Parameters
- `<str>` The string from which quotes are to be removed.

## Return Value
Returns a string. Special cases are as follows:
* If the input parameter is NULL, returns NULL.
* If the input parameter is not a value enclosed in double quotes, it returns the value itself.
* If the input parameter is not a string, it will be automatically converted to a string and then return the value itself.

## Examples
1. Escape characters in strings are removed
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
2. Escaping special characters
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
    > Because escape characters are removed, some whitespace characters (newline, backspace, tab, etc.) will be printed
3. Control character escaping
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
4. Invalid JSON string
    ```sql
    select json_unquote('"I am a "string" that contains double quotes."');
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [RUNTIME_ERROR]Invalid JSON text in argument 1 to function json_unquote: "I am a "string" that contains double quotes."
    ```
5. Case where it starts with quotes but doesn't end with quotes
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
6. Case where it ends with quotes
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