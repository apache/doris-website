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

BITMAP型の列は、Aggregateテーブル、UniqueテーブルまたはDuplicateテーブルで使用できます。
UniqueテーブルまたはDuplicateテーブルで使用する場合、非キー列として使用する必要があります。
Aggregateテーブルで使用する場合、非キー列として使用する必要があり、テーブル構築時の集約タイプはBITMAP_UNIONです。
ユーザーは長さとデフォルト値を指定する必要はありません。長さはデータ集約の度合いに応じてシステム内で制御されます。
また、BITMAP列はbitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64などのサポート関数によってのみクエリまたは使用できます。

オフラインシナリオでのBITMAPの使用はインポート速度に影響します。大量のデータの場合、クエリ速度はHLLより遅く、Count Distinctより高速になります。
注意：リアルタイムシナリオでBITMAPがグローバル辞書を使用しない場合、bitmap_hash()の使用により約千分の一の誤差が生じる可能性があります。誤差率が許容できない場合は、代わりにbitmap_hash64を使用できます。

### 例

テーブル作成例：

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

データ挿入例：

    insert into metric_table values
    (20200622, 1, to_bitmap(243)),
    (20200622, 2, bitmap_from_array([1,2,3,4,5,434543])),
    (20200622, 3, to_bitmap(287667876573));

データクエリ例：

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- 1時間あたりの累積UVをクエリ
       where datekey=20200622
    group by hour order by 1
    ) final;

[セッション変数](../../../sql-statements/session/variable/SET-VARIABLE) `return_object_data_as_binary`を`true`に設定できます。その結果、bitmapはバイナリ形式で返されます。

### キーワード
BITMAP
