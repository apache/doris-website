---
{
    "title": "SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS",
    "language": "ja",
    "description": "軽量スキーマ変更に対応していない OLAP テーブルを、対応するテーブルへ変換する処理の進捗を表示します。"
}
---

## 説明

軽量スキーマ変更に対応していない OLAP テーブルを、対応するテーブルへ変換する処理の進捗を表示します。

## 構文

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [ FROM <db_name> ]
```

## 任意パラメータ

**1. `<db_name>`**
> FROM 句で照会するデータベース名を指定できます。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | 現在、この操作を実行できるのは **ADMIN** 権限を持つユーザーのみです |

## 使用上の注意

- この文を実行するには、設定 `enable_convert_light_weight_schema_change` を有効にする必要があります。

## 例

- test データベースの変換状況を表示します

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
  ```

- 全体の変換状況を表示します

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
  ```