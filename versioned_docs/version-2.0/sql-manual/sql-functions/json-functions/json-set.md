---
{
    "title": "JSON_SET",
    "language": "en"
}
---

## json_set

 

### Description
#### Syntax

`VARCHAR json_set(VARCHAR json_str, VARCHAR path, VARCHAR val[, VARCHAR path, VARCHAR val] ...)`


`json_set` function inserts or updates data in a JSON and returns the result.Returns NULL if `json_str` or `path` is NULL. Otherwise, an error occurs if the `json_str` argument is not a valid JSON or any path argument is not a valid path expression or contains a * wildcard.

The path-value pairs are evaluated left to right.

A path-value pair for an existing path in the json overwrites the existing json value with the new value. A path-value pair for a nonexisting path in the json adds the value to the json if the path identifies one of these types of values:

* A member not present in an existing object. The member is added to the object and associated with the new value.

* A position past the end of an existing array. The array is extended with the new value. If the existing value is not an array, it is autowrapped as an array, then extended with the new value.

Otherwise, a path-value pair for a nonexisting path in the json is ignored and has no effect.

### example

```
MySQL> select json_set(null, null, null);
+------------------------------+
| json_set(NULL, NULL, 'NULL') |
+------------------------------+
| NULL                         |
+------------------------------+

MySQL> select json_set('{"k": 1}', "$.k", 2);
+------------------------------------+
| json_set('{\"k\": 1}', '$.k', '2') |
+------------------------------------+
| {"k":2}                            |
+------------------------------------+

MySQL> select json_set('{"k": 1}', "$.j", 2);
+------------------------------------+
| json_set('{\"k\": 1}', '$.j', '2') |
+------------------------------------+
| {"k":1,"j":2}                      |
+------------------------------------+
```

### keywords
JSON, json_set
