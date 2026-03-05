---
{
    "title": "MINUTES_SUB",
    "language": "zh-CN"
}
---

## minutes_sub
## 描述
## 语法

`DATETIME MINUTES_SUB(DATETIME date, INT minutes)`

从日期时间或日期减去指定分钟数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型为 DATETIME。

## 举例

```
mysql> select minutes_sub("2020-02-02 02:02:02", 1);
+---------------------------------------+
| minutes_sub('2020-02-02 02:02:02', 1) |
+---------------------------------------+
| 2020-02-02 02:01:02                   |
+---------------------------------------+
```

### keywords

    MINUTES_SUB
