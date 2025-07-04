---
{
    "title": "TIME_TO_SEC",
    "language": "zh-CN"
}
---

## time_to_sec
## 描述
## 语法

`INT time_to_sec(TIME datetime)`

参数为Datetime类型
将指定的时间值转为秒数，即返回结果为：小时×3600 + 分钟×60 + 秒。

## 举例

```
mysql >select current_time(),time_to_sec(current_time());
+----------------+-----------------------------+
| current_time() | time_to_sec(current_time()) |
+----------------+-----------------------------+
| 16:32:18       |                       59538 |
+----------------+-----------------------------+
1 row in set (0.01 sec)
```
### keywords
    TIME_TO_SEC
