---
{
    "title": "JSON_REPLACE",
    "language": "en"
}
---

## json_replace

 

### Description
#### Syntax

`VARCHAR json_replace(VARCHAR json_str, VARCHAR path, VARCHAR val[, VARCHAR path, VARCHAR val] ...)`


`json_replace` function updates data in a JSON and returns the result.Returns NULL if `json_str` or `path` is NULL. Otherwise, an error occurs if the `json_str` argument is not a valid JSON or any path argument is not a valid path expression or contains a * wildcard.

The path-value pairs are evaluated left to right.

A path-value pair for an existing path in the json overwrites the existing json value with the new value.

Otherwise, a path-value pair for a nonexisting path in the json is ignored and has no effect.

### example

```
MySQL> select json_replace(null, null, null);
+----------------------------------+
| json_replace(NULL, NULL, 'NULL') |
+----------------------------------+
| NULL                             |
+----------------------------------+

MySQL> select json_replace('{"k": 1}', "$.k", 2);
+----------------------------------------+
| json_replace('{\"k\": 1}', '$.k', '2') |
+----------------------------------------+
| {"k":2}                                |
+----------------------------------------+

MySQL> select json_replace('{"k": 1}', "$.j", 2);
+----------------------------------------+
| json_replace('{\"k\": 1}', '$.j', '2') |
+----------------------------------------+
| {"k":1}                                |
+----------------------------------------+
```

### keywords
JSON, json_replace
