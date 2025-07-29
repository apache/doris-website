---
{
    "title": "JSON_OBJECT",
    "language": "en"
}
---

## json_object
### Description
#### Syntax

`VARCHAR json_object(VARCHAR,...)`


Generate a json object containing the specified Key-Value,
an exception error is returned when Key is NULL or the number of parameters are odd.

### example

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
