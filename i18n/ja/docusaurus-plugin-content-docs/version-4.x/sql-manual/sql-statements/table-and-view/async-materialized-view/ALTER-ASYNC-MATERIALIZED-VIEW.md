---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "この文は非同期マテリアライズドビューを変更するために使用します。"
}
---

## 説明

この文は非同期マテリアライズドビューを変更するために使用します。

#### 構文

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### 補足

##### RENAME

マテリアライズドビューの名前を変更します。

たとえば、mv1 の名前を mv2 に変更します。
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod

[非同期マテリアライズドビューの作成](./CREATE-ASYNC-MATERIALIZED-VIEW)と同じです。

##### refreshTrigger

[非同期マテリアライズドビューの作成](./CREATE-ASYNC-MATERIALIZED-VIEW)と同じです。

##### SET
マテリアライズドビュー固有のプロパティを変更します。

たとえば、mv1 の grace_period を 3000ms に変更します。
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

##### REPLACE
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
二つのマテリアライズドビューをアトミックに置き換えます。

swap のデフォルト値は TRUE です。
- swap パラメータを TRUE に設定すると、マテリアライズドビュー mv1 を mv2 に、同時に mv2 を mv1 に名前変更するのと同じです。
- swap パラメータを FALSE に設定すると、mv2 を mv1 に名前変更し、元の mv1 を削除するのと同じです。

たとえば、mv1 と mv2 の名前を入れ替える場合は、次のようにします。
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

たとえば、mv2 の名前を mv1 に変更して元の mv1 を削除する場合は、次のようにします。
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## キーワード

    ALTER, ASYNC, MATERIALIZED, VIEW

