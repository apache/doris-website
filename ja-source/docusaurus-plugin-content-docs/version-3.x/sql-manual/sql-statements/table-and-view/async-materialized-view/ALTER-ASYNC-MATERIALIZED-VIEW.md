---
{
  "title": "ALTER ASYNC MATERIALIZED VIEW",
  "description": "この文は非同期マテリアライズドビューを変更するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは非同期マテリアライズドビューを変更するために使用されます。

#### syntax

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
マテリアライズドビューに固有のプロパティを変更する

例えば、mv1のgrace_periodを3000msに変更する

```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

##### REPLACE

```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
2つのマテリアライズドビューでアトムを置き換える

swapのデフォルトはTRUE
- swapパラメータがTRUEに設定されている場合、マテリアライズドビューmv1をmv2にリネームし、同時にmv2をmv1にリネームすることと同等です
- swapパラメータがFALSEに設定されている場合、mv2をmv1にリネームし、元のmv1を削除することと同等です

例えば、mv1とmv2の名前を交換したい場合

```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```
例えば、mv2をmv1にリネームして、元のmv1を削除したい場合

```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```
## Keywords

    ALTER, ASYNC, MATERIALIZED, VIEW
