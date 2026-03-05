---
{
    "title": "MONTHS_SUB",
    "language": "zh-CN"
}
---

## months_sub
## 描述
## 语法

`DATETIME MONTHS_SUB(DATETIME date, INT months)`

从日期时间或日期减去指定月份数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select months_sub("2020-02-02 02:02:02", 1);
+--------------------------------------+
| months_sub('2020-02-02 02:02:02', 1) |
+--------------------------------------+
| 2020-01-02 02:02:02                  |
+--------------------------------------+
```

### keywords

    MONTHS_SUB
