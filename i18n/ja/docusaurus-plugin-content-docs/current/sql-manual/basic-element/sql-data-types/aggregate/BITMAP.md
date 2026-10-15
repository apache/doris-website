---
{
    "title": "BITMAP",
    "language": "ja",
    "description": "BITMAP"
}
---

## BITMAP
### 説明
BITMAP

BITMAP 型の列は、集約テーブル、Unique テーブル、Duplicate テーブルで使用できます。
Unique テーブルまたは Duplicate テーブルで使用する場合は、非キー列にする必要があります。
集約テーブルで使用する場合も非キー列にする必要があり、テーブル作成時の集約方式には BITMAP_UNION を指定します。
長さとデフォルト値を指定する必要はありません。長さはデータの集約度に応じてシステム内で制御されます。
BITMAP 列の参照や操作には、bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64 などの対応する関数のみを使用できます。
    
オフライン処理で BITMAP を使用すると、データの取り込み速度に影響します。データ量が多い場合、クエリ速度は HLL より遅く、Count Distinct より速くなります。
注意：リアルタイム処理でグローバル辞書を使用せずに BITMAP の bitmap_hash() を使うと、約千分の一の誤差が生じる可能性があります。この誤差を許容できない場合は、bitmap_hash64 を使用できます。

### 使用例

テーブルの作成例：

    create table metric_table (
      datekey int,
      hour int,
      device_id bitmap BITMAP_UNION
    )
    aggregate key (datekey, hour)
    distributed by hash(datekey, hour) buckets 1
    properties(
      "replication_num" = "1"
    );

データの挿入例：

    insert into metric_table values
    (20200622, 1, to_bitmap(243)),
    (20200622, 2, bitmap_from_array([1,2,3,4,5,434543])),
    (20200622, 3, to_bitmap(287667876573));

データのクエリ例：

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200622
    group by hour order by 1
    ) final;

[セッション変数](../../../sql-statements/session/variable/SET-VARIABLE) `return_object_data_as_binary` を `true` に設定すると、ビットマップはバイナリ形式で返されます。
    
### キーワード
BITMAP
