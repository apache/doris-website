---
{
    "title": "JSON_QUOTE",
    "language": "en",
    "description": "Surrounds the input string parameter with double quotes and escapes special characters and control characters in the string."
}
---

## Description
Surrounds the input string parameter with double quotes and escapes special characters and control characters in the string. The main purpose of this function is to convert strings into valid JSON strings.

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
JSON_QUOTE (<str>)
```

## Parameters
`<str>` String type, the value to be quoted.

## Return Value
Returns a string enclosed in double quotes

## Usage Notes
- If the parameter is NULL, returns NULL.
- If the parameter contains escape symbol (`\`) + non-escape character, the escape symbol will be removed, see examples 4 and 5.

## Examples
1. Double quotes are escaped
    ```sql
    select json_quote('I am a "string" that contains double quotes.');
    ```
    ```
    +------------------------------------------------------------+
    | json_quote('I am a "string" that contains double quotes.') |
    +------------------------------------------------------------+
    | "I am a \"string\" that contains double quotes."           |
    +------------------------------------------------------------+
    ```
2. Escaping special characters
    ```sql
    select json_quote("\\ \b \n \r \t");
    ```
    ```
    +------------------------------+
    | json_quote("\\ \b \n \r \t") |
    +------------------------------+
    | "\\ \b \n \r \t"             |
    +------------------------------+
    ```

3. Control character escaping
    ```sql
    select json_quote("\0");
    ```
    ```
    +------------------+
    | json_quote("\0") |
    +------------------+
    | "\u0000"         |
    +------------------+
    ```

4. Escape symbol + non-escape character case
    ```sql
    select json_quote("\a");
    ```
    ```
    +------------------+
    | json_quote("\a") |
    +------------------+
    | "a"              |
    +------------------+
    ```
5. Non-zero unprintable characters
    ```sql
    select json_quote("\1");
    ```
    ```
    +------------------+
    | json_quote("\1") |
    +------------------+
    | "1"              |
    +------------------+
    ```