---
{
    "title": "RANDOM_BYTES",
    "language": "zh-CN",
    "description": "RANDOMBYTES 函数用于生成指定长度的随机字节序列。返回的字节序列以十六进制字符串形式表示。"
}
---

## 描述

RANDOM_BYTES 函数用于生成指定长度的随机字节序列。返回的字节序列以十六进制字符串形式表示。

## 语法

```sql
RANDOM_BYTES(<len>)
```

## 参数

| 参数 | 说明 |
| -------- | ----------------------------------------- |
| `<len>` | 需要生成的随机字节数。类型：INT |

## 返回值

返回 VARCHAR 类型，为十六进制编码的随机字节序列（以 `0x` 开头）。

特殊情况：
- `<len>` 必须大于 0，否则返回错误
- 如果参数为 NULL，返回 NULL
- 每次调用生成的结果都是随机的

## 示例

1. 基本用法：生成 8 字节随机序列
```sql
SELECT random_bytes(8);
```
```text
+--------------------+
| random_bytes(8)    |
+--------------------+
| 0x1a2b3c4d5e6f7089 |
+--------------------+
```

2. 生成短序列
```sql
SELECT random_bytes(4);
```
```text
+----------------+
| random_bytes(4) |
+----------------+
| 0xab12cd34     |
+----------------+
```

3. 非法参数：负数
```sql
SELECT random_bytes(-1);
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.
```

4. NULL 值处理
```sql
SELECT random_bytes(NULL);
```
```text
+--------------------+
| random_bytes(NULL) |
+--------------------+
| NULL               |
+--------------------+
```

5. 生成较长序列（16 字节）
```sql
SELECT random_bytes(16);
```
```text
+------------------------------------+
| random_bytes(16)                   |
+------------------------------------+
| 0x1a2b3c4d5e6f708192a3b4c5d6e7f809 |
+------------------------------------+
```

### Keywords

    RANDOM_BYTES
