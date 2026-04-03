---
{
  "title": "MURMUR_HASH3_64_V2",
  "description": "64ビットのMurmurHash3ハッシュ値を計算します。",
  "language": "ja"
}
---
## 説明

64ビットのMurmurHash3ハッシュ値を計算します。

`MURMUR_HASH3_64`との違いは、このバージョンはMurmurHash3の128ビット処理関数を再利用し、最初の64ビットハッシュ値のみを出力することで、[standard library](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64)実装と一致していることです。

注記：テストによると、`xxhash_64`のパフォーマンスは`murmur_hash3_64`の約2倍です。そのため、ハッシュ値を計算する際は、`murmur_hash3_64`の代わりに`xxhash_64`を使用することを推奨します。

## 構文

```sql
MURMUR_HASH3_64_V2( <str> [ , <str> ... ] )
```
## パラメータ

| Parameter | デスクリプション                                           |
| --------- | ----------------------------------------------------- |
| `<str>`   | 64-bit MurmurHash3ハッシュとして計算される値 |

## Return Value

入力文字列の64-bit MurmurHash3ハッシュ値を返します。

いずれかのパラメータがNULLの場合、NULLを返します。

## Examples

```sql
select murmur_hash3_64_v2(null), murmur_hash3_64_v2("hello"), murmur_hash3_64_v2("hello", "world");
```
```text
+--------------------------+-----------------------------+--------------------------------------+
| murmur_hash3_64_v2(null) | murmur_hash3_64_v2("hello") | murmur_hash3_64_v2("hello", "world") |
+--------------------------+-----------------------------+--------------------------------------+
|                     NULL |        -3758069500696749310 |                  -662943091231200135 |
+--------------------------+-----------------------------+--------------------------------------+
```
