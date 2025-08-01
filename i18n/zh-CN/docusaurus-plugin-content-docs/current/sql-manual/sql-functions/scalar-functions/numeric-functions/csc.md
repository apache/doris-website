---
{
    "title": "CSC",
    "language": "zh-CN"
}
---

## 描述

返回 x 的余割值，x 为弧度值，仅支持输入输出为double。输入null值时会返回null。

## 语法

```sql
CSC(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 需要被计算余割值的值 |

## 返回值

返回一个 Double 类型的值表示 x 的余割值。

## 举例

```sql
select csc(1),csc(2),csc(1000);
```

```text
+--------------------+--------------------+------------------+
| csc(1)             | csc(2)             | csc(1000)        |
+--------------------+--------------------+------------------+
| 1.1883951057781212 | 1.0997501702946164 | 1.20936599707935 |
+--------------------+--------------------+------------------+
```

输入null值。

```sql
select csc(null);
```

```text
+--------------------+
| csc(null)          |
+--------------------+
|      NULL          |
+--------------------+
```