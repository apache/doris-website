---
{
    "title": "DECOMMISSION BACKEND",
    "language": "ja",
    "description": "このステートメントは、クラスターから BE ノードを安全に廃止するために使用します。この操作は非同期です。"
}
---

## 説明

このステートメントは、クラスターから BE ノードを安全に廃止するために使用します。この操作は非同期です。

## 構文

```sql
ALTER SYSTEM DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

ここで:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 必須パラメータ

**1. <be_host>**

> BE ノードのホスト名または IP アドレスを指定します。

**2. <heartbeat_port>**

> BE ノードのハートビートポートを指定します。デフォルトは 9050 です。

**3. <backend_id>**

> BE ノードの ID を指定します。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>` は、いずれも [SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントで確認できます。
:::

## アクセス制御要件

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを実行した後、[SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントで廃止状態（`SystemDecommissioned` 列の値が `true`）と進捗（`TabletNum` 列の値が徐々に 0 まで減少）を確認できます。
2. 通常、`TabletNum` 列の値が 0 になると、この BE ノードは削除されます。Doris に BE を自動削除させたくない場合は、FE Master の設定項目 `drop_backend_after_decommission` を false に変更できます。
3. 対象の BE に比較的大量のデータが保存されている場合、DECOMMISSION 操作には数時間、場合によっては数日かかることがあります。
4. DECOMMISSION 操作の進捗が止まり、[SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントの `TabletNum` 列の値が変化しない場合、次の原因が考えられます。
   - 対象の BE 上のタブレットを移行できる、適切な別の BE がありません。たとえば、3 ノードのクラスターに 3 レプリカのテーブルがある場合、いずれかのノードを廃止しようとしても、残りの二台の BE にはすでにそれぞれ一つのレプリカがあるため、データの移行先が見つかりません。
   - 対象の BE 上のタブレットがまだ[ごみ箱](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md)にあります。[ごみ箱を空にする](../../recycle/DROP-CATALOG-RECYCLE-BIN.md)操作を行い、その後、廃止処理の完了を待ちます。
   - 対象の BE 上のタブレットが大きすぎるため、単一タブレットの移行が毎回タイムアウトし、移行できません。FE Master の設定項目 `max_clone_task_timeout_sec` をより大きな値に変更できます（デフォルトは 7200 秒です）。
   - 対象の BE 上のタブレットに未完了のトランザクションがあります。トランザクションが完了するまで待つか、手動で中止できます。
   - その他の場合は、FE Master のログで `replicas to decommission` というキーワードを検索して問題のあるタブレットを特定し、[SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md) ステートメントでそのタブレットが属するテーブルを調べます。その後、新しいテーブルを作成して古いテーブルからデータを移行し、最後に [DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md) を使用して古いテーブルを削除します。

## 例

1. BE の Host と HeartbeatPort を指定して、クラスターから二つのノードを安全に廃止します。
   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. BE の ID を指定して、クラスターからノードを安全に廃止します。
    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
