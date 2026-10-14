---
{
    "title": "SHOW CREATE SYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "マテリアライズドビューの作成文を表示します。"
}
---

## 説明

マテリアライズドビューの作成文を表示します。

## 構文

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name> ON <table_name>
```

## 必須パラメータ

**1. `<materialized_view_name>`**

> マテリアライズドビューの名前。

**2. `<table_name>`**

> マテリアライズドビューが属するテーブル。

## 戻り値

| 列名 | 説明 |
| -- | -- |
| TableName | テーブルの名前 |
| ViewName | マテリアライズドビューの名前 |
| CreateStmt | マテリアライズドビューの作成に使用された文 |

## アクセス制御の要件

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限 | オブジェクト | 備考 |
| --------- | ------ | ------------------------------------------------------------ |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | テーブル | 対象のマテリアライズドビューが属するテーブルに対する権限が必要です |

## 例

1. 同期マテリアライズドビューの作成文を表示します。

   ```sql
   SHOW CREATE MATERIALIZED VIEW sync_agg_mv on lineitem;
   ```
