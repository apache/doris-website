---
{
    "title": "MILLISECONDS_SUB",
    "language": "zh-CN"
}
---

## milliseconds_sub
## 描述
## 语法

`DATETIMEV2 milliseconds_sub(DATETIMEV2 basetime, INT delta)`
- basetime: DATETIMEV2 类型起始时间
- delta: 从 basetime 起需要扣减的毫秒数
- 返回类型为 DATETIMEV2

## 举例
```
mysql> select milliseconds_sub('2023-09-08 16:02:08.435123', 1);
+--------------------------------------------------------------------------+
| milliseconds_sub(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.434123                                               |
+--------------------------------------------------------------------------+
1 row in set (0.11 sec)
```


### keywords
    milliseconds_sub

    