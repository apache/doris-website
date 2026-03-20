---
{
  "title": "全プロファイルをクリーン",
  "description": "このコマンドは、すべての履歴クエリまたはロードプロファイルを手動でクリアするために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このコマンドは、すべての履歴クエリまたは負荷プロファイルを手動でクリアするために使用されます。

## Syntax

```sql
CLEAN ALL PROFILE
```
## Access Control Requirements

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege    | Object    | 注釈                                                |
|:--------------|:-----------|:-----------------------------------------------------|
| GRANT_PRIV         | DATABASE   | CLEAN文にはGRANT権限が必要です |

## Examples

```sql
CLEAN ALL PROFILE
```
