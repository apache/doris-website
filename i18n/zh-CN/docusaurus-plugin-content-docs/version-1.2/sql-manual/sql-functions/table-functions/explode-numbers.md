---
{
    "title": "EXPLODE_NUMBERS",
    "language": "zh-CN"
}
---

## explode_numbers

## 描述

表函数，需配合 Lateral View 使用。

获得一个[0,n)的序列。

## 语法
`explode_numbers(n)`

## 举例

```
mysql> select e1 from (select 1 k1) as t lateral view explode_numbers(5) tmp1 as e1;
+------+
| e1   |
+------+
|    0 |
|    1 |
|    2 |
|    3 |
|    4 |
+------+
```
### keywords

explode,numbers,explode_numbers
