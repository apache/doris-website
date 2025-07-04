---
{
    "title": "YEARS_SUB",
    "language": "zh-CN"
}
---

## years_sub
## 描述
## 语法

`DATETIME YEARS_SUB(DATETIME date, INT years)`

从日期时间或日期减去指定年数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select years_sub("2020-02-02 02:02:02", 1);
+-------------------------------------+
| years_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2019-02-02 02:02:02                 |
+-------------------------------------+
```

### keywords

    YEARS_SUB
