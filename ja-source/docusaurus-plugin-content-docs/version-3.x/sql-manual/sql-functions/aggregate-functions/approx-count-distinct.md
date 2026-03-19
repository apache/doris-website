---
{
  "title": "APPROX_COUNT_DISTINCT",
  "description": "APPROXCOUNTDISTINCT関数は、HyperLogLogアルゴリズムに基づいて実装されており、固定サイズのメモリを使用して列ベースを推定します。",
  "language": "ja"
}
---
## デスクリプション

APPROX_COUNT_DISTINCT関数は、HyperLogLogアルゴリズムに基づいて実装されており、固定サイズのメモリを使用して列ベースを推定します。このアルゴリズムは、末尾におけるnull分布の仮定に基づいており、精度はデータ分布に依存します。Dorisが使用する固定バケットサイズに基づいて、アルゴリズムの相対標準誤差は0.8125%です。
より詳細で具体的な分析については、[related paper](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)を参照してください

## Syntax

```sql
APPROX_COUNT_DISTINCT(<expr>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `<expr>` | 取得する必要がある式 |

## Return Value

BIGINT型の値を返します。

### Example

```sql
select approx_count_distinct(query_id) from log_statis group by datetime;
```
```text
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```
