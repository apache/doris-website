---
{
    "title": "MICROSECOND",
    "language": "zh-CN"
}
---

## microsecond
## 描述
## 语法

`INT MICROSECOND(DATETIMEV2 date)`


获得日期中的微秒信息。

参数为 Datetime 类型

## 举例

```
mysql> select microsecond(cast('1999-01-02 10:11:12.000123' as datetimev2(6))) as microsecond;
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```
### keywords
    MICROSECOND
