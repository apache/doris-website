---
{
    "title": "QUARTER",
    "language": "zh-CN"
}
---

## quarter
## 描述
## 语法

`INT quarter(DATETIME date)`

返回指定的日期所属季度，以INT类型返回

## 举例

```
mysql> select quarter('2022-09-22 17:00:00');
+--------------------------------+
| quarter('2022-09-22 17:00:00') |
+--------------------------------+
|                              3 |
+--------------------------------+
```

### keywords

    quarter
