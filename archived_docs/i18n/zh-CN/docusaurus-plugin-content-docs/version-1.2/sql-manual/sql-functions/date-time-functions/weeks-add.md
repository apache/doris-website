---
{
    "title": "WEEKS_ADD",
    "language": "zh-CN"
}
---

## weeks_add
## 描述
## 语法

`DATETIME WEEKS_ADD(DATETIME date, INT weeks)`

从日期加上指定星期数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select weeks_add("2020-02-02 02:02:02", 1);
+-------------------------------------+
| weeks_add('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-02-09 02:02:02                 |
+-------------------------------------+
```

### keywords

    WEEKS_ADD
