---
{
  "title": "HLL (HyperLogLog)",
  "language": "ja",
  "description": "HLL"
}
---
## HLL (HyperLogLog)
### 説明
HLL

HLLはキー列として使用することはできません。HLL型の列は、Aggregateテーブル、Duplicateテーブル、Uniqueテーブルで使用できます。Aggregateテーブルで使用する場合、テーブル構築時の集約タイプはHLL_UNIONです。
ユーザーは長さやデフォルト値を指定する必要はありません。
長さはデータ集約の度合いに応じてシステム内で制御されます。
そして、HLL列は対応するhll_union_agg、hll_raw_agg、hll_cardinality、hll_hashを通してのみクエリまたは使用できます。

HLLは個別要素の近似カウントであり、データ量が大きい場合にCount Distinctよりもパフォーマンスが優れています。
HLLの誤差は通常1%程度で、時には2%に達することがあります。

### 例

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;

### キーワード
HLL,HYPERLOGLOG
