---
{
  "title": "SHOW CREATE SYNC MATERIALIZED VIEW",
  "description": "マテリアライズドビューの作成ステートメントを表示します。",
  "language": "ja"
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

> マテリアライズドビューが属するTable。

## 戻り値

|カラム名 | 説明   |
| -- |------|
| TableName | Tableの名前   |
| ViewName | マテリアライズドビューの名前 |
| CreateStmt | マテリアライズドビューを作成するために使用されるステートメント |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考                                                        |
| --------- | ------ | ------------------------------------------------------------ |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | Table  | 現在のマテリアライズドビューが属するTableに対する権限が必要です |

## 例

1. 同期マテリアライズドビューの作成ステートメントを表示する

   ```sql
   SHOW CREATE MATERIALIZED VIEW sync_agg_mv on lineitem;
   ```
