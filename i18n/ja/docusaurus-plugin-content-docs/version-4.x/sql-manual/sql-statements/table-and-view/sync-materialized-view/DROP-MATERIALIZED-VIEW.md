---
{
    "title": "DROP MATERIALIZED VIEW",
    "language": "ja",
    "description": "同期マテリアライズドビューを削除します。"
}
---

## 説明

同期マテリアライズドビューを削除します。

## 構文


```sql
DROP MATERIALIZED VIEW 
[ IF EXISTS ] <materialized_view_name>
ON <table_name>
```

## 必須パラメータ

**1. `<materialized_view_name>`**

> 削除するマテリアライズドビューの名前。

**2. `<table_name>`**

> マテリアライズドビューが属するテーブル。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限       | 対象     | 備考 |
| ---------- | -------- | ---- |
| ALTER_PRIV | テーブル | 削除するマテリアライズドビューが属するテーブルに対する ALTER_PRIV 権限が必要です。 |

## 例

`lineitem` テーブルの同期マテリアライズドビュー `sync_agg_mv` を削除します。


```sql
DROP MATERIALIZED VIEW sync_agg_mv on lineitem;
```
