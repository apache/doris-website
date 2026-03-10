---
{
  "title": "APPROX_COUNT_DISTINCT",
  "language": "ja",
  "description": "APPROXCOUNTDISTINCT関数は、HyperLogLogアルゴリズムに基づいて実装されており、固定サイズのメモリを使用して列ベースを推定します。"
}
---
## 説明

APPROX_COUNT_DISTINCT関数は、HyperLogLogアルゴリズムに基づいて実装されており、固定サイズのメモリを使用して列ベースを推定します。このアルゴリズムは末尾でのnull分布の仮定に基づいており、精度はデータ分布に依存します。Dorisで使用される固定バケットサイズに基づくと、アルゴリズムの相対標準誤差は0.8125%です。
より詳細で具体的な分析については、[関連論文](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)を参照してください。

## 構文

```sql
APPROX_COUNT_DISTINCT(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 取得する必要がある式 |

## 戻り値

BIGINT型の値を返します。

### 例

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
