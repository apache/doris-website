---
{
    "title": "ADMIN CLEAN TRASH",
    "language": "ja",
    "description": "このステートメントは、バックエンドの不要データを消去するために使用します。"
}
---

## 説明

このステートメントは、バックエンドの不要データを消去するために使用します。

## 構文

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])]
```

## オプションパラメータ

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

クリーンアップ対象のバックエンドを指定します。ON を指定しない場合、デフォルトですべてのバックエンドが対象になります。


## アクセス権限要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。


| 権限  | 対象 | 備考                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | ユーザーまたはロール  | ADMIN_PRIV 権限を持つユーザーまたはロールのみが CLEAN TRASH 操作を実行できます。 |


## 例

```sql
-- Clean up the junk data of all be nodes.
ADMIN CLEAN TRASH;
```

```sql
-- Clean up garbage data for '192.168.0.1:9050' and '192.168.0.2:9050'.
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```
