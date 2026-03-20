---
{
  "title": "XXHASH_64",
  "description": "入力文字列またはバイナリの64ビットxxhash値を計算します。",
  "language": "ja"
}
---
## デスクリプション

入力文字列またはバイナリの64ビットxxhash値を計算します。

-注意: テスト結果により、`xxhash_64`のパフォーマンスは`murmur_hash3_64`の約2倍です。そのため、ハッシュ値を計算する際は、`murmur_hash3_64`の代わりに`xxhash_64`を使用することを推奨します。

## Alias

- `XXHASH3_64`

## Syntax

```sql
XXHASH_64( <input> [ , <input> ... ] )
```
## パラメータ

| parameter | description      |
|-----------|------------------|
| `<input>`   | 計算対象の64ビットxxhash値、文字列およびバイナリ型を受け付けます |

## 戻り値

入力文字列の64ビットxxhash値を返します。

## 例

```sql
select xxhash_64(NULL), xxhash_64("hello"), xxhash_64("hello", "world");
```
```text
+-----------------+----------------------+-----------------------------+
| xxhash_64(NULL) | xxhash_64('hello')   | xxhash_64('hello', 'world') |
+-----------------+----------------------+-----------------------------+
|            NULL | -7685981735718036227 |         7001965798170371843 |
+-----------------+----------------------+-----------------------------+
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
SELECT XXHASH_64(vb), XXHASH_64(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------------+---------------------+
| XXHASH_64(vb)       | XXHASH_64(vc)       |
+---------------------+---------------------+
| 8696274497037089104 | 8696274497037089104 |
| 7095089596068863775 | 7095089596068863775 |
|                NULL |                NULL |
+---------------------+---------------------+
```
