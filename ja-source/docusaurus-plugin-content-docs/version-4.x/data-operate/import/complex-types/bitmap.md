---
{
  "title": "ビットマップ",
  "description": "BITMAP型はDuplicate tables、Unique tables、およびAggregate tablesで使用でき、Key型としてのみ使用可能で、Value列としては使用できません。",
  "language": "ja"
}
---
BITMAP型は、Duplicate table、Unique table、および Aggregate tableで使用でき、Value 列ではなく Key 型としてのみ使用できます。Aggregate tableで BITMAP 型を使用する場合、tableは集約型 BITMAP_UNION で作成する必要があります。ユーザーは長さとデフォルト値を指定する必要はありません。長さは、データ集約の度合いに基づいてシステムによって制御されます。詳細なドキュメントについては、[Bitmap](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP) を参照してください。

## 使用例

### ステップ 1: データの準備

以下の CSV ファイルを作成します: test_bitmap.csv

```sql
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```
### ステップ 2: データベースにTableを作成する

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```
### ステップ 3: データの読み込み

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```
### ステップ 4: ロードされたデータの確認

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```
## 複数の要素を含むBitmapのインポート

以下では、stream loadを使用して複数の要素を含むbitmapカラムをインポートする2つの方法を示します。ユーザーはソースファイル形式に基づいて適切な方法を選択できます。

### bitmap_from_string

`bitmap_from_string`を使用する場合、ソースファイルのarrカラムでは角括弧は使用できません。使用した場合、データ品質エラーとみなされます。

```sql
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```
ストリーム読み込み用のコマンド

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```
### bitmap_from_array

`bitmap_from_array`を使用する場合、ソースファイルのarr列に角括弧を含めることができます。しかし、stream loadでは、使用前にまずstring型をarray型にキャストする必要があります。
キャスト変換が適用されない場合、関数シグネチャが見つからないためエラーが発生します：`[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)`

```sql
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```
stream load用のコマンド

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```
