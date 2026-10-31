---
{
    "title": "MONTHS_ADD",
    "language": "zh-CN"
}
---

## months_add
## 描述
## 语法

`DATETIME MONTHS_ADD(DATETIME date, INT months)`

从日期加上指定月份

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select months_add("2020-01-31 02:02:02", 1);
+--------------------------------------+
| months_add('2020-01-31 02:02:02', 1) |
+--------------------------------------+
| 2020-02-29 02:02:02                  |
+--------------------------------------+
```

### keywords

    MONTHS_ADD
