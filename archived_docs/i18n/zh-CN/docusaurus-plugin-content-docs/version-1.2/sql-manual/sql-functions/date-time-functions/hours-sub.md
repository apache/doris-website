---
{
    "title": "HOURS_SUB",
    "language": "zh-CN"
}
---

## hours_sub
## 描述
## 语法

`DATETIME HOURS_SUB(DATETIME date, INT hours)`

从日期时间或日期减去指定小时数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型为 DATETIME。

## 举例

```
mysql> select hours_sub("2020-02-02 02:02:02", 1);
+-------------------------------------+
| hours_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-02-02 01:02:02                 |
+-------------------------------------+
```

### keywords

    HOURS_SUB
