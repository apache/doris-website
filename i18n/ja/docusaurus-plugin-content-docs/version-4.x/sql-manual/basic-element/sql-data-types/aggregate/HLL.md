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

HLL はキー列として使用できません。QUANTILE_STATE 型の列は、Aggregate テーブル、Duplicate テーブル、Unique テーブルで使用できます。Aggregate テーブルで使用する場合、テーブル作成時の集約型は QUANTILE_UNION です。
長さとデフォルト値を指定する必要はありません。
長さはデータの集約度に応じてシステム内で制御されます。
HLL 列のクエリや利用には、対応する hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash の各関数を使用する必要があります。

HLL は異なる要素の数を近似的に求めるために使用します。データ量が多い場合、Count Distinct よりも性能が優れています。
HLL の誤差は通常約 1% で、場合によっては最大 2% になります。

### 例

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;

### キーワード
HLL,HYPERLOGLOG
