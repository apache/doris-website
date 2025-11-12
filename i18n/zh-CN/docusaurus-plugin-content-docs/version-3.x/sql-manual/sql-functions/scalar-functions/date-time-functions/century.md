---
{
    "title": "century",
    "language": "zh-CN"
}
---

## century
## 描述
## 语法

`INT century(DATETIME date)`


返回 date 类型的 year 部分，范围从 1000-9999

参数为 Date 或者 Datetime 类型

## 举例

```
mysql> select century('1987-01-01');
+-----------------------------+
| year('1987-01-01 00:00:00') |
+-----------------------------+
|                           20|
+-----------------------------+
```

### keywords

    century
