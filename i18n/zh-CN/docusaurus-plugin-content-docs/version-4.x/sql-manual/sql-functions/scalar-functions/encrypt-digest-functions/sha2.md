---
{
    "title": "SHA2",
    "language": "zh-CN",
    "description": "使用 SHA2 对信息进行摘要处理。"
}
---

## 描述

使用 SHA2 对信息进行摘要处理。

## 语法

```sql
SHA2(<input>, <digest_length>)
```

## 参数

| 参数      | 说明          |
|---------|-------------|
| `<input>` | 待加密的内容, 接受字符串和二进制类型 |
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

第二个参数 `<digest_length>` 必须是字面量；即使值合法，传入列引用也会报错：

```sql
-- setup
CREATE TABLE str (k0 VARCHAR(64), k1 INT)
DISTRIBUTED BY HASH(k0) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO str VALUES ('hello', 224), ('world', 256);
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

下面两个示例是说明性的——它们需要一个名为 `mysql_catalog` 的外部 MySQL Catalog 中有 `binary_test.binary_test` 表，大多数集群未配置此环境。展示的是 `SHA2` 对内容相同的 `VARBINARY` 与 `VARCHAR` 列会输出相同摘要。

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
SELECT SHA2(vb, 224), SHA2(vc, 224) FROM mysql_catalog.binary_test.binary_test;
```
```text
+----------------------------------------------------------+----------------------------------------------------------+
| SHA2(vb, 224)                                            | SHA2(vc, 224)                                            |
+----------------------------------------------------------+----------------------------------------------------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 |
| 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 | 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 |
| NULL                                                     | NULL                                                     |
+----------------------------------------------------------+----------------------------------------------------------+
```