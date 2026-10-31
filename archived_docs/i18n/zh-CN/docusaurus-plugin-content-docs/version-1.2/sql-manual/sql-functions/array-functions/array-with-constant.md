---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "zh-CN"
}
---

## array_with_constant

<version since="1.2.0">

array_with_constant
array_repeat

</version>

## 描述

## 语法

```sql
ARRAY<T> array_with_constant(n, T)
ARRAY<T> array_repeat(T, n)
```
返回一个数组, 包含n个重复的T常量。array_repeat与array_with_constant功能相同，用来兼容hive语法格式。

## 注意事项

`仅支持向量化引擎中使用`

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
