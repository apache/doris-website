---
{
  "title": "クラスター操作",
  "language": "ja",
  "description": "k8s環境では、予期しない何らかの原因によりサービスがCrashLoopBackOff状態になることがあります。"
}
---
## podがクラッシュした際にコンテナに入る方法

k8s環境では、予期しない事象によりサービスが`CrashLoopBackOff`状態に入ることがあります。`kubectl get pod --namespace ${namespace}`コマンドを通じて、指定されたnamespace下でのpodステータスとpod_nameを確認できます。

この状態では、describeやlogsコマンドを使用するだけではサービス問題の原因を特定できません。サービスが`CrashLoopBackOff`状態に入った際、サービスをデプロイするpodを`running`状態に入らせ、ユーザーがexecを通じてコンテナに入ってデバッグできるようにするメカニズムが必要です。

doris-operatorは`Debug`実行モードを提供します。以下では、サービスがCrashLoopBackOffに入った際にDebugモードに入って手動デバッグを行う方法と、問題解決後に通常起動状態に戻す方法について説明します。


### Debugモードの開始

サービスのpodがCrashLoopBackOffに入った場合や、通常運用中に正常に起動できない場合は、以下の手順でサービスを`Debug`モードに設定し、手動でサービスを開始して問題を発見してください。

1. **以下のコマンドを使用して、問題のあるpodにannotationを追加します。**

  ```shell
  $ kubectl annotate pod ${pod_name} --namespace ${namespace} apache.org.doris/runmode=debug
  ```
次回サービスが再起動される際、サービスは`Debug`モード起動を識別するアノテーションを検出し、`Debug`モードに入って起動し、podステータスは`running`になります。

2. **サービスが`Debug`モードに入ると、サービスのpodは正常な状態で表示されます。ユーザーは以下のコマンドでpod内部に入ることができます**

  ```shell
  $ kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```
3. **`Debug`でサービスを手動で開始する。ユーザーがpodに入った際、対応する設定ファイルのポートを変更して`start_xx.sh`スクリプトを手動で実行する。スクリプトディレクトリは`/opt/apache-doris/xx/bin`配下にある。**

  FEは`query_port`を変更する必要があり、BEは`heartbeat_service_port`を変更する必要がある
  主な目的は、`Debug`モードでサービス経由でクラッシュしたノードにアクセスすることによってフローが誤解を招くことを避けることである。

### Debugモードを終了する

サービスが問題を特定した際、`Debug`操作を終了する必要がある。この時、以下のコマンドに従って対応するpodを削除するだけで、サービスは通常モードで開始される。

```shell
$ kubectl delete pod ${pod_name} --namespace ${namespace}
```
:::tip ヒント  
**Pod に入った後、対応する Doris コンポーネントを手動で開始する前に、設定ファイルのポート情報を変更する必要があります。**  

- FE は `query_port=9030` 設定を変更する必要があります。デフォルトパス: `/opt/apache-doris/fe/conf/fe.conf`  
- BE は `heartbeat_service_port=9050` 設定を変更する必要があります。デフォルトパス: `/opt/apache-doris/be/conf/be.conf`  
:::

## doris クラスターのアップグレード

このドキュメントでは、Doris Operator デプロイメントに基づく Apache Doris クラスターをアップデートを使用してアップグレードする方法について説明します。

従来のデプロイされたクラスターのアップグレードと同様に、Doris Operator によってデプロイされた Doris クラスターも、BE から FE ノードへのローリングアップグレードが必要です。Doris Operator は Kubernetes の [Performing a Rolling Update](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/) に基づいてローリングアップグレード機能を提供します。

### アップグレード前の注意事項

- アップグレード作業はオフピーク時間中に実行することを推奨します。
- ローリングアップグレードプロセス中、閉じられたノードへの接続は失敗し、リクエストの失敗を引き起こします。この種のビジネスでは、クライアントにリトライ機能を追加することを推奨します。
- アップグレード前に、[General Upgrade Manual](https://doris.apache.org/docs/dev/admin-manual/cluster-management/upgrade) を読んで、アップグレード中のいくつかの原則と注意事項を理解することができます。
- アップグレード前にデータとメタデータの互換性を検証することはできません。そのため、クラスターのアップグレードでは、データの単一コピーとクラスター内の単一 FE FOLLOWER ノードを避ける必要があります。
- アップグレードプロセス中にノードが再起動されるため、不要なクラスターバランシングとレプリカ修復ロジックがトリガーされる可能性があります。まず以下のコマンドでシャットダウンしてください。

```mysql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```
- Dorisをアップグレードする際は、2つ以上のキーノードバージョンを跨いでアップグレードしないという原則に従ってください。複数のキーノードバージョンを跨いでアップグレードしたい場合は、まず最新のキーノードバージョンにアップグレードし、その後順次アップグレードしてください。非キーノードバージョンの場合は、スキップしても問題ありません。詳細については、[Upgrade Version Instructions](https://doris.apache.org/docs/dev/admin-manual/cluster-management/upgrade/#doris-release-notes)を参照してください。

### アップグレード操作

アップグレードプロセスにおけるノードタイプの順序は以下の通りです。特定のタイプのノードが存在しない場合は、スキップされます：

```shell
   cn/be -> fe -> broker
```
対応するクラスタコンポーネントの`image`を順番に変更し、設定を適用することが推奨されます。現在のタイプのコンポーネントが完全にアップグレードされ、ステータスが正常に戻った後、次のタイプのノードのローリングアップグレードを実行できます。

#### BE のアップグレード

クラスタのcrd（Doris Operatorが定義する`DorisCluster`タイプリソース名の略称）ファイルを保持している場合、設定ファイルを変更して`kubectl apply`コマンドを実行することでアップグレードできます。

1. `spec.beSpec.image`を変更

  `apache/doris:be-2.1.8`を`apache/doris:be-2.1.9`に変更

  ```shell
  $ vim doriscluster-sample.yaml
  ```
2. 変更を保存し、アップグレード対象の変更を適用します：

  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```
`kubectl edit dcr`を通じて直接変更することもできます。

1. namespace 'doris'のdcrリストを確認し、更新が必要な`cluster_name`を取得します。

  ```shell
  $ kubectl get dcr -n doris
  NAME                  FESTATUS    BESTATUS    CNSTATUS
  doriscluster-sample   available   available
  ```
2. 変更、保存、および適用

  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
テキストエディタに入った後、`spec.beSpec.image`を見つけて、`apache/doris:be-2.1.8`を`apache/doris:be-2.1.9`に変更します

3. アップグレードプロセスと結果を確認します：

  ```shell
  $ kubectl get pod -n doris
  ```
すべてのPodが再構築されてRunning状態になると、アップグレードが完了します。

#### FEのアップグレード

クラスタのcrd（Doris Operatorが定義する`DorisCluster`タイプリソース名の略称）ファイルを保持している場合、設定ファイルを変更して`kubectl apply`コマンドを実行することでアップグレードできます。

1. `spec.feSpec.image`を変更

  `apache/doris:fe-2.1.8`を`apache/doris:fe-2.1.9`に変更

  ```shell
  $ vim doriscluster-sample.yaml
  ```
2. 変更を保存し、アップグレード対象の変更を適用します：

  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```
`kubectl edit dcr`を通じて直接変更することもできます。

1. 変更、保存して有効化

  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
テキストエディタに入った後、`spec.feSpec.image`を見つけて、`apache/doris:fe-2.1.8`を`apache/doris:fe-2.1.9`に変更します

2. アップグレードプロセスと結果を確認します：

  ```shell
  $ kubectl get pod -n doris
  ```
すべてのPodが再構築されてRunning状態になると、アップグレードが完了します。

### アップグレード完了後
#### クラスターノードステータスの確認
[Access Doris Cluster](./access-cluster)ドキュメントで提供されている方法で`mysql-client`を通じてDorisにアクセスします。
`show frontends`や`show backends`などのSQLを使用して、各コンポーネントのバージョンとステータスを確認します。

```mysql
mysql> show frontends\G;
*************************** 1. row ***************************
              Name: fe_13c132aa_3281_4f4f_97e8_655d01287425
              Host: doriscluster-sample-fe-0.doriscluster-sample-fe-internal.doris.svc.cluster.local
       EditLogPort: 9010
          HttpPort: 8030
         QueryPort: 9030
           RpcPort: 9020
ArrowFlightSqlPort: -1
              Role: FOLLOWER
          IsMaster: false
         ClusterId: 1779160761
              Join: true
             Alive: true
 ReplayedJournalId: 2422
     LastStartTime: 2024-02-19 06:38:47
     LastHeartbeat: 2024-02-19 09:31:33
          IsHelper: true
            ErrMsg:
           Version: doris-2.1.0
  CurrentConnected: Yes
*************************** 2. row ***************************
              Name: fe_f1a9d008_d110_4780_8e60_13d392faa54e
              Host: doriscluster-sample-fe-2.doriscluster-sample-fe-internal.doris.svc.cluster.local
       EditLogPort: 9010
          HttpPort: 8030
         QueryPort: 9030
           RpcPort: 9020
ArrowFlightSqlPort: -1
              Role: FOLLOWER
          IsMaster: true
         ClusterId: 1779160761
              Join: true
             Alive: true
 ReplayedJournalId: 2423
     LastStartTime: 2024-02-19 06:37:35
     LastHeartbeat: 2024-02-19 09:31:33
          IsHelper: true
            ErrMsg:
           Version: doris-2.1.0
  CurrentConnected: No
*************************** 3. row ***************************
              Name: fe_e42bf9da_006f_4302_b861_770d2c955a47
              Host: doriscluster-sample-fe-1.doriscluster-sample-fe-internal.doris.svc.cluster.local
       EditLogPort: 9010
          HttpPort: 8030
         QueryPort: 9030
           RpcPort: 9020
ArrowFlightSqlPort: -1
              Role: FOLLOWER
          IsMaster: false
         ClusterId: 1779160761
              Join: true
             Alive: true
 ReplayedJournalId: 2422
     LastStartTime: 2024-02-19 06:38:17
     LastHeartbeat: 2024-02-19 09:31:33
          IsHelper: true
            ErrMsg:
           Version: doris-2.1.0
  CurrentConnected: No
3 rows in set (0.02 sec)
```
FEノードの`Alive`ステータスがtrueで、`Version`値が新しいバージョンの場合、FEノードのアップグレードは成功です。

```mysql
mysql> show backends\G;
*************************** 1. row ***************************
              BackendId: 10002
                   Host: doriscluster-sample-be-0.doriscluster-sample-be-internal.doris.svc.cluster.local
          HeartbeatPort: 9050
                 BePort: 9060
               HttpPort: 8040
               BrpcPort: 8060
     ArrowFlightSqlPort: -1
          LastStartTime: 2024-02-19 06:37:56
          LastHeartbeat: 2024-02-19 09:32:43
                  Alive: true
   SystemDecommissioned: false
              TabletNum: 14
       DataUsedCapacity: 0.000
     TrashUsedCapcacity: 0.000
          AvailCapacity: 12.719 GB
          TotalCapacity: 295.167 GB
                UsedPct: 95.69 %
         MaxDiskUsedPct: 95.69 %
     RemoteUsedCapacity: 0.000
                    Tag: {"location" : "default"}
                 ErrMsg:
                Version: doris-2.1.0
                 Status: {"lastSuccessReportTabletsTime":"2024-02-19 09:31:48","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false}
HeartbeatFailureCounter: 0
               NodeRole: mix
*************************** 2. row ***************************
              BackendId: 10003
                   Host: doriscluster-sample-be-1.doriscluster-sample-be-internal.doris.svc.cluster.local
          HeartbeatPort: 9050
                 BePort: 9060
               HttpPort: 8040
               BrpcPort: 8060
     ArrowFlightSqlPort: -1
          LastStartTime: 2024-02-19 06:37:35
          LastHeartbeat: 2024-02-19 09:32:43
                  Alive: true
   SystemDecommissioned: false
              TabletNum: 8
       DataUsedCapacity: 0.000
     TrashUsedCapcacity: 0.000
          AvailCapacity: 12.719 GB
          TotalCapacity: 295.167 GB
                UsedPct: 95.69 %
         MaxDiskUsedPct: 95.69 %
     RemoteUsedCapacity: 0.000
                    Tag: {"location" : "default"}
                 ErrMsg:
                Version: doris-2.1.0
                 Status: {"lastSuccessReportTabletsTime":"2024-02-19 09:31:43","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false}
HeartbeatFailureCounter: 0
               NodeRole: mix
*************************** 3. row ***************************
              BackendId: 11024
                   Host: doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local
          HeartbeatPort: 9050
                 BePort: 9060
               HttpPort: 8040
               BrpcPort: 8060
     ArrowFlightSqlPort: -1
          LastStartTime: 2024-02-19 08:50:36
          LastHeartbeat: 2024-02-19 09:32:43
                  Alive: true
   SystemDecommissioned: false
              TabletNum: 0
       DataUsedCapacity: 0.000
     TrashUsedCapcacity: 0.000
          AvailCapacity: 12.719 GB
          TotalCapacity: 295.167 GB
                UsedPct: 95.69 %
         MaxDiskUsedPct: 95.69 %
     RemoteUsedCapacity: 0.000
                    Tag: {"location" : "default"}
                 ErrMsg:
                Version: doris-2.1.0
                 Status: {"lastSuccessReportTabletsTime":"2024-02-19 09:32:04","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false}
HeartbeatFailureCounter: 0
               NodeRole: mix
3 rows in set (0.01 sec)
```
BE ノードの `Alive` ステータスが true で、`Version` の値が新しいバージョンの場合、BE ノードのアップグレードは成功です。

#### クラスターレプリカ同期とバランシングの復元
各ノードのステータスが正しいことを確認した後、以下の SQL を実行してクラスターバランシングとレプリカ修復を復元します：

```
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```
## `metadata_failure_recovery`モードでのFEの起動
Frontend（FE）サービスがリーダーを選出できず利用不可能になった場合、最も高い`VLSN`を持つノードを選択し、リカバリメカニズムを使用してマスターとして強制起動することでクラスタを復旧できます。

### コンテナ化環境でのリカバリモードでの起動
1. 最も高い`VLSN`を持つノードを特定する  
    Kubernetesでは、FE Podが起動するたびに、そのノードの最後の10個の`VLSN`レコードが出力されます。例を以下に示します：

    ```
    the annotations value:
    the value not equal!  debug
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:19:2025-08-05 03:42:47.650 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica-feeder fe_d8763579_92da_4d72_8c58_4e62b88bdff0 start stream at VLSN: 30
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:21:2025-08-05 03:42:47.659 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica initialization completed. Replica VLSN: -1  Heartbeat master commit VLSN: 49  DTVLSN:0 Replica VLSN delta: 50
    [Tue Aug  5 06:14:05 UTC 2025] start with meta run start_fe.sh with additional options: '--console'
    ```
この例では、ログの接頭辞`start stream at VLSN:`で示されているように、現在のノードでの最高の`VLSN`は30です。
2. 最高の`VLSN`を持つPodをリカバリ用に指定する  
    最高の`VLSN`を持つノードに対応するPodを特定した後、リカバリメカニズムを有効にするためにアノテーションを付けます：

    ```
    kubectl annotate pod {podName} "selectdb.com.doris/recovery=true"
    ```
再起動時に、Podは自動的に`--metadata_failure_recovery`フラグを起動コマンドに追加し、リカバリモードで開始します。
3. リカバリ後にアノテーションを削除する
    FEサービスが正常に動作したら、将来の再起動時に予期しない動作を避けるため、手順2で追加したアノテーションを必ず削除してください。

:::tip Note
1. アノテーションを追加した後は、kubectl delete podを使用してPodを再起動しないでください。これによりアノテーションが削除されます。代わりに、kubeletによる自動再起動を許可するか、コンテナ内のプロセスを手動でkillしてください。
2. FEを`metadata_failure_recovery`モードで起動すると、広範囲なログリプレイにより長時間かかることがあります。実行前に、FEサービスの[startup probe timeout](./install-config-cluster.md#startup-probe-timeout)を増加させ、リカバリ起動を開始する前にすべてのFE Podを削除してください。
:::
