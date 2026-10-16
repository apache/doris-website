---
{
    "title": "XXHASH_32",
    "language": "ja",
    "description": "入力した文字列またはバイナリ値の 32 ビット xxHash 値を計算します。"
}
---

## 説明

入力した文字列またはバイナリ値の 32 ビット xxHash 値を計算します。

## 構文

```sql
XXHASH_32( <input> [ , <input> ... ] )
```

## パラメータ

| パラメータ | 説明      |
|-----------|------------------|
| `<input>`   | 32 ビットの xxHash 値を計算する対象。文字列型とバイナリ型を受け付けます |

## 戻り値

入力値の 32 ビット xxHash 値を返します。

## 使用例

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