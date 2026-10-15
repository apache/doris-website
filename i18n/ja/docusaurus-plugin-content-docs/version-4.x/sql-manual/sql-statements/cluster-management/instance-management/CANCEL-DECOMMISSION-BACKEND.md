---
{
    "title": "CANCEL DECOMMISSION BACKEND",
    "language": "ja",
    "description": "このステートメントは、BE ノードのデコミッション操作を取り消すために使用します。"
}
---

## 説明

このステートメントは、BE ノードのデコミッション操作を取り消すために使用します。

:::tip
ストレージとコンピュートを分離したモードでは、このステートメントはサポートされません。
:::

## 構文

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

識別子の形式は次のとおりです。

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 必須パラメータ

**<be_host>**

> BE ノードのホスト名または IP アドレスを指定します。

**<heartbeat_port>**

> BE ノードのハートビートポートを指定します。デフォルトは 9050 です。

**<backend_id>**

> BE ノードの ID を指定します。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>` は、[SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントで確認できます。
:::

## アクセス制御要件

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドの実行後、デコミッション状態（`SystemDecommissioned` 列の値が false になること）と進行状況（`TabletNum` 列の値が徐々に減少しなくなること）を [SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントで確認できます。
2. クラスタは他のノードから現在の BE にタブレットを徐々に移行し、最終的に各 BE のタブレット数が近い値になるようにします。

## 例

1. BE ノードの Host と HeartbeatPort を指定して、クラスタ内の二つのノードのデコミッションを取り消します。
   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. BE ノードの ID を指定して、クラスタ内の一つのノードのデコミッションを取り消します。
   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
