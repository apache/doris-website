---
{
    "title": "JSON_OBJECT",
    "language": "en",
    "description": "Generate one JSON object containing specified Key-Value pairs."
}
---

## Description

Generate one JSON object containing specified Key-Value pairs. Returns an error when the Key value is NULL or when an odd number of parameters is passed.

## Syntax

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```

```sql
JSON_OBJECT(*)
```

## Parameters
### Variable parameters:
- `<key>`: String type
- `<value>`: Multiple types, Doris will automatically convert non-JSON type parameters to JSON type through the [`TO_JSON`](./to-json.md) function.
- `*`: When invoked with an asterisk (wildcard), the OBJECT value is constructed from the specified data using the attribute names as keys and the associated values as values.

    When you pass a wildcard to the function, you can qualify the wildcard with the name or alias for the table. For example, to pass in all of the columns from the table named mytable, specify the following:

    ```sql
    (mytable.*)
    ```

## Notes
- The number of parameters must be even, can be 0 parameters (returns an empty JSON object).
- By convention, the parameter list consists of alternating keys and values.
- Keys are forcibly converted to text according to JSON definition.
- If the passed Key is NULL, returns an exception error.
- Value parameters are converted in a way that can be converted to JSON, must be types supported by [`TO_JSON`](./to-json.md).
- If the passed Value is NULL, the Value in the returned JSON object for that Key-Value pair will be JSON null value.
- If you want to support other types as values, you can use CAST to convert them to JSON/String.
- Doris currently does not deduplicate JSON objects, which means duplicate keys are allowed. However, duplicate keys may cause unexpected results:
    1. Other systems may drop values corresponding to duplicate keys, or report errors.
    2. The result returned by [`JSON_EXTRACT`](./json-extract.md) is uncertain.

## Return Value

[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): Returns a JSON object composed of the parameter list.

## Examples
1. Case with no parameters
    ```sql
    select json_object();
    ```
    ```text
    +---------------+
    | json_object() |
    +---------------+
    | {}            |
    +---------------+
    ```
2. Unsupported value types 
    ```sql
    select json_object('time',curtime());
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(TIMEV2(0))
    ```
    Can be converted to String through cast
    ```sql
    select json_object('time', cast(curtime() as string));
    ```
    ```text
    +------------------------------------------------+
    | json_object('time', cast(curtime() as string)) |
    +------------------------------------------------+
    | {"time":"17:09:42"}                            |
    +------------------------------------------------+
    ```
3. Non-String type keys will be converted to String
    ```sql
    SELECT json_object(123, 456);
    ```
    ```text
    +-----------------------+
    | json_object(123, 456) |
    +-----------------------+
    | {"123":456}           |
    +-----------------------+
    ```
4. Null cannot be used as key
    ```sql
    select json_object(null, 456);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL, 456)
    ```
    Null can be used as value
    ```sql
    select json_object('key', null);
    ```
    ```text
    +--------------------------+
    | json_object('key', null) |
    +--------------------------+
    | {"key":null}             |
    +--------------------------+
    ```

5. JSON strings can be parsed into JSON objects via [`JSON_PARSE`](./json-parse.md) before being passed to `JSON_OBJECT`
    ```sql
    select json_object(123, json_parse('{"key": "value"}'));
    ```
    ```text
    +--------------------------------------------------+
    | json_object(123, json_parse('{"key": "value"}')) |
    +--------------------------------------------------+
    | {"123":{"key":"value"}}                          |
    +--------------------------------------------------+
    ```
    Otherwise it will be treated as a string
    ```sql
    select json_object(123,'{"key": "value"}');
    ```
    ```text
    +-------------------------------------+
    | json_object(123,'{"key": "value"}') |
    +-------------------------------------+
    | {"123":"{\"key\": \"value\"}"}      |
    +-------------------------------------+
    ```
6. Types not supported by [`TO_JSON`](./to-json.md)
    ```sql
    select json_object('key', map('abc', 'efg'));
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<VARCHAR(3),VARCHAR(3)>)
    ```

    Can be converted to JSON via CAST statement before passing in:
    ```sql
    select json_object('key', cast(map('abc', 'efg') as json));
    ```
    ```text
    +-----------------------------------------------------+
    | json_object('key', cast(map('abc', 'efg') as json)) |
    +-----------------------------------------------------+
    | {"key":{"abc":"efg"}}                               |
    +-----------------------------------------------------+
    ```
7. Case with duplicate keys
    ```sql
    select
        json_object('key', 123, 'key', 4556) v1
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.key') v2
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.*') v3;
    ```
    ```text
    +------------------------+------+------------+
    | v1                     | v2   | v3         |
    +------------------------+------+------------+
    | {"key":123,"key":4556} | 123  | [123,4556] |
    +------------------------+------+------------+
    ```