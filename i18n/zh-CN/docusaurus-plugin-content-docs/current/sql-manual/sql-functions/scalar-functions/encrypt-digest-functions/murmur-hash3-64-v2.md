---
{
    "title": "MURMUR_HASH3_64_V2",
    "language": "zh-CN",
    "description": "计算 64 位 murmur3 hash 值"
}
---

## 描述

计算 64 位 murmur3 hash 值

与`MURMUR_HASH3_64`的区别是：此版本复用 MurmurHash3 的 128 位处理函数，仅输出第一个 64 位哈希值，与[标准库](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64)的行为保持一致。

-注：经过测试 xxhash_64 的性能大约是 murmur_hash3_64_v2 的 2 倍，所以在计算 hash 值时，更推荐使用`xxhash_64`，而不是`murmur_hash3_64`。如需更优的 64 位 MurmurHash3 性能，可考虑使用 `murmur_hash3_64`。

## 语法

```sql
MURMUR_HASH3_64_V2( <str> [ , <str> ... ] )
```

## 参数

| 参数      | 说明                     |
|---------|------------------------|
| `<str>` | 需要被计算 64 位 murmur3 hash 的值 |

## 返回值

返回输入字符串的 64 位 murmur3 hash 值。

任一参数为 NULL 时返回 NULL

## 示例

```sql
select murmur_hash3_64_v2(null), murmur_hash3_64_v2("hello"), murmur_hash3_64_v2("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_64(NULL) | murmur_hash3_64('hello') | murmur_hash3_64('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |     -3215607508166160593 |               3583109472027628045 |
+-----------------------+--------------------------+-----------------------------------+
```
