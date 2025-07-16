---
{
    "title": "JSON_REPLACE",
    "language": "zh-CN"
}
---

## json_replace

 

## 描述
## 语法

`VARCHAR json_replace(VARCHAR json_str, VARCHAR path, VARCHAR val[, VARCHAR path, VARCHAR val] ...)`


`json_set` 函数在 JSON 中更新数据并返回结果。如果 `json_str` 或 `path` 为 NULL，则返回 NULL。否则，如果 `json_str` 不是有效的 JSON 或任何 `path` 参数不是有效的路径表达式或包含了 * 通配符，则会返回错误。

路径值对按从左到右的顺序进行评估。

如果 JSON 中已存在某个路径，则路径值对会将现有 JSON 值覆盖为新值。
否则，对于 JSON 中不存在的某个路径的路径值对将被忽略且不会产生任何影响。

## 举例

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
