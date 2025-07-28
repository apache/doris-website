---
{
    "title": "SECONDS_SUB",
    "language": "zh-CN"
}
---

## seconds_sub
## 描述
## 语法

`DATETIME SECONDS_SUB(DATETIME date, INT seconds)`

从日期时间或日期减去指定秒数

参数 date 可以是 DATETIME 或者 DATE 类型，返回类型为 DATETIME。

## 举例

```
mysql> select seconds_sub("2020-01-01 00:00:00", 1);
+---------------------------------------+
| seconds_sub('2020-01-01 00:00:00', 1) |
+---------------------------------------+
| 2019-12-31 23:59:59                   |
+---------------------------------------+
```

### keywords

    SECONDS_SUB
