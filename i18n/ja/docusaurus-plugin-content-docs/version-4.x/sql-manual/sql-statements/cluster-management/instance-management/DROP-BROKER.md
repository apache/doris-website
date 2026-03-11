---
{
  "title": "DROP BROKER",
  "description": "この文は BROKER ノードを削除するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはBROKERノードを削除するために使用されます。

## Syntax

1. すべてのBrokerを削除

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```
2. 1つまたは複数のBrokerノードを削除する

    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## 必須パラメータ

**1. `<broker_name>`**

削除対象のbrokerプロセスの名前。

**2. `<host>`**

削除対象のbrokerプロセスが配置されているノードのIP。FQDNが有効な場合は、ノードのFQDNを使用します。

**3. `<ipc_port>`**
削除対象のbrokerプロセスが配置されているノードのPORT。このポートのデフォルト値は8000です。


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
