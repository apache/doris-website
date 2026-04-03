---
{
  "title": "SHA1",
  "language": "ja",
  "description": "SHA1アルゴリズムを使用して情報をダイジェストしてください。"
}
---
## 説明

SHA1アルゴリズムを使用して情報をダイジェストします。

## エイリアス
SHA

## 構文

``` sql
SHA1( <input> )
```
## パラメータ

| parameter | description         |
|-----------|-------------|
| `<input>`   | 計算対象のsha1値、文字列およびバイナリ型を受け付けます |

## 戻り値

入力文字列のsha1値を返します


## 例

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
SELECT SHA1(vb), SHA1(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+------------------------------------------+------------------------------------------+
| SHA1(vb)                                 | SHA1(vc)                                 |
+------------------------------------------+------------------------------------------+
| a9993e364706816aba3e25717850c26c9cd0d89d | a9993e364706816aba3e25717850c26c9cd0d89d |
| 66b27417d37e024c46526c2f6d358a754fc552f3 | 66b27417d37e024c46526c2f6d358a754fc552f3 |
| NULL                                     | NULL                                     |
+------------------------------------------+------------------------------------------+
```
