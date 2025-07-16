---
{
    "title": "SECONDS_ADD",
    "language": "zh-CN"
}
---

## seconds_add
## 描述
## 语法

`DATETIME SECONDS_ADD(DATETIME date, INT seconds)`

从日期时间或日期加上指定秒数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型为 DATETIME。

## 举例

```
mysql> select seconds_add("2020-02-02 02:02:02", 1);
+---------------------------------------+
| seconds_add('2020-02-02 02:02:02', 1) |
+---------------------------------------+
| 2020-02-02 02:02:03                   |
+---------------------------------------+
```

### keywords

    SECONDS_ADD
