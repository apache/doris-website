---
{
  "title": "バックエンドの廃止",
  "description": "この文は、クラスターからBEノードを安全に廃止するために使用されます。この操作は非同期です。",
  "language": "ja"
}
---
## 説明

このステートメントは、クラスターからBEノードを安全に廃止するために使用されます。この操作は非同期です。

## 構文

```sql
ALTER SYSTEM DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```
どこで:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```
## 必須パラメーター

**1. <be_host>**

> BEノードのホスト名またはIPアドレスを指定できます。

**2. <heartbeat_port>**

> BEノードのハートビートポートです。デフォルトは9050です。

**3. <backend_id>**

> BEノードのIDです。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>`はすべて[SHOW BACKENDS](./SHOW-BACKENDS.md)文でクエリして取得できます。
:::

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを実行した後、[SHOW BACKENDS](./SHOW-BACKENDS.md)文を使用して、廃止ステータス（`SystemDecommissioned`列の値が`true`）と廃止の進行状況（`TabletNum`列の値が徐々に0まで減少）を確認できます。
2. 通常の状況では、`TabletNum`列の値が0まで減少した後、このBEノードは削除されます。DorisにBEを自動的に削除させたくない場合は、FE Masterのコンフィギュレーション`drop_backend_after_decommission`をfalseに変更できます。
3. 現在のBEが比較的大量のデータを格納している場合、DECOMMISSION操作は数時間または数日続く可能性があります。
4. DECOMMISSION操作の進行状況が停滞した場合、具体的には[SHOW BACKENDS](./SHOW-BACKENDS.md)文の`TabletNum`列が特定の値で固定される場合、以下の状況が原因である可能性があります：
   - 現在のBE上のタブレットを移行するための適切な他のBEが存在しない。例えば、3レプリカのTableを持つ3ノードクラスターで、そのうちの1つのノードを廃止する場合、このノードはデータを移行する他のBEを見つけることができません（他の2つのBEはすでにそれぞれ1つのレプリカを持っています）。
   - 現在のBE上のタブレットがまだ[ごみ箱](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md)に存在している。[ごみ箱を空にして](../../recycle/DROP-CATALOG-RECYCLE-BIN.md)から廃止を待つことができます。
   - 現在のBE上のタブレットが大きすぎて、単一タブレットの移行が常にタイムアウトし、このタブレットを移行できない。FE Masterのコンフィギュレーション`max_clone_task_timeout_sec`をより大きな値に調整できます（デフォルトは7200秒）。
   - 現在のBEのタブレット上に未完了のトランザクションが存在している。トランザクションの完了を待つか、手動でトランザクションを中止できます。
   - その他の場合、FE Masterのログで`replicas to decommission`キーワードをフィルタリングして異常なタブレットを見つけ、[SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md)文を使用してこのタブレットが属するTableを見つけ、新しいTableを作成し、古いTableから新しいTableにデータを移行し、最後に[DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md)を使用して古いTableを削除します。

## 例

1. BEのHostとHeartbeatPortに従って、クラスターから2つのノードを安全に廃止する。

   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEのIDに従って、クラスターからノードを安全に廃止する。

    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
