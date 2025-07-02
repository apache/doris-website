---
{
    "title": "JSON_EXTRACT",
    "language": "en"
}
---

## json_extract

### description

#### Syntax

`VARCHAR json_extract(VARCHAR json_str, VARCHAR path[, VARCHAR path] ...))`

`json_extract` function returns data from a JSON document, selected from the parts of the document matched by the `path` arguments. Returns NULL if any argument is NULL or if the `json_str` argument is not a valid JSON document. If the `path` parameter is not a valid path (that is, the path does not appear in the JSON document), the corresponding item in the returned array is NULL (see example below)

### example

```
mysql> SELECT json_extract('{"id": 123, "name": "doris"}', '$.id');
+------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.id') |
+------------------------------------------------------+
| 123                                                  |
+------------------------------------------------------+
1 row in set (0.01 sec)

mysql> SELECT json_extract('[1, 2, 3]', '$.[1]');
+------------------------------------+
| json_extract('[1, 2, 3]', '$.[1]') |
+------------------------------------+
| 2                                  |
+------------------------------------+
1 row in set (0.01 sec)

mysql> SELECT json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]');
+-------------------------------------------------------------------------------------------------------------------+
| json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]') |
+-------------------------------------------------------------------------------------------------------------------+
| ["v1",6.6,[1,2],2]                                                                                                |
+-------------------------------------------------------------------------------------------------------------------+
1 row in set (0.01 sec)

mysql> SELECT json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name');
+-----------------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name') |
+-----------------------------------------------------------------+
| [null,"doris"]                                                  |
+-----------------------------------------------------------------+
1 row in set (0.01 sec)
```

### keywords
JSON, EXTRACT, JSON_EXTRACT