---
{
    "title": "DAYS_ADD",
    "language": "zh-CN"
}
---

## days_add
## 描述
## 语法

`DATETIME DAYS_ADD(DATETIME date, INT days)`

从日期时间或日期加上指定天数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型与参数 date 的类型一致。

## 举例

```
mysql> select days_add(to_date("2020-02-02 02:02:02"), 1);
+---------------------------------------------+
| days_add(to_date('2020-02-02 02:02:02'), 1) |
+---------------------------------------------+
| 2020-02-03                                  |
+---------------------------------------------+
```

### keywords

    DAYS_ADD
