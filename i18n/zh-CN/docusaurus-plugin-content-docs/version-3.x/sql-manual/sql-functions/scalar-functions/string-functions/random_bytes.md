---
{
    "title": "RANDOM_BYTES",
    "language": "zh-CN"
}
---

## 描述

RANDOM_BYTES 函数用于生成指定长度的随机字节序列。

## 语法

```sql
RANDOM_BYTES( <len> )
```

## 参数

| 参数      | 说明                               |
|---------|----------------------------------|
| `<len>` | 该参数指定生成的随机字节序列的长度，此值必需大于 0，否则会报错 |

## 返回值

返回一个指定长度的随机字节序列，并以十六进制编码。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
select random_bytes(7);
```

```text
+------------------+
| random_bytes(7)  |
+------------------+
| 0x869684a082ab4b |
+------------------+
```

```sql
select random_bytes(-1);
```

```text
(1105, 'errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.')
```
