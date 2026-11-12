---
{
    "title": "WEEKS_SUB",
    "language": "zh-CN"
}
---

## weeks_sub
## 描述
## 语法

`DATETIME WEEKS_SUB(DATETIME date, INT weeks)`

从日期时间或日期减去指定星期数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select weeks_sub("2020-02-02 02:02:02", 1);
+-------------------------------------+
| weeks_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-01-26 02:02:02                 |
+-------------------------------------+
```

### keywords

    WEEKS_SUB
