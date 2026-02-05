---
{
    "title": "GET_JSON_DOUBLE",
    "language": "en",
    "description": "Function is used to extract the value of a field from a JSON document and convert it to the DOUBLE type."
}
---

## Description

Function is used to extract the value of a field from a JSON document and convert it to the DOUBLE type. This function returns the value of the field on the specified path, or returns NULL if the value cannot be converted to type DOUBLE or the field pointed to by the path does not exist.

## Syntax

```sql
GET_JSON_DOUBLE( <json_str>, <json_path>)
```

## Required Parameters

| parameters| described|
|------|------|
| `<json_str>`| The JSON string from which to extract data is needed. |
| `<json_path>`| JSON path, specifying the location of the field. Paths can be denoted in dot notation. |

## Return Value

- Returns the DOUBLE value of the field pointed to by the path.
- Returns NULL if no corresponding field is found in the specified path, or the field value cannot be converted to type DOUBLE.

## Usage Notes

Parses and obtains the floating point content of the specified path within the json string.
Where `<json_path>` `must start with the $symbol and use. As a path splitter. If the path contains. , you can use double quotes to enclose it.
Use [ ] to represent the array index, starting from 0.
The content of path cannot contain ", [and].
Returns NULL if `<json_str>` is incorrectly formatted, or json_path is incorrectly formatted, or a match cannot be found.
In addition, it is recommended to use the jsonb type and the jsonb_extract_XXX function to achieve the same functionality.
Special circumstances will be handled as follows:
- Returns NULL if the field specified by json_path does not exist in JSON
- If the actual type of the field specified by json_path in JSON is inconsistent with the type specified by json_extract_t, the specified type t is returned if it can be losslessly converted to the specified type, and NULL is returned if it cannot.

## Examples

1. Get the value with key as "k1"

```sql
SELECT get_json_double('{"k1":1.3, "k2":"2"}', "$.k1");
```

```sql
+-------------------------------------------------+
| get_json_double('{"k1":1.3, "k2":"2"}', '$.k1') |
+-------------------------------------------------+
|                                             1.3 |
+-------------------------------------------------+
```
2. Gets the second element in the array with key "my.key"

```sql
SELECT get_json_double('{"k1":"v1", "my.key":[1.1, 2.2, 3.3]}', '$. "my.key"[1]');
```

```sql
+---------------------------------------------------------------------------+
| get_json_double('{"k1":"v1", "my.key":[1.1, 2.2, 3.3]}', '$."my.key"[1]') |
+---------------------------------------------------------------------------+
|                                                                       2.2 |
+---------------------------------------------------------------------------+
```

3. Gets the first element in an array with secondary path k1.key -&gt; k2
```sql
SELECT get_json_double('{"k1.key":{"k2":[1.1, 2.2]}}', '$."k1.key".k2[0]');
```
```sql
+---------------------------------------------------------------------+
| get_json_double('{"k1.key":{"k2":[1.1, 2.2]}}', '$."k1.key".k2[0]') |
+---------------------------------------------------------------------+
|                                                                 1.1 |
+---------------------------------------------------------------------+
```