---
{
  "title": "BITMAP_UNION",
  "description": "入力されたBitmapの和集合を計算し、新しいbitmapを返す",
  "language": "ja"
}
---
## 説明

入力されたBitmapの和集合を計算し、新しいbitmapを返します

## 構文

```sql
BITMAP_UNION(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | BITMAPでサポートされているデータ型 |

## Return Value

戻り値のデータ型はBITMAPです。

## Example

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```
```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```
user_idの重複除去値を計算する：

```
select bitmap_count(bitmap_union(user_id)) from pv_bitmap;
```
```text
+-------------------------------------+
| bitmap_count(bitmap_union(user_id)) |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```
### Create table

Tableを作成する際には集約モデルを使用する必要があります。データ型はbitmapで、集約関数はbitmap_unionです。

```
CREATE TABLE `pv_bitmap` (
  `dt` int (11) NULL COMMENT" ",
  `page` varchar (10) NULL COMMENT" ",
  `user_id` bitmap BITMAP_UNION NULL COMMENT" "
) ENGINE = OLAP
AGGREGATE KEY (`dt`,` page`)
COMMENT "OLAP"
DISTRIBUTED BY HASH (`dt`) BUCKETS 2;
```
注意：データ量が大きい場合、高頻度のbitmap_union クエリに対して対応するrollup Tableを作成することが最適です

```
ALTER TABLE pv_bitmap ADD ROLLUP pv (page, user_id);
```
### Data Load

`TO_BITMAP (expr)`: 0 ~ 18446744073709551615の符号なしbigintをbitmapに変換します

`BITMAP_EMPTY ()`: 空のbitmapカラムを生成します。insertやimportでデフォルト値を埋めるために使用されます

`BITMAP_HASH (expr)` または `BITMAP_HASH64 (expr)`: 任意の型のカラムをハッシュ化してbitmapに変換します

#### Stream Load

```
cat data | curl --location-trusted -u user: passwd -T--H "columns: dt, page, user_id, user_id = to_bitmap (user_id)" http: // host: 8410 / api / test / testDb / _stream_load
```
```
cat data | curl --location-trusted -u user: passwd -T--H "columns: dt, page, user_id, user_id = bitmap_hash (user_id)" http: // host: 8410 / api / test / testDb / _stream_load
```
```
cat data | curl --location-trusted -u user: passwd -T--H "columns: dt, page, user_id, user_id = bitmap_empty ()" http: // host: 8410 / api / test / testDb / _stream_load
```
#### Insert Into

id2のカラムタイプはbitmapです

```
insert into bitmap_table1 select id, id2 from bitmap_table2;
```
id2のcolumn typeはbitmapです

```
INSERT INTO bitmap_table1 (id, id2) VALUES (1001, to_bitmap (1000)), (1001, to_bitmap (2000));
```
id2の列タイプはbitmapです

```
insert into bitmap_table1 select id, bitmap_union (id2) from bitmap_table2 group by id;
```
id2のカラム型はintです

```
insert into bitmap_table1 select id, to_bitmap (id2) from table;
```
id2のカラム型はStringです

```
insert into bitmap_table1 select id, bitmap_hash (id_string) from table;
```
