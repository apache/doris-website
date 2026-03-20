---
{
  "title": "エラスティックスケーリング",
  "language": "ja",
  "description": "Dorisはオンライン弾性スケーリングをサポートしており、ユーザーはサービスを中断することなく動的にノードを追加または削除できます。"
}
---
Dorisはオンライン弾性スケーリングをサポートしており、ユーザーはサービスを中断することなく動的にノードを追加または削除できます。この機能により、企業は増大する需要に対応したり、アイドル状態のリソースの無駄を削減したりすることができます。BEノードのスケールアップまたはスケールダウンはクラスターの可用性に影響しませんが、データ移行を伴うため、ビジネス活動が少ない期間にスケーリング操作を実行することを推奨します。

## FEクラスターのScale In/Out

Doris FEノードは以下の3つの役割に分かれており、各FEノードにはメタデータの完全なセットが含まれています：

* Master Node：メタデータの読み取りと書き込みを担当します。Master nodeでメタデータの変更が発生すると、BDB JEプロトコルを介してnon-Masterノードに同期されます。クラスター内には1つのMaster FEノードのみが存在できます。

* Follower Node：メタデータの読み取りを担当します。Master nodeに障害が発生した場合、Followerノードがリーダー選出を開始して新しいMaster nodeを選択します。クラスター内では、MasterとFollowerノードの総数は奇数にすることが推奨されます。

* Observer Node：メタデータの読み取りを担当しますが、リーダー選出には参加しません。FEノードの読み取りサービス容量を拡張するために使用されます。

通常、各FEノードは10-20個のBEノードの負荷操作を処理できます。3つのFEノードの構成は、ほとんどのビジネスシナリオの要件を満たすのに十分です。

### FEのScale out

:::info Note:

新しいFEノードを追加する際は、以下の点にご注意ください：

* 新しいFEノードの`http_port`は、クラスター内の既存のすべてのFEノードの`http_port`と一致する必要があります。

* Followerノードを追加する場合、クラスター内のMasterとFollowerノードの総数は奇数にすることが推奨されます。

* `show frontends`コマンドを使用して、現在のクラスターノードのポートと役割を確認できます。
:::

1. FE Nodeを開始：

```bash
fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
```
* FE Nodeの登録:

  * ノードをFollower FEとして登録:

    ```sql
    ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
    ```
* ノードをObserver FEとして登録する:

    ```sql
    ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
    ```
* 新しく追加されたFEノードのステータスを確認する

  ```sql
  show frontends;
  ```
### FE クラスターでのスケールイン

FE ノードをスケールインする際は、クラスター内の Master および Follower ノードの総数が奇数のままであることを確認してください。ノードを削除するには、以下のコマンドを使用します：

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
2. BEノードを登録します:

   ```sql
   ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
   ```
### BE クラスターのスケールイン

BE ノードをスケールインする際は、DROP または DECOMMISSION のいずれかの方法を選択できます：

|          | DROP              | DECOMMISSION                                |
| -------- | ----------------- | ------------------------------------------- |
| 原理 | ノードを直接削除し、BE ノードを削除します。 | BE ノード上のデータを他のノードに移行するコマンドを開始します。移行が完了すると、BE ノードは自動的に削除されます。 |
| 有効時間 | 実行後すぐに有効になります。 | データ移行が完了した後に有効になります。クラスターの既存データ量によっては、数時間から最大1日かかる場合があります。 |
| シングルレプリカテーブルの処理 | データ損失が発生する可能性があります。 | データ損失は発生しません。 |
| 複数ノードの同時削除 | データ損失が発生する可能性があります。 | データ損失は発生しません。 |
| 本番環境での推奨 | 本番環境では推奨されません。 | 本番環境で推奨されます。 |

* DROP 方法を使用して BE ノードを削除するには、以下のコマンドを使用します：

  ```sql
  ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
  ```
* DECOMMISSION方法を使用してBEノードを削除するには、以下のコマンドを使用します:

  ```sql
  ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
  ```
### DECOMMISSIONコマンドの説明：

- DECOMMISSIONは非同期操作です。実行後、`SHOW backends;`でBEノードの`SystemDecommissioned`ステータスが`true`に設定されていることを確認できます。これは、そのノードが削除中であることを示します。

- DECOMMISSIONコマンドは失敗する場合があります。例えば、削除対象のBEからのデータを格納するために残りのBEノードに十分なストレージ領域がない場合、または残りのノードが最小レプリケーション要件を満たさない場合、コマンドは完了せず、BEは`SystemDecommissioned`が`true`に設定された状態のままになります。

- DECOMMISSIONの進行状況は`SHOW PROC '/backends';`を使用して監視できます。操作が進行中の場合、`TabletNum`の値は継続的に減少します。

- `CANCEL DECOMMISSION BACKEND "be_host:be_heartbeat_service_port";`コマンドを使用して操作をキャンセルできます。キャンセル後、BEノードは現在の残りのデータを保持し、Dorisは負荷を再バランスします。

- データ移行速度は`balance_slot_num_per_path`パラメータを変更することで調整できます。
