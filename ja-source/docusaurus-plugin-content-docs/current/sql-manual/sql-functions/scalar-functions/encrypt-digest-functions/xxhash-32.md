---
{
  "title": "XXHASH_32",
  "language": "ja",
  "description": "入力文字列またはバイナリの32ビットxxhash値を計算する。"
}
---
## 説明

入力文字列またはバイナリの32ビットxxhash値を計算します。

-注意：ハッシュ値を計算する際は、`murmur_hash3_32`ではなく`xxhash_32`の使用を推奨します。

## 構文

```sql
XXHASH_32( <input> [ , <input> ... ] )
```
## パラメータ

| parameter | description      |
|-----------|------------------|
| `<input>`   | 計算される32ビットxxhash値、文字列およびバイナリ型を受け入れます |

## 戻り値

入力文字列の32ビットxxhash値を返します。

## 例

```sql
select xxhash_32(NULL), xxhash_32("hello"), xxhash_32("hello", "world");
```
```text
+-----------------+--------------------+-----------------------------+
| xxhash_32(NULL) | xxhash_32('hello') | xxhash_32('hello', 'world') |
+-----------------+--------------------+-----------------------------+
|            NULL |          -83855367 |                  -920844969 |
+-----------------+--------------------+-----------------------------+
```
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
SELECT XXHASH_32(vb), XXHASH_32(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------+---------------+
| XXHASH_32(vb) | XXHASH_32(vc) |
+---------------+---------------+
|     852579327 |     852579327 |
|    -242012205 |    -242012205 |
|          NULL |          NULL |
+---------------+---------------+
```
