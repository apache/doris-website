---
{
  "title": "SHOW CONVERT LIGHT SCHEMA CHANGE PROCESSを表示",
  "language": "ja",
  "description": "非軽量スキーマ変更OLAPテーブルから軽量スキーマ変更テーブルへの変換プロセスを表示するために使用されます。"
}
---
## 説明

非軽量スキーマ変更OLAPテーブルから軽量スキーマ変更テーブルへの変換プロセスを表示するために使用されます。

## 構文

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [ FROM <db_name> ]
```
## オプションパラメータ

**1. `<db_name>`**
> FROM句で照会するデータベースの名前を指定できます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | 現在、この操作を実行するには**ADMIN**権限のみサポートしています |

## 使用上の注意

- このステートメントを実行するには、設定`enable_convert_light_weight_schema_change`を有効にする必要があります。

## 例

- データベースtestでの変換を表示

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
  ```
- グローバル変換ステータスを表示

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
  ```
