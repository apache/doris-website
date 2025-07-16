---
{
    "title": "NUMBERS",
    "language": "zh-CN"
}
---

## `numbers`

## 描述

表函数，生成一张只含有一列的临时表，列名为`number`，行的值为[0,n)。

该函数用于from子句中。

## 语法
```sql
numbers(
  "number" = "n",
  "backend_num" = "m"
  );
```

参数：
- `number`: 代表生成[0,n)的行。
- `backend_num`: 可选参数,代表`m`个be节点同时执行该函数（需要部署多个be）。

## 举例
```
mysql> select * from numbers("number" = "10");
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
|      5 |
|      6 |
|      7 |
|      8 |
|      9 |
+--------+
```

### keywords

    numbers


