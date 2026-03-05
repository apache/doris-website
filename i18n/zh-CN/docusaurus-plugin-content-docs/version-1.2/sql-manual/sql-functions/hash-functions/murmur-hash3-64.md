---
{
    "title": "MURMUR_HASH3_64",
    "language": "zh-CN"
}
---

## murmur_hash3_64

## 描述
## 语法

`BIGINT MURMUR_HASH3_64(VARCHAR input, ...)`

返回输入字符串的64位murmur3 hash值

## 举例

```
mysql> select murmur_hash3_64(null);
+-----------------------+
| murmur_hash3_64(NULL) |
+-----------------------+
|                  NULL |
+-----------------------+

mysql> select murmur_hash3_64("hello");
+--------------------------+
| murmur_hash3_64('hello') |
+--------------------------+
|     -3215607508166160593 |
+--------------------------+

mysql> select murmur_hash3_64("hello", "world");
+-----------------------------------+
| murmur_hash3_64('hello', 'world') |
+-----------------------------------+
|               3583109472027628045 |
+-----------------------------------+
```

### keywords

    MURMUR_HASH3_64,HASH
