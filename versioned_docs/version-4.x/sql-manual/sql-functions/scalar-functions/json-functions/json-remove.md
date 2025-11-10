---
{
    "title": "JSON_REMOVE",
    "language": "en"
}
---

## Description
The `JSON_REMOVE` function is used to remove data from a JSON document and return the result.

## Syntax
```sql
JSON_REMOVE (<json_object>, path[, path] ...)
```

## Parameters
- `<json_object>` JSON type expression, the target to be deleted.
- `<path>` String type expression, path parameters are evaluated in left-to-right order. The JSON document produced by evaluating a path becomes the new value for the next path evaluation.

## Return Value
- `Nullable(JSON)` returns the JSON object after deletion.

## Examples
1. Path does not exist
```sql
SELECT JSON_REMOVE('{"a": 1, "b": 2, "c": 3}', '$.d');
```
```text
+------------------------------------------------+
| JSON_REMOVE('{"a": 1, "b": 2, "c": 3}', '$.d') |
+------------------------------------------------+
| {"a":1,"b":2,"c":3}                            |
+------------------------------------------------+
```

2. Remove the value pointed to by `<path>` from the JSON object
```sql
SELECT JSON_REMOVE('{"Name": "Jack", "Gender": "Male", "Age": 20}', '$.Age');
```
```text
+-----------------------------------------------------------------------+
| JSON_REMOVE('{"Name": "Jack", "Gender": "Male", "Age": 20}', '$.Age') |
+-----------------------------------------------------------------------+
| {"Name":"Jack","Gender":"Male"}                                       |
+-----------------------------------------------------------------------+
```

3. Specify multiple paths to delete data from multiple locations in a JSON object
```sql
SELECT JSON_REMOVE('[1, 2, 3, 4, 5]', '$[3]'), JSON_REMOVE('[1, 2, 3, 4, 5]', '$[1]', '$[3]');
```
```text
+----------------------------------------+------------------------------------------------+
| JSON_REMOVE('[1, 2, 3, 4, 5]', '$[3]') | JSON_REMOVE('[1, 2, 3, 4, 5]', '$[1]', '$[3]') |
+----------------------------------------+------------------------------------------------+
| [1,2,3,5]                              | [1,3,4]                                        |
+----------------------------------------+------------------------------------------------+
```

4. Larger JSON object
```sql
SELECT JSON_REMOVE('{"Person": {"Name": "Jack","Age": 20,"Hobbies": ["Eating", "Sleeping", "Base Jumping"]}}', '$.Person.Age', '$.Person.Hobbies[2]');
```
```text
+------------------------------------------------------------------------------------------------------------------------------------------------+
| JSON_REMOVE('{"Person": {"Name": "Jack","Age": 20,"Hobbies": ["Eating", "Sleeping", "Base Jumping"]}}', '$.Person.Age', '$.Person.Hobbies[2]') |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| {"Person":{"Name":"Jack","Hobbies":["Eating","Sleeping"]}}                                                                                     |
+------------------------------------------------------------------------------------------------------------------------------------------------+
```