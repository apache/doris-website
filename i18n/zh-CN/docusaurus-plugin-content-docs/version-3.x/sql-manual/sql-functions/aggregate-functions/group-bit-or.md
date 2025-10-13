---
{
"title": "GROUP_BIT_OR",
"language": "zh-CN"
}
---

## 描述

对单个整数列或表达式中的所有值执行按位 or 运算

## 语法

```sql
GROUP_BIT_OR(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持所有 INT 类型 |

## 返回值

返回一个整数值

## 举例

```sql
select * from group_bit;
```

```text
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
```

```sql
mysql> select group_bit_or(value) from group_bit;
```

```text
+-----------------------+
| group_bit_or(`value`) |
+-----------------------+
|                     7 |
+-----------------------+
```
