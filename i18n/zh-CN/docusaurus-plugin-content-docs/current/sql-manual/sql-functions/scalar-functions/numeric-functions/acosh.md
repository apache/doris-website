---
{
    "title": "ACOSH",
    "language": "zh-CN"
}
---

## 描述

返回`x`的反双曲余弦值。如果`x`小于`1`，则返回`NULL`。


## 语法

```sql
ACOSH(<x>)
```

## 参数

| 参数 | 描述 |  
| -- | -- |  
| `<x>` | 需要计算反双曲余弦值的数值 |  

## 返回值

参数`x`的反双曲余弦值。

## 示例

```sql
select acosh(0.0);
```

```sql
+------------+
| acosh(0.0) |
+------------+
|       NULL |
+------------+
```

```sql
select acosh(-1.0);
```

```sql
+-------------+
| acosh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select acosh(1.0);
```

```sql
+------------+
| acosh(1.0) |
+------------+
|          0 |
+------------+
```

```sql
select acosh(10.0);
```

```sql
+-------------------+
| acosh(10.0)       |
+-------------------+
| 2.993222846126381 |
+-------------------+
```
