---
{
  "title": "DROP MATERIALIZED VIEW",
  "description": "同期されたマテリアライズドビューを削除します。",
  "language": "ja"
}
---
## 説明

同期化されたマテリアライズドビューを削除します。

## 構文

```sql
DROP MATERIALIZED VIEW 
[ IF EXISTS ] <materialized_view_name>
ON <table_name>
```
## 必須パラメータ

**1. `<materialized_view_name>`**

> 削除対象のマテリアライズドビューの名前。

**2. `<table_name>`**

> マテリアライズドビューが属するTable。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：

| Privilege  | Object | 注釈                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table  | 削除対象のマテリアライズドビューが属するTableに対するALTER_PRIV権限が必要 |

## 例

`lineitem`Table上の同期マテリアライズドビュー`sync_agg_mv`を削除

```sql
DROP MATERIALIZED VIEW sync_agg_mv on lineitem;
```
