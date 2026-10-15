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

| 列名 | 説明 |
| -- | -- |
| Materialized View | マテリアライズドビューの名前 |
| Create Materialized View | マテリアライズドビューの作成に使用した文 |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
| -- | -- | -- |
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV | テーブル | |

## 例

1. 非同期マテリアライズドビューの作成文を表示する

   ```sql
   SHOW CREATE MATERIALIZED VIEW partition_mv;
   ```
