---
{
"title": "JSON_CONTAINS",
"language": "en"
}
---

## json_contains
### description
#### Syntax

`BOOLEAN json_contains(JSON json_str, JSON candidate)`
`BOOLEAN json_contains(JSON json_str, JSON candidate, VARCHAR json_path)`
`BOOLEAN json_contains(VARCHAR json_str, VARCHAR candidate, VARCHAR json_path)`


Indicates by returning 1 or 0 whether a given candidate JSON document is contained at a specific path within the json_str JSON document

### example

```
mysql> SET @j = '{"a": 1, "b": 2, "c": {"d": 4}}';
mysql> SET @j2 = '1';
mysql> SELECT JSON_CONTAINS(@j, @j2, '$.a');
+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.a') |
+-------------------------------+
|                             1 |
+-------------------------------+
mysql> SELECT JSON_CONTAINS(@j, @j2, '$.b');
+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.b') |
+-------------------------------+
|                             0 |
+-------------------------------+

mysql> SET @j2 = '{"d": 4}';
mysql> SELECT JSON_CONTAINS(@j, @j2, '$.a');
+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.a') |
+-------------------------------+
|                             0 |
+-------------------------------+
mysql> SELECT JSON_CONTAINS(@j, @j2, '$.c');
+-------------------------------+
| JSON_CONTAINS(@j, @j2, '$.c') |
+-------------------------------+
|                             1 |
+-------------------------------+

mysql> SELECT json_contains('[1, 2, {"x": 3}]', '1');
+----------------------------------------+
| json_contains('[1, 2, {"x": 3}]', '1') |
+----------------------------------------+
|                                      1 |
+----------------------------------------+
1 row in set (0.04 sec)
```
### keywords
json,json_contains
