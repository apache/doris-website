---
{
  "title": "ALTER ASYNC MATERIALIZED VIEW",
  "language": "ja",
  "description": "この文は非同期マテリアライズドビューを変更するために使用されます。"
}
---
## 説明

このステートメントは非同期マテリアライズドビューを変更するために使用されます。

#### 構文

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```
#### illustrate

##### RENAME

マテリアライズドビューの名前を変更するために使用されます

例えば、mv1の名前をmv2に変更する場合

```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```
##### refreshMethod

[非同期マテリアライズドビューの作成](./CREATE-ASYNC-MATERIALIZED-VIEW)と同じ

##### refreshTrigger

[非同期マテリアライズドビューの作成](./CREATE-ASYNC-MATERIALIZED-VIEW)と同じ

##### SET
マテリアライズドビューに固有のプロパティを変更します

例えば、mv1のgrace_periodを3000msに変更する場合

```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```
##### 置換

```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
2つのマテリアライズドビューでatomを置き換える

swap defaultはTRUE
- swapパラメータがTRUEに設定されている場合、マテリアライズドビューmv1をmv2に名前変更し、同時にmv2をmv1に名前変更することと同等です
- swapパラメータがFALSEに設定されている場合、mv2をmv1に名前変更し、元のmv1を削除することと同等です

例えば、mv1とmv2の名前を入れ替えたい場合

```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```
例えば、mv2をmv1にリネームし、元のmv1を削除したい場合

```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```
## キーワード

    ALTER, ASYNC, MATERIALIZED, VIEW
