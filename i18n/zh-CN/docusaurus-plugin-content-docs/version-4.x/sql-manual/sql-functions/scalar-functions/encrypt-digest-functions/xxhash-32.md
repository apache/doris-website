---
{
    "title": "XXHASH_32",
    "language": "zh-CN",
    "description": "计算输入字符串或二进制的 32 位 xxhash 值"
}
---

## 描述

计算输入字符串或二进制的 32 位 xxhash 值

-注：在计算 hash 值时，更推荐使用`xxhash_32`，而不是`murmur_hash3_32`。

## 语法

```sql
XXHASH_32( <input> [ , <input> ... ] )
```

## 参数

| 参数      | 说明               |
|---------|------------------|
| `<input>` | 需要被计算 32 位 xxhash 的值, 接受字符串和二进制类型 |

## 返回值

返回输入字符串的 32 位 xxhash 值。

## 举例

```sql
select xxhash_32(NULL), xxhash_32("hello"), xxhash_32("hello", "world");
```

```text
+-----------------+--------------------+-----------------------------+
| xxhash_32(NULL) | xxhash_32('hello') | xxhash_32('hello', 'world') |
+-----------------+--------------------+-----------------------------+
|            NULL |          -83855367 |                  -920844969 |
+-----------------+--------------------+-----------------------------+
```

```sql
-- vb (VarBinary) 和 vc (VarChar) 插入时使用了相同的字符串.
SELECT * FROM mysql_catalog.binary_test.binary_test;
```
```text
+------+------------+------+
| id   | vb         | vc   |
+------+------------+------+
|    1 | 0x616263   | abc  |
|    2 | 0x78797A   | xyz  |
|    3 | NULL       | NULL |
+------+------------+------+
```

```sql
SELECT XXHASH_32(vb), XXHASH_32(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------+---------------+
| XXHASH_32(vb) | XXHASH_32(vc) |
+---------------+---------------+
|     852579327 |     852579327 |
|    -242012205 |    -242012205 |
|          NULL |          NULL |
+---------------+---------------+
```