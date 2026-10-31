---
{
    "title": "JSON_TYPE",
    "language": "en",
    "description": "Used to determine the type of the field specified by jsonpath in the JSONB data. If the field does not exist, it returns NULL. If the field exists,"
}
---

## Description

Used to determine the type of the field specified by `json_path` in the JSONB data. If the field does not exist, it returns NULL. If the field exists, it returns one of the following types:

- object
- array
- null
- bool
- int
- bigint
- largeint
- double
- string

## Syntax

```sql
JSON_TYPE( <json>, <json_path> )
```

## Alias

- JSONB_TYPE

## Required Parameters


| Parameter | Description |
|------|------|
| `<json>` | The JSON string to check the type of. |
| `<json_path>` | JSON path, which specifies the location of the field in JSON. The path is usually given in $. At the beginning, use. to represent the hierarchical structure. |


## Return Value
Returns the type of the JSON string. Possible values include:
- "NULL": Indicates that the value in the JSON document is null.
- "BOOLEAN": Indicates that the value in the JSON document is of boolean type (true or false).
- "NUMBER": Indicates that the value in the JSON document is a number.
- "STRING": Indicates that the value in the JSON document is a string.
- "OBJECT": Indicates that the value in the JSON document is a JSON object.
- "ARRAY": Indicates that the value in the JSON document is a JSON array.

## Usage Notes

JSON_TYPE returns the type of the outermost value in the JSON document. If the JSON document contains multiple different types of values, it will return the type of the outermost value. For invalid JSON strings, JSON_TYPE returns NULL. Refer to [json tutorial](../../../basic-element/sql-data-types/semi-structured/JSON)

## Examples
1. JSON is of string type:

```sql
SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.name');
```

```sql
+-------------------------------------------------------------------+
| jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.name') |
+-------------------------------------------------------------------+
| string                                                            |
+-------------------------------------------------------------------+
```

2. JSON is of number type:

```sql
SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.age');
```

```sql
+------------------------------------------------------------------+
| jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.age') |
+------------------------------------------------------------------+
| int                                                              |
+------------------------------------------------------------------+
```

