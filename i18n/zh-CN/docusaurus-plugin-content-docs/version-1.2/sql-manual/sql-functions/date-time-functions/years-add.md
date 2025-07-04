---
{
    "title": "YEARS_ADD",
    "language": "zh-CN"
}
---

## years_add
## 描述
## 语法

`DATETIME YEARS_ADD(DATETIME date, INT years)`

从日期加上指定年数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select years_add("2020-01-31 02:02:02", 1);
+-------------------------------------+
| years_add('2020-01-31 02:02:02', 1) |
+-------------------------------------+
| 2021-01-31 02:02:02                 |
+-------------------------------------+
```

### keywords

    YEARS_ADD
