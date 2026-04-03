---
{
  "title": "ビットマップ",
  "language": "ja",
  "description": "BITMAP"
}
---
## BITMAP
### 説明
BITMAP

BITMAP型の列は、Aggregateテーブル、Uniqueテーブル、またはDuplicateテーブルで使用できます。
UniqueテーブルまたはDuplicateテーブルで使用する場合、非キー列として使用する必要があります。
Aggregateテーブルで使用する場合、非キー列として使用する必要があり、テーブル構築時の集約タイプはBITMAP_UNIONです。
ユーザーは長さとデフォルト値を指定する必要がありません。長さはデータ集約の度合いに応じてシステム内で制御されます。
そして、BITMAP列は、bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64などのサポート関数によってのみクエリまたは使用できます。

オフラインシナリオでのBITMAPの使用は、インポート速度に影響を与えます。大量のデータの場合、クエリ速度はHLLより遅く、Count Distinctより良好です。
注意：BITMAPがリアルタイムシナリオでグローバル辞書を使用しない場合、bitmap_hash()を使用すると約千分の一のエラーが発生する可能性があります。エラー率が許容できない場合は、代わりにbitmap_hash64を使用できます。

### example

Create table example:

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

Insert data example:

    insert into metric_table values
    (20200622, 1, to_bitmap(243)),
    (20200622, 2, bitmap_from_array([1,2,3,4,5,434543])),
    (20200622, 3, to_bitmap(287667876573));

Query data example:

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200622
    group by hour order by 1
    ) final;

[session variable](../../../../sql-manual/sql-statements/session/variable/SET-VARIABLE) `return_object_data_as_binary`を`true`に設定できます。その結果、bitmapはバイナリ形式で返されます。

### keywords
BITMAP
