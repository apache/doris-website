---
{
    "title": "MURMUR_HASH3_64",
    "language": "zh-CN",
    "description": "计算 64 位 murmur3 hash 值"
}
---

## 描述

计算 64 位 murmur3 hash 值

与`MURMUR_HASH3_64_V2`的区别是：此版本专门为 64 位输出优化，性能略优于 v2 版本, 但与[标准库](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64)实现不一致。

-注：经过测试 xxhash_64 的性能大约是 murmur_hash3_64 的 2 倍，所以在计算 hash 值时，更推荐使用`xxhash_64`，而不是`murmur_hash3_64`。

## 语法

```sql
MURMUR_HASH3_64( <str> [ , <str> ... ] )
```

## 参数

| 参数      | 说明                     |
|---------|------------------------|
| `<str>` | 需要被计算 64 位 murmur3 hash 的值 |

## 返回值

返回输入字符串的 64 位 murmur3 hash 值。

任一参数输入为 NULL 时返回 NULL。

## 示例

```sql
select murmur_hash3_64(null), murmur_hash3_64("hello"), murmur_hash3_64("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_64(NULL) | murmur_hash3_64('hello') | murmur_hash3_64('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |     -3215607508166160593 |               3583109472027628045 |
+-----------------------+--------------------------+-----------------------------------+
```
