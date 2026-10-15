---
{
    "title": "SHA2",
    "language": "ja",
    "description": "SHA2 を使用して入力値のダイジェストを計算します。"
}
---

## 説明

SHA2 を使用して入力値のダイジェストを計算します。

## 構文

```sql
SHA2( <input>, <digest_length>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<input>` | ダイジェストを計算する対象の値。文字列型とバイナリ型を受け付けます。 |
| `<digest_length>` | ダイジェストの長さ。224、256、384、512 のいずれかを指定します。定数である必要があります。 |

## 戻り値

入力値の SHA2 ダイジェストを返します。入力値が NULL の場合は NULL を返します。

## 使用例

```sql
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

二番目の引数（`<digest_length>`）にはリテラルを指定する必要があります。値が有効でも、列参照を渡すとエラーになります。

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

次の二つの例は参考用です。外部 MySQL カタログ `mysql_catalog` に `binary_test.binary_test` が存在する必要があり、多くのクラスターでは設定されていません。元のバイト列が同じ場合、`SHA2` は `VARBINARY` 列と `VARCHAR` 列から同じダイジェストを計算することを示します。

```sql
-- vb (VarBinary) and vc (VarChar) used the same string during insertion.
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
