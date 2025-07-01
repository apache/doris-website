---
{
    "title": "JSON_ARRAY",
    "language": "en"
}
---

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
[`Nullable(JSON)`](../../../basic-element/sql-data-types/semi-structured/JSON.md): Returns a JSON array composed of the parameter list.

## Usage Notes
- JSON_ARRAY implementation converts different types of parameters to JSON values by implicitly calling the `TO_JSON` function, so parameters must be types supported by `TO_JSON`
- NULL will be converted to JSON null. If you don't want to retain null values in the array, you can use the function `JSON_ARRAY_IGNORE_NULL`.
- If the parameter type is not supported by `TO_JSON`, you will get an error. You can first convert that parameter to String type, for example:
    ```sql
    select JSON_ARRAY(CAST(SOME_UNSUPPORTED_TYPE as String));
    ```
- If the parameter is a JSON string and you want to add it to the array as a JSON object, you should explicitly call the `JSON_PARSE` function to parse it as a JSON object:
  ```sql
  select JSON_ARRAY(JSON_PARSE('{"key": "value"}'));
  ```


## Examples
1. Single parameter
    ```sql
    select json_array('item1');
    ```
    ```
    +---------------------+
    | json_array('item1') |
    +---------------------+
    | ["item1"]           |
    +---------------------+
    ```
2. NULL parameter
    ```sql
    select json_array(null);
    ```
    ```
    +------------------+
    | json_array(null) |
    +------------------+
    | [null]           |
    +------------------+
    ```
3. Multiple parameters
    ```sql
    select json_array('item1', null, {"key": "map value"}, 123.3333, now(), 'duplicated', 'duplicated');
    ```
    ```
    +----------------------------------------------------------------------------------------------+
    | json_array('item1', null, {"key": "map value"}, 123.3333, now(), 'duplicated', 'duplicated') |
    +----------------------------------------------------------------------------------------------+
    | ["item1",null,{"key":"map value"},123.3333,"2025-06-03 15:39:09","duplicated","duplicated"]  |
    +----------------------------------------------------------------------------------------------+
    ```
    > Parameters support any type and duplicate values are allowed.
4. No parameters
    ```sql
    select json_array();
    ```
    ```
    +--------------+
    | json_array() |
    +--------------+
    | []           |
    +--------------+
    ```
5. Semi-structured data types that cannot be converted to JSON
    ```sql
    select json_array('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = cannot cast MAP<TINYINT,VARCHAR(3)> to JSON
    ```

