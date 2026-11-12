---
{
    "title": "MILLISECONDS_ADD",
    "language": "zh-CN"
}
---

## milliseconds_add
## 描述
## 语法

`DATETIMEV2 milliseconds_add(DATETIMEV2 basetime, INT delta)`
- basetime: DATETIMEV2 类型起始时间
- delta: 从 basetime 起需要相加的毫秒数
- 返回类型为 DATETIMEV2

## 举例
```
mysql> select milliseconds_add('2023-09-08 16:02:08.435123', 1);
+--------------------------------------------------------------------------+
| milliseconds_add(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.436123                                               |
+--------------------------------------------------------------------------+
1 row in set (0.04 sec)
```


### keywords
    milliseconds_add

    