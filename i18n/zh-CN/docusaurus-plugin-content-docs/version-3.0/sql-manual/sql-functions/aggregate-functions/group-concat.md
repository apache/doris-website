---
{
    "title": "GROUP_CONCAT",
    "language": "zh-CN"
}
---

## 描述

GROUP_CONCAT 函数将结果集中的多行结果连接成一个字符串

## 语法

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 必选。需要连接值的表达式 |
| `<sep>` | 可选。字符串之间的连接符号 |
| `<col_name>` | 可选。用于指定排序的列 |
| `<expr>` | 可选。用于指定排序的表达式 |

## 返回值

返回 VARCHAR 类型的数值。

## 举例

```sql
select value from test;
```

```text
+-------+
| value |
+-------+
| a     |
| b     |
| c     |
| c     |
+-------+
```

```sql
select GROUP_CONCAT(value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```

```sql 
select GROUP_CONCAT(value, " ") from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```

```sql
select GROUP_CONCAT(value, NULL) from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```
