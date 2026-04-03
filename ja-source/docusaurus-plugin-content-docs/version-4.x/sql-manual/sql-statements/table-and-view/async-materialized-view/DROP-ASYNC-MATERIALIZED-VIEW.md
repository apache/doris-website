---
{
  "title": "DROP ASYNC MATERIALIZED VIEW",
  "description": "この文は非同期マテリアライズドビューを削除するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、非同期マテリアライズドビューを削除するために使用されます。

構文:

```sql
DROP MATERIALIZED VIEW (IF EXISTS)? mvName=multipartIdentifier
```
1. IF EXISTS:
   マテリアライズドビューが存在しない場合、エラーをスローしません。このキーワードが宣言されておらず、マテリアライズドビューが存在しない場合、エラーが報告されます。

2. mv_name:
   削除するマテリアライズドビューの名前。必須フィールドです。

## 例

1. Tableマテリアライズドビューmv1を削除

```sql
DROP MATERIALIZED VIEW mv1;
```
2.存在する場合、指定されたデータベースのマテリアライズドビューを削除する

```sql
DROP MATERIALIZED VIEW IF EXISTS db1.mv1;
```
## Keywords

    DROP, ASYNC, MATERIALIZED, VIEW

## ベストプラクティス
