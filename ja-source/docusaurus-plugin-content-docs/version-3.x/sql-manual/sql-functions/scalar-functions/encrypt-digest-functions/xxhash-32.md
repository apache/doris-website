---
{
  "title": "XXHASH_32",
  "description": "入力文字列の32bitのxxhash値を計算する",
  "language": "ja"
}
---
## デスクリプション

入力文字列の32ビットxxhash値を計算します

-注意: ハッシュ値を計算する際は、`murmur_hash3_32`ではなく`xxhash_32`の使用を推奨します。

## Syntax

```sql
XXHASH_32( <str> [ , <str> ... ] )
```
## パラメータ

| parameter | description      |
|-----------|------------------|
| `<str>`   | 計算される32ビットxxhash値 |

## Return Value

入力文字列の32ビットxxhash値を返します。

## Examples

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
