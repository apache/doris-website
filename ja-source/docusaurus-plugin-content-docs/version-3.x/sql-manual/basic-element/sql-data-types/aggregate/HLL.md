---
{
  "title": "HLL (HyperLogLog)",
  "description": "HLL",
  "language": "ja"
}
---
## HLL (HyperLogLog)
### 説明
HLL

HLLはキーカラムとして使用することはできません。HLL型のカラムは、AggregateTable、DuplicateTable、およびUniqueTableで使用できます。AggregateTableで使用する場合、table構築時の集約タイプはHLL_UNIONです。
ユーザーは長さとデフォルト値を指定する必要はありません。
長さはデータ集約の度合いに応じてシステム内で制御されます。
そして、HLLカラムは、対応するhll_union_agg、hll_raw_agg、hll_cardinality、およびhll_hashを通じてのみクエリまたは使用できます。

HLLは個別要素の近似カウントであり、データ量が大きい場合、Count Distinctよりもパフォーマンスが優れています。
HLLの誤差は通常1%程度で、時には2%に達することもあります。

### 例

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;

### キーワード
HLL,HYPERLOGLOG
