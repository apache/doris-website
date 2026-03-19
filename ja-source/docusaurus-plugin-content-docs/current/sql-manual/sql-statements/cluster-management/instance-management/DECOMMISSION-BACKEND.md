---
{
  "title": "バックエンドの廃止",
  "language": "ja",
  "description": "このステートメントは、クラスターからBEノードを安全に廃止するために使用されます。この操作は非同期です。"
}
---
## 説明

このステートメントは、クラスターからBEノードを安全に廃止するために使用されます。この操作は非同期です。

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

> BE nodeのホスト名またはIPアドレスを指定できます。

**2. <heartbeat_port>**

> BE nodeのheartbeat port。デフォルトは9050です。

**3. <backend_id>**

> BE nodeのIDです。

:::tip
`<be_host>`、`<be_heartbeat_port>`、および`<backend_id>`は、すべて[SHOW BACKENDS](./SHOW-BACKENDS.md)文でクエリして取得できます。
:::

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを実行した後、[SHOW BACKENDS](./SHOW-BACKENDS.md)文を使用して、廃止ステータス（`SystemDecommissioned`列の値が`true`）と廃止の進行状況（`TabletNum`列の値が徐々に0まで下がる）を確認できます。
2. 通常の状況では、`TabletNum`列の値が0まで下がった後、このBE nodeが削除されます。DorisにBEを自動的に削除させたくない場合は、FE Masterの設定`drop_backend_after_decommission`をfalseに変更できます。
3. 現在のBEが比較的大量のデータを保存している場合、DECOMMISSION操作は数時間または数日間続く可能性があります。
4. DECOMMISSION操作の進行状況が停滞する場合、具体的には[SHOW BACKENDS](./SHOW-BACKENDS.md)文の`TabletNum`列が特定の値で固定されている場合、以下の状況が原因である可能性があります：
   - 現在のBE上のtabletを移行するのに適した他のBEが存在しない。例えば、3つのreplicaを持つテーブルがある3ノードクラスターで、そのうち1つのnodeを廃止する場合、このnodeはデータを移行する他のBEを見つけることができません（他の2つのBEはすでにそれぞれ1つのreplicaを持っているため）。
   - 現在のBE上のtabletがまだ[Recycle Bin](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md)にある。[recycle binを空にして](../../recycle/DROP-CATALOG-RECYCLE-BIN.md)から、廃止を待つことができます。
   - 現在のBE上のtabletが大きすぎるため、単一tabletの移行が常にタイムアウトし、このtabletを移行できない。FE Masterの設定`max_clone_task_timeout_sec`をより大きな値に調整できます（デフォルトは7200秒）。
   - 現在のBEのtablet上に未完了のトランザクションがある。トランザクションの完了を待つか、手動でトランザクションを中止できます。
   - その他の場合は、FE Masterのログでキーワード`replicas to decommission`をフィルタリングして異常なtabletを見つけ、[SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md)文を使用してこのtabletが属するテーブルを見つけ、新しいテーブルを作成し、古いテーブルから新しいテーブルにデータを移行し、最後に[DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md)を使用して古いテーブルを削除します。

## 例

1. BEのHostとHeartbeatPortに従って、クラスターから2つのnodeを安全に廃止する。

   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEのIDに従って、クラスターからノードを安全に廃止する。

    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
