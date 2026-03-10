---
{
  "title": "MURMUR_HASH3_64",
  "language": "ja",
  "description": "64ビットmurmur3ハッシュ値を計算する"
}
---
## Description

64-bit murmur3 ハッシュ値を計算します

`MURMUR_HASH3_64_V2` との違いは：このバージョンは64-bit出力用に特別に最適化されており、v2バージョンよりもわずかに優れたパフォーマンスを持ちますが、[standard library](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64) 実装とは一貫性がありません。

-注意：テスト後、`xxhash_64` のパフォーマンスは `murmur_hash3_64` の約2倍であるため、ハッシュ値を計算する際は、`murmur_hash3_64` の代わりに `xxhash_64` の使用を推奨します。


## Syntax

```sql
MURMUR_HASH3_64( <str> [ , <str> ... ] )
```
## パラメータ

| parameter      | description                                             |
|---------|------------------------------------------------|
| `<str>` | 計算対象の64ビットmurmur3ハッシュ値 |

## 戻り値

入力文字列の64ビットmurmur3ハッシュを返します。

いずれかのパラメータ入力がNULLの場合、NULLを返します。

## 例

```sql
select murmur_hash3_64(null), murmur_hash3_64("hello"), murmur_hash3_64("hello", "world");
```
```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_64(NULL) | murmur_hash3_64('hello') | murmur_hash3_64('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |     -3215607508166160593 |               3583109472027628045 |
+-----------------------+--------------------------+-----------------------------------+
```
