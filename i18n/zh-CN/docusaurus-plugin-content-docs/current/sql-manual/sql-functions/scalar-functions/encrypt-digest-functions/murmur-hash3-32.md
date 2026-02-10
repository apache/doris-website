---
{
    "title": "MURMUR_HASH3_32",
    "language": "zh-CN",
    "description": "计算 32 位 murmur3 hash 值"
}
---

## 描述

计算 32 位 murmur3 hash 值

-注：在计算 hash 值时，更推荐使用`xxhash_32`，而不是`murmur_hash3_32`。

## 语法

```sql
MURMUR_HASH3_32( <str> [ , <str> ... ] )
```

## 参数

| 参数      | 说明 |
|---------| -- |
| `<str>` | 需要被计算 32 位 murmur3 hash 的值 |

## 返回值

返回输入字符串的 32 位 murmur3 hash 值。

-当参数为 NULL 时，返回 NULL



## 示例

```sql
select murmur_hash3_32(null), murmur_hash3_32("hello"), murmur_hash3_32("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_32(NULL) | murmur_hash3_32('hello') | murmur_hash3_32('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |               1321743225 |                         984713481 |
+-----------------------+--------------------------+-----------------------------------+
```