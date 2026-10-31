---
{
"title": "JSON_LENGTH",
"language": "zh-CN"
}
---

## json_length
## 描述
## 语法

`INT json_length(JSON json_str)`

`INT json_length(JSON json_str, VARCHAR json_path)`

如果指定path，该JSON_LENGTH()函数返回与 JSON 文档中的路径匹配的数据的长度，否则返回 JSON 文档的长度。该函数根据以下规则计算 JSON 文档的长度：

* 标量的长度为 1。例如: '1', '"x"', 'true', 'false', 'null' 的长度均为 1。
* 数组的长度是数组元素的数量。例如: '[1, 2]' 的长度为2。
* 对象的长度是对象成员的数量。例如: '{"x": 1}' 的长度为1

## 举例

```
mysql> SELECT json_length('{"k1":"v31","k2":300}');
+--------------------------------------+
| json_length('{"k1":"v31","k2":300}') |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
1 row in set (0.26 sec)

mysql> SELECT json_length('"abc"');
+----------------------+
| json_length('"abc"') |
+----------------------+
|                    1 |
+----------------------+
1 row in set (0.17 sec)

mysql> SELECT json_length('{"x": 1, "y": [1, 2]}', '$.y');
+---------------------------------------------+
| json_length('{"x": 1, "y": [1, 2]}', '$.y') |
+---------------------------------------------+
|                                           2 |
+---------------------------------------------+
1 row in set (0.07 sec)
```
### keywords
json,json_length
