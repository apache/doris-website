---
{
    "title": "JSON_OBJECT",
    "language": "zh-CN"
}
---

## json_object
## 描述
## 语法

`VARCHAR json_object(VARCHAR,...)`


生成一个包含指定Key-Value对的json object, 当Key值为NULL或者传入参数为奇数个时，返回异常错误

## 举例

```
MySQL> select json_object();
+---------------+
| json_object() |
+---------------+
| {}            |
+---------------+

MySQL> select json_object('time',curtime());
+--------------------------------+
| json_object('time', curtime()) |
+--------------------------------+
| {"time": "10:49:18"}           |
+--------------------------------+


MySQL> SELECT json_object('id', 87, 'name', 'carrot');
+-----------------------------------------+
| json_object('id', 87, 'name', 'carrot') |
+-----------------------------------------+
| {"id": 87, "name": "carrot"}            |
+-----------------------------------------+


MySQL> select json_object('username',null);
+---------------------------------+
| json_object('username', 'NULL') |
+---------------------------------+
| {"username": NULL}              |
+---------------------------------+
```
### keywords
json,object,json_object
