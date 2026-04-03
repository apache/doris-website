---
{
  "title": "ブローカーを追加",
  "language": "ja",
  "description": "このステートメントは、1つまたは複数のBROKERノードを追加するために使用されます。"
}
---
## 説明

このステートメントは、1つ以上のBROKERノードを追加するために使用されます。

## 構文

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [, "host>:<ipc_port>" [, ... ] ];
```
## 必須パラメータ

**1. `<broker_name>`**

追加するbrokerプロセスに付与される名前。同一クラスタ内では、broker_nameを一貫して保つことを推奨します。

**2. `<host>`**

brokerプロセスを追加する必要があるノードのIP。FQDNが有効化されている場合は、ノードのFQDNを使用してください。

**3. `<ipc_port>`**

brokerプロセスを追加する必要があるノードのPORT。このポートのデフォルト値は8000です。


## アクセス制御要件
この操作を実行するユーザーは、NODE_PRIV権限を持つ必要があります。

## 例

1. 2つのBrokerを追加する

    ```sql
    ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
    ```
2. FQDNを使用してBrokerを追加する

    ```sql
    ALTER SYSTEM ADD BROKER "broker_fqdn1:port";
    ```
