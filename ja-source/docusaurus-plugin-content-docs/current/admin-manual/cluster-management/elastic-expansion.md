---
{
  "title": "エラスティックスケーリング",
  "language": "ja",
  "description": "Dorisはオンライン弾性スケーリングをサポートしており、ユーザーはサービスを中断することなく動的にノードを追加または削除することができます。"
}
---
Dorisはオンライン弾性スケーリングをサポートしており、ユーザーはサービスを中断することなく動的にノードを追加または削除できます。この機能により、企業は増大する需要に対応したり、アイドル状態のリソースの無駄を削減したりすることができます。BEノードのスケールアップまたはスケールダウンはクラスタの可用性に影響しませんが、データ移行を伴うため、ビジネス活動が少ない期間にスケーリング操作を実行することを推奨します。

## FEクラスタのScale In/Out

Doris FEノードは以下の3つの役割に分かれており、各FEノードには完全なメタデータセットが含まれています：

* Master Node：メタデータの読み書きを担当します。Masterノードでメタデータの変更が発生すると、BDB JEプロトコル経由でnon-Masterノードに同期されます。クラスタ内にはMaster FEノードは1つのみ存在できます。

* Follower Node：メタデータの読み取りを担当します。Masterノードに障害が発生した場合、Followerノードがリーダー選出を開始して新しいMasterノードを選択します。クラスタ内では、MasterノードとFollowerノードの総数は奇数にすることを推奨します。

* Observer Node：メタデータの読み取りを担当しますが、リーダー選出には参加しません。FEノードの読み取りサービス容量を拡張するために使用されます。

通常、各FEノードは10-20個のBEノードの負荷操作を処理できます。3つのFEノードの構成は、ほとんどのビジネスシナリオの要件を満たすのに十分です。

### FEのscale out

:::info Note:

新しいFEノードを追加する際は、以下に注意してください：

* 新しいFEノードの`http_port`は、クラスタ内の既存のすべてのFEノードの`http_port`と一致している必要があります。

* Followerノードを追加する場合、クラスタ内のMasterノードとFollowerノードの総数は奇数にすることを推奨します。

* 現在のクラスタノードのポートと役割は、`show frontends`コマンドを使用して確認できます。
:::

1. FE Nodeの開始：

```bash
fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
```
* FE ノードの登録:

  * ノードをFollower FEとして登録:

    ```sql
    ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
    ```
* ノードをObserver FEとして登録する：

    ```sql
    ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
    ```
* 新しく追加されたFEノードのステータスを確認する

  ```sql
  show frontends;
  ```
### FE クラスタのスケールイン

FE ノードをスケールインする際は、クラスタ内の Master と Follower ノードの総数が奇数のままになるようにしてください。以下のコマンドを使用してノードを削除します：

```sql
ALTER SYSTEM DROP FOLLOWER[OBSERVER] "<fe_host>:<edit_log_port>";
```
スケールイン後、FEディレクトリを手動で削除する必要があります。

## BEクラスターのスケールイン/アウト

### BEクラスターのスケールアウト

1. BEプロセスを開始します：

   ```sql
   be/bin/start_be.sh
   ```
2. BEノードを登録する：

   ```sql
   ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
   ```
### BEクラスターのスケールイン

BEノードをスケールインする際は、DROPまたはDECOMMISSION方式を選択できます：

|          | DROP              | DECOMMISSION                                |
| -------- | ----------------- | ------------------------------------------- |
| 原理 | ノードを直接削除し、BEノードを削除します。 | BEノード上のデータを他のノードに移行するコマンドを開始します。移行が完了すると、BEノードは自動的に削除されます。 |
| 有効時間 | 実行後すぐに有効になります。 | データ移行完了後に有効になります。クラスターの既存データ量によっては、数時間から最大1日かかる場合があります。 |
| 単一レプリカテーブルの処理 | データ損失が発生する可能性があります。 | データ損失は発生しません。 |
| 複数ノードの同時削除 | データ損失が発生する可能性があります。 | データ損失は発生しません。 |
| 本番環境での推奨 | 本番環境では推奨されません。 | 本番環境で推奨されます。 |

* DROP方式を使用してBEノードを削除するには、以下のコマンドを使用してください：

  ```sql
  ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
  ```
* DECOMMISSION方式を使用してBEノードを削除するには、以下のコマンドを使用します：

  ```sql
  ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
  ```
### DECOMMISSIONコマンドの説明:

- DECOMMISSIONは非同期操作です。実行後、`SHOW backends;`でBEノードの`SystemDecommissioned`ステータスが`true`に設定されていることを確認できます。これは、ノードが削除されていることを示します。

- DECOMMISSIONコマンドは失敗する場合があります。例えば、削除されるBEからのデータを収容するために残りのBEノードに十分なストレージ容量がない場合、または残りのノードが最小レプリケーション要件を満たしていない場合、コマンドは完了せず、BEは`SystemDecommissioned`状態が`true`に設定されたままになります。

- DECOMMISSIONの進行状況は`SHOW PROC '/backends';`を使用して監視できます。操作が進行中の場合、`TabletNum`値は継続的に減少します。

- `CANCEL DECOMMISSION BACKEND "be_host:be_heartbeat_service_port";`コマンドを使用して操作をキャンセルできます。キャンセル後、BEノードは現在の残りデータを保持し、Dorisは負荷を再バランスします。

- データ移行レートは`balance_slot_num_per_path`パラメータを変更することで調整できます。
