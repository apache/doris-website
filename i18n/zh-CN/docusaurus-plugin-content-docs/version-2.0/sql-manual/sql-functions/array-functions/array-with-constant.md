---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "zh-CN"
}
---

## array_with_constant

:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

array_with_constant
array_repeat



## 描述

## 语法

```sql
ARRAY<T> array_with_constant(n, T)
ARRAY<T> array_repeat(T, n)
```
返回一个数组，包含 n 个重复的 T 常量。array_repeat 与 array_with_constant 功能相同，用来兼容 hive 语法格式。

## 举例

```
mysql> select array_with_constant(2, "hello"), array_repeat("hello", 2);
+---------------------------------+--------------------------+
| array_with_constant(2, 'hello') | array_repeat('hello', 2) |
+---------------------------------+--------------------------+
| ['hello', 'hello']              | ['hello', 'hello']       |
+---------------------------------+--------------------------+
1 row in set (0.04 sec)

mysql> select array_with_constant(3, 12345), array_repeat(12345, 3);
+-------------------------------+------------------------+
| array_with_constant(3, 12345) | array_repeat(12345, 3) | 
+-------------------------------+------------------------+
| [12345, 12345, 12345]         | [12345, 12345, 12345]  |
+-------------------------------+------------------------+
1 row in set (0.01 sec)

mysql> select array_with_constant(3, null), array_repeat(null, 3);
+------------------------------+-----------------------+
| array_with_constant(3, NULL) | array_repeat(NULL, 3) |
+------------------------------+-----------------------+
| [NULL, NULL, NULL]           |  [NULL, NULL, NULL]   |
+------------------------------+-----------------------+
1 row in set (0.01 sec)

mysql> select array_with_constant(null, 3), array_repeat(3, null);
+------------------------------+-----------------------+
| array_with_constant(NULL, 3) | array_repeat(3, NULL) |
+------------------------------+-----------------------+
| []                           | []                    |
+------------------------------+-----------------------+
1 row in set (0.01 sec)

```

### keywords

ARRAY,WITH_CONSTANT,ARRAY_WITH_CONSTANT,ARRAY_REPEAT
