---
{
  "title": "CLEAN ALL PROFILE",
  "description": "このコマンドは、すべての履歴クエリまたは負荷プロファイルを手動でクリアするために使用されます。",
  "language": "ja"
}
---
## 説明

このコマンドは、すべての履歴クエリまたはロードプロファイルを手動でクリアするために使用されます。

## 構文

```sql
CLEAN ALL PROFILE
```
## Access Control Requirements

このSQLコマンドを実行するユーザーは、最低限以下の権限を持っている必要があります：

| Privilege    | Object    | 注釈                                                |
|:--------------|:-----------|:-----------------------------------------------------|
| GRANT_PRIV         | DATABASE   | CLEAN文にはGRANT権限が必要です |

## Examples

```sql
CLEAN ALL PROFILE
```
