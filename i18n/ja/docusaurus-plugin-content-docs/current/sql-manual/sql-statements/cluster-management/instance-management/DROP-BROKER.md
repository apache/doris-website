---
{
    "title": "DROP BROKER",
    "language": "ja",
    "description": "このステートメントは、BROKER ノードを削除します。"
}
---

## 説明

このステートメントは、BROKER ノードを削除します。

## 構文

1. すべての BROKER を削除する
    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. 単一または複数の BROKER ノードを削除する
    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## 必須パラメータ

**1. `<broker_name>`**

削除する BROKER プロセスの名前です。

**2. `<host>`**

削除する BROKER プロセスが配置されているノードの IP アドレスです。FQDN が有効な場合は、そのノードの FQDN を使用します。

**3. `<ipc_port>`**
削除する BROKER プロセスが配置されているノードのポートです。このポートのデフォルト値は 8000 です。


## アクセス制御要件
この操作を実行するユーザーには、NODE_PRIV 権限が必要です。

## 例

1. すべての BROKER を削除する

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. 特定の BROKER ノードを削除する

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```
