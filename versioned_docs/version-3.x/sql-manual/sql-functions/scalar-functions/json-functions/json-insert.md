---
{
    "title": "JSON_INSERT",
    "language": "en"
}
---

## Description
The JSON_INSERT function is used to insert data into JSON and return the result.


## Syntax
```sql
JSON_INSERT (<json_str>, <path>,  <val>[, <path>,  <val>, ...])
```

## Parameters
| Parameter          | Description                                                                                                                             |
|-------------|--------------------------------------------------------------------------------------------------------------------------------|
| `<json_str>` | The JSON object to be inserted. It can be a JSON object with elements of any type, including NULL. If no elements are specified, an empty array is returned. If json_str is not a valid JSON or any path parameter is not a valid path expression or contains a * wildcard, an error is returned. |
| `<path>` | The JSON path to be inserted. If it is NULL, then return NULL.                                                                                             |
| `<val>`        | The value to be inserted into the JSON. If it is NULL, then a NULL value will be inserted at the corresponding position.                                                                           |

`json_insert` function inserts data in a JSON and returns the result.Returns NULL if `json_str` or `path` is NULL. Otherwise, an error occurs if the `json_str` argument is not a valid JSON or any path argument is not a valid path expression or contains a * wildcard.

The path-value pairs are evaluated left to right.

A path-value pair for a nonexisting path in the json adds the value to the json if the path identifies one of these types of values:

* A member not present in an existing object. The member is added to the object and associated with the new value.

* A position past the end of an existing array. The array is extended with the new value. If the existing value is not an array, it is autowrapped as an array, then extended with the new value.

Otherwise, a path-value pair for a nonexisting path in the json is ignored and has no effect.

## Return Values
Returns a JSON value.

### Examples

```sql
select json_insert(null, null, null);
```
```text
+---------------------------------+
| json_insert(NULL, NULL, 'NULL') |
+---------------------------------+
| NULL                            |
+---------------------------------+
```
```sql
select json_insert('{"k": 1}', "$.k", 2);
```
```text
+---------------------------------------+
| json_insert('{\"k\": 1}', '$.k', '2') |
+---------------------------------------+
| {"k":1}                               |
+---------------------------------------+
```
```sql
select json_insert('{"k": 1}', "$.j", 2);
```
```text
+---------------------------------------+
| json_insert('{\"k\": 1}', '$.j', '2') |
+---------------------------------------+
| {"k":1,"j":2}                         |
+---------------------------------------+
```
```sql
select json_insert('{"k": 1}', "$.j", null);
```
```text
+-----------------------------------------------+
| json_insert('{"k": 1}', '$.j', 'NULL', '660') |
+-----------------------------------------------+
| {"k":1,"j":null}                              |
+-----------------------------------------------+
```
