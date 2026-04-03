---
{
  "title": "DROP BROKER",
  "language": "ja",
  "description": "このステートメントはBROKERノードを削除するために使用されます。"
}
---
## 説明

このステートメントはBROKERノードを削除するために使用されます。

## 構文

1. 全てのBrokerを削除

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```
2. 1つ以上のBrokerノードを削除する

    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## 必須パラメータ

**1. `<broker_name>`**

削除するbrokerプロセスの名前。

**2. `<host>`**

削除するbrokerプロセスが配置されているノードのIP。FQDNが有効になっている場合は、ノードのFQDNを使用してください。

**3. `<ipc_port>`**
削除するbrokerプロセスが配置されているノードのPORT。このポートのデフォルト値は8000です。


## アクセス制御要件
この操作を実行するユーザーは、NODE_PRIV権限を持つ必要があります。

## 例

1. すべてのBrokerを削除

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name.
    ```
2. 特定のBrokerノードを削除する

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```
