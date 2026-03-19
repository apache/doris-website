---
{
  "title": "SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS",
  "description": "非軽量スキーマ変更OLAPTableから軽量スキーマ変更tableへの変換プロセスを表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

軽量スキーマ変更ではないOLAPTableから軽量スキーマ変更tableへの変換プロセスを確認するために使用されます。

## Syntax

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [ FROM <db_name> ]
```
## オプションパラメータ

**1. `<db_name>`**
> クエリ対象となるデータベース名をFROM句で指定できます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | 注釈 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | 現在この操作を実行するには**ADMIN**権限のみサポートしています |

## 使用上の注意

- このステートメントを実行するには、設定`enable_convert_light_weight_schema_change`を有効にする必要があります。

## 例

- データベースtestでの変換を表示

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
  ```
- グローバル変換ステータスの表示

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
  ```
