---
{
  "title": "バックエンドの廃止",
  "language": "ja",
  "description": "このステートメントは、BEノードをクラスターから安全に廃止するために使用されます。この操作は非同期です。"
}
---
## 説明

このステートメントは、クラスタからBEノードを安全に廃止するために使用されます。この操作は非同期です。

## 構文

```sql
ALTER SYSTEM DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```
ここで：

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```
## 必須パラメータ

**1. <be_host>**

> BE ノードのホスト名または IP アドレスを指定できます。

**2. <heartbeat_port>**

> BE ノードのハートビートポートです。デフォルトは 9050 です。

**3. <backend_id>**

> BE ノードの ID です。

:::tip
`<be_host>`、`<be_heartbeat_port>`、および `<backend_id>` はすべて [SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントでクエリして取得できます。
:::

## アクセス制御要件

この SQL を実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを実行した後、[SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントを使用して廃止状況（`SystemDecommissioned` 列の値が `true`）と廃止進行状況（`TabletNum` 列の値が徐々に 0 まで減少）を確認できます。
2. 通常の状況では、`TabletNum` 列の値が 0 まで減少した後、この BE ノードは削除されます。Doris に BE を自動削除させたくない場合は、FE Master の設定 `drop_backend_after_decommission` を false に変更できます。
3. 現在の BE に比較的大量のデータが格納されている場合、DECOMMISSION 操作は数時間または数日間続く可能性があります。
4. DECOMMISSION 操作の進行が停滞した場合、具体的には [SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントの `TabletNum` 列が特定の値で固定されたままの場合、以下の状況が原因である可能性があります：
   - 現在の BE 上のタブレットを移行するのに適した他の BE が存在しない。例えば、3 つのレプリカを持つテーブルがある 3 ノードクラスタで、そのうちの 1 つのノードを廃止する場合、このノードはデータを移行する他の BE を見つけることができません（他の 2 つの BE はすでにそれぞれ 1 つのレプリカを持っています）。
   - 現在の BE 上のタブレットがまだ[ゴミ箱](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md)にある。ゴミ箱を空にしてから廃止を待つことができます。
   - 現在の BE 上のタブレットが大きすぎるため、単一のタブレットの移行が常にタイムアウトし、このタブレットを移行できない。FE Master の設定 `max_clone_task_timeout_sec` をより大きな値に調整できます（デフォルトは 7200 秒）。
   - 現在の BE のタブレット上に未完了のトランザクションがある。トランザクションの完了を待つか、手動でトランザクションを中止できます。
   - その他の場合、FE Master のログでキーワード `replicas to decommission` をフィルタリングして異常なタブレットを見つけ、[SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md) ステートメントを使用してこのタブレットが属するテーブルを見つけ、その後新しいテーブルを作成し、古いテーブルから新しいテーブルにデータを移行し、最後に [DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md) を使用して古いテーブルを削除できます。

## 例

1. BE の Host と HeartbeatPort に従ってクラスタから 2 つのノードを安全に廃止する。

   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEのIDに従って、クラスターからノードを安全に廃止します。

    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
