---
{
    "title": "MURMUR_HASH3_32",
    "language": "zh-CN"
}
---

## murmur_hash3_32

## 描述
## 语法

`INT MURMUR_HASH3_32(VARCHAR input, ...)`

返回输入字符串的32位murmur3 hash值

## 举例

```
mysql> select murmur_hash3_32(null);
+-----------------------+
| murmur_hash3_32(NULL) |
+-----------------------+
|                  NULL |
+-----------------------+

mysql> select murmur_hash3_32("hello");
+--------------------------+
| murmur_hash3_32('hello') |
+--------------------------+
|               1321743225 |
+--------------------------+

mysql> select murmur_hash3_32("hello", "world");
+-----------------------------------+
| murmur_hash3_32('hello', 'world') |
+-----------------------------------+
|                         984713481 |
+-----------------------------------+
```

### keywords

    MURMUR_HASH3_32,HASH
