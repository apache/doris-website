---
{
    "title": "YEAR",
    "language": "zh-CN"
}
---

## year
## 描述
## 语法

`INT YEAR(DATETIME date)`


返回date类型的year部分，范围从1000-9999

参数为Date或者Datetime类型

## 举例

```
mysql> select year('1987-01-01');
+-----------------------------+
| year('1987-01-01 00:00:00') |
+-----------------------------+
|                        1987 |
+-----------------------------+
```

### keywords

    YEAR
