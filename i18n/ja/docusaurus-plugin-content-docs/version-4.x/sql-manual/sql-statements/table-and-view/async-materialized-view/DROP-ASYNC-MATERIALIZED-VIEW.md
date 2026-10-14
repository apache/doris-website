---
{
    "title": "DROP ASYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "この文は非同期マテリアライズドビューの削除に使用します。"
}
---

## 説明

この文は非同期マテリアライズドビューの削除に使用します。

構文:

```sql
DROP MATERIALIZED VIEW (IF EXISTS)? mvName=multipartIdentifier
```


1. IF EXISTS:
   マテリアライズドビューが存在しない場合、エラーを発生させません。このキーワードを指定せず、マテリアライズドビューが存在しない場合は、エラーが報告されます。

2. mv_name:
   削除するマテリアライズドビューの名前。必須項目です。

## 例

1. テーブルのマテリアライズドビュー mv1 を削除します。

```sql
DROP MATERIALIZED VIEW mv1;
```
2.存在する場合、指定したデータベースのマテリアライズドビューを削除します。

```sql
DROP MATERIALIZED VIEW IF EXISTS db1.mv1;
```

## キーワード

    DROP, ASYNC, MATERIALIZED, VIEW

## ベストプラクティス

