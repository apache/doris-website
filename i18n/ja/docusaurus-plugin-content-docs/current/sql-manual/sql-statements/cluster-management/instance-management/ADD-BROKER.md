---
{
    "title": "ADD BROKER",
    "language": "ja",
    "description": "この文は、一つ以上の BROKER ノードを追加するために使用します。"
}
---

## 説明

この文は、一つ以上の BROKER ノードを追加するために使用します。

## 構文

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [, "<host>:<ipc_port>" [, ... ] ];
```

## 必須パラメータ

**1. `<broker_name>`**

追加する Broker プロセスに付ける名前です。同じクラスター内では、broker_name を統一することを推奨します。

**2. `<host>`**

Broker プロセスを追加するノードの IP アドレスです。FQDN が有効な場合は、ノードの FQDN を使用します。

**3. `<ipc_port>`**

Broker プロセスを追加するノードのポート番号です。このポートのデフォルト値は 8000 です。


## アクセス権限の要件
この操作を実行するユーザーには、NODE_PRIV 権限が必要です。

## 例

1. 二つの Broker を追加する

    ```sql
    ALTER SYSTEM ADD BROKER broker1 "host1:port", "host2:port";
    ```
2. FQDN を使用して Broker を追加する

    ```sql
    ALTER SYSTEM ADD BROKER broker1 "broker_fqdn1:port";
    ```
