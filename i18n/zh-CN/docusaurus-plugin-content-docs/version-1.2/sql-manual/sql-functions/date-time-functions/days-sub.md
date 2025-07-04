---
{
    "title": "DAYS_SUB",
    "language": "zh-CN"
}
---

## days_sub
## 描述
## 语法

`DATETIME DAYS_SUB(DATETIME date, INT days)`

从日期时间或日期减去指定天数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select days_sub("2020-02-02 02:02:02", 1);
+------------------------------------+
| days_sub('2020-02-02 02:02:02', 1) |
+------------------------------------+
| 2020-02-01 02:02:02                |
+------------------------------------+
```

### keywords

    DAYS_SUB
