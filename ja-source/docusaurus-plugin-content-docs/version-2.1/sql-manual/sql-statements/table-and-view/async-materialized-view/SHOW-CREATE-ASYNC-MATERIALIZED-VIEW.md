---
{
  "title": "SHOW CREATE ASYNC MATERIALIZED VIEW",
  "language": "ja",
  "description": "マテリアライズドビューの作成文を表示します。"
}
---
## 説明

マテリアライズドビューの作成文を表示します。

## 構文

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name>
```
## 必須パラメータ

**1. `<materialized_view_name>`**

> マテリアライズドビューの名前。

## 戻り値

|カラム名 | 説明   |
| -- |------|
| Materialized View | マテリアライズドビューの名前   |
| Create Materialized View | マテリアライズドビューの作成に使用されるステートメント |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考                                                       |
| --------- | ------ | ----------------------------------------------------------- |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | Table  | |

## 例

1. 非同期マテリアライズドビューの作成ステートメントを表示する

   ```sql
   SHOW CREATE MATERIALIZED VIEW partition_mv;
   ```
