---
{
  "title": "管理者ゴミ箱を空にする",
  "language": "ja",
  "description": "この文は、バックエンドのガベージデータをクリアするために使用されます。"
}
---
## 説明

この文はバックエンドのガベージデータをクリアするために使用されます。

## 構文

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])]
```
## オプションパラメータ

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

クリーンアップするバックエンドを指定します。ONを追加しない場合、デフォルトですべてのバックエンドがクリアされます。


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：


| 権限  | オブジェクト | 備考                                        |
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
