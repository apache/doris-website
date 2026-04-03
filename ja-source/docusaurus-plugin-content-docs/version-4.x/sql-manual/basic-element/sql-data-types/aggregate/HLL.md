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

HLLはキー列として使用することはできません。HLL型の列は、AggregateTable、DuplicateTable、UniqueTableで使用できます。AggregateTableで使用する場合、table構築時の集約タイプはHLL_UNIONになります。
ユーザーは長さとデフォルト値を指定する必要はありません。
長さは、データ集約の度合いに応じてシステム内で制御されます。
また、HLL列は、対応するhll_union_agg、hll_raw_agg、hll_cardinality、hll_hashを通してのみクエリまたは使用できます。

HLLは異なる要素の近似カウントであり、データ量が大きい場合、Count Distinctよりもパフォーマンスが優れています。
HLLのエラーは通常1%程度で、時には2%に達することがあります。

### 例

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;

### キーワード
HLL,HYPERLOGLOG
