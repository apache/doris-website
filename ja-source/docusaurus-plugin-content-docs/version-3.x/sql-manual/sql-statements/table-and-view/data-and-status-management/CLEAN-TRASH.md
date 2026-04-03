---
{
  "title": "ADMIN CLEAN TRASH",
  "description": "この文は、バックエンドのガベージデータをクリアするために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、バックエンドのガベージデータをクリアするために使用されます。

## Syntax

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])]
```
## オプションパラメータ

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

クリーンアップ対象のbackendを指定します。ONを追加しない場合、デフォルトですべてのbackendがクリアされます。


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：


| Privilege  | Object | 注釈                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | User or Role  | ADMIN_PRIV権限を持つユーザーまたはロールのみがCLEAN TRASH操作を実行できます。 |


## 例

```sql
-- Clean up the junk data of all be nodes.
ADMIN CLEAN TRASH;
```
```sql
-- Clean up garbage data for '192.168.0.1:9050' and '192.168.0.2:9050'.
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```
