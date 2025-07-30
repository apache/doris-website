---
{
"title": "SHA2",
"language": "zh-CN"
}
---

## 描述

使用 SHA2 对信息进行摘要处理。

## 语法

```sql
SHA2(<str>, <digest_length>)
```

## 参数

| 参数      | 说明          |
|---------|-------------|
| `<str>` | 待加密的内容 |
| `<digest_length>` | 摘要长度，支持 224, 256, 384, 512，必须为常量 |

## 返回值

返回输入字符串的 sha2 值

## 示例

```SQL
select sha2('abc', 224), sha2('abc', 384), sha2(NULL, 512);
```

```text
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| sha2('abc', 224)                                         | sha2('abc', 384)                                                                                 | sha2(NULL, 512) |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7 | NULL            |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
```

```SQL
select sha2('abc', 225);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = sha2 functions only support digest length of [224, 256, 384, 512]
```

```SQL
select sha2('str', k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```

```SQL
select sha2(k0, k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```
