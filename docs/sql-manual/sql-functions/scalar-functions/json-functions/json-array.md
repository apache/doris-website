---
{
    "title": "JSON_ARRAY",
    "language": "en"
}
---

# JSON_ARRAY
## Description
Generate a JSON array containing the specified elements. Returns an empty array when no parameters are passed.

## Syntax
```sql
JSON_ARRAY([<expression>, ...]) 
```

## Parameters
### Variable parameters:
- `<expression>`: Elements to be included in the JSON array. Can be single or multiple values of different types, including NULL.

## Return Value
[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): Returns a JSON array composed of the parameter list.

## Usage Notes
- JSON_ARRAY implementation converts different types of parameters to JSON values by implicitly calling the [`TO_JSON`](./to-json.md) function, so parameters must be types supported by [`TO_JSON`](./to-json.md)
- NULL will be converted to JSON null. If you don't want to retain null values in the array, you can use the function [`JSON_ARRAY_IGNORE_NULL`](./json-array-ignore-null.md).
- If the parameter type is not supported by [`TO_JSON`](./to-json.md), you will get an error. You can first convert that parameter to String type, for example:
    ```sql
    select JSON_ARRAY(CAST(NOW() as String));
    ```
    > The NOW() function returns a DateTime type, which needs to be converted to String type using the CAST function
- If the parameter is a JSON string and you want to add it to the array as a JSON object, you should explicitly call the [`JSON_PARSE`](./json-parse.md) function to parse it as a JSON object:
  ```sql
  select JSON_ARRAY(JSON_PARSE('{"key": "value"}'));
  ```

## Examples
1. Regular parameters
    ```sql
    select json_array() as empty_array, json_array(1) v1, json_array(1, 'abc') v2;
    ```
    ```
    +-------------+------+-----------+
    | empty_array | v1   | v2        |
    +-------------+------+-----------+
    | []          | [1]  | [1,"abc"] |
    +-------------+------+-----------+
    ```
2. NULL parameters
    ```sql
    select json_array(null) v1, json_array(1, null, 'I am a string') v2;
    ```
    ```
    +--------+--------------------------+
    | v1     | v2                       |
    +--------+--------------------------+
    | [null] | [1,null,"I am a string"] |
    +--------+--------------------------+
    ```
3. Unsupported parameter types
    ```sql
    select json_array('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<TINYINT,VARCHAR(3)>)
    ```
4. Map type parameters can be explicitly converted to JSON
    ```sql
    select json_array(1, cast(map('key', 'value') as json));
    ```
    ```
    +--------------------------------------------------+
    | json_array(1, cast(map('key', 'value') as json)) |
    +--------------------------------------------------+
    | [1,{"key":"value"}]                              |
    +--------------------------------------------------+
    ```
5. The JSON string will be added to the array in the form of a string
    ```sql
    select json_array('{"key1": "value", "key2": [1, "I am a string", 3]}');
    ```
    ```
    +------------------------------------------------------------------+
    | json_array('{"key1": "value", "key2": [1, "I am a string", 3]}') |
    +------------------------------------------------------------------+
    | ["{\"key1\": \"value\", \"key2\": [1, \"I am a string\", 3]}"]   |
    +------------------------------------------------------------------+
    ```
6. A JSON string can be parsed using `json_parse` and then passed to `json_array`
    ```sql
    select json_array(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}'));
    ```
    ```
    +------------------------------------------------------------------------------+
    | json_array(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}')) |
    +------------------------------------------------------------------------------+
    | [{"key1":"value","key2":[1,"I am a string",3]}]                              |
    +------------------------------------------------------------------------------+
    ```