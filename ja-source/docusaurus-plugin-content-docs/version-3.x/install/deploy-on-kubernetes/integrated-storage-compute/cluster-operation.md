---
{
  "title": "クラスター運用",
  "language": "ja",
  "description": "k8s環境において、予期しない問題によりサービスがCrashLoopBackOff状態になることがあります。"
}
---
## podがクラッシュした際のコンテナへの入り方

k8s環境では、予期しない事象によりサービスが`CrashLoopBackOff`状態に入ることがあります。`kubectl get pod --namespace ${namespace}`コマンドにより、指定されたnamespace下のpodステータスとpod_nameを確認することができます。

この状態では、describeやlogsコマンドを使用するだけでは、サービス問題の原因を特定することができません。サービスが`CrashLoopBackOff`状態に入った場合、サービスをデプロイするpodを`running`状態にし、ユーザーがexecを通じてコンテナに入ってデバッグできるようにするメカニズムが必要です。

Doris Operatorは`Debug`実行モードを提供します。以下では、サービスが`CrashLoopBackOff`に入った際に手動デバッグのためにDebugモードに入る方法と、問題解決後に通常起動状態に戻す方法について説明します。


### Debugモードの開始

サービスのpodが通常動作中にCrashLoopBackOffに入るか、正常に起動できない場合、以下の手順でサービスを`Debug`モードにし、手動でサービスを開始して問題を見つけます。

1. **以下のコマンドを使用して、問題のあるpodにannotationを追加します。**

  ```shell
  $ kubectl annotate pod ${pod_name} --namespace ${namespace} apache.org.doris/runmode=debug
  ```
サービスが次回再起動されると、サービスは`Debug`モード起動を識別するアノテーションを検出し、`Debug`モードに入って起動し、podのステータスは`running`になります。

2. **サービスが`Debug`モードに入ると、サービスのpodは正常な状態で表示されます。ユーザーは以下のコマンドでpodの内部に入ることができます**

  ```shell
  $ kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```
3. **`Debug`でサービスを手動で開始する。ユーザーがpodに入る際、対応する設定ファイルのポートを変更することで、`start_xx.sh`スクリプトを手動で実行する。スクリプトディレクトリは`/opt/apache-doris/xx/bin`配下にある。**

  FEは`query_port`を変更する必要があり、BEは`heartbeat_service_port`を変更する必要がある
  主な目的は、`Debug`モードでクラッシュしたノードにサービス経由でアクセスすることによってフローを誤解させることを避けることである。

### Debugモードの終了

サービスが問題を特定した場合、`Debug`操作を終了する必要がある。この時、以下のコマンドに従って対応するpodを削除するだけで、サービスは通常モードで開始される。

```shell
$ kubectl delete pod ${pod_name} --namespace ${namespace}
```
:::tip Tip  
**podに入った後、対応するDorisコンポーネントを手動で開始する前に、設定ファイルのポート情報を修正する必要があります。**

- FEは`query_port=9030`設定を修正する必要があります。デフォルトパス：`/opt/apache-doris/fe/conf/fe.conf`。
- BEは`heartbeat_service_port=9050`設定を修正する必要があります。デフォルトパス：`/opt/apache-doris/be/conf/be.conf`。
:::

## dorisクラスターのアップグレード

この文書では、Doris Operatorデプロイメントに基づくApache Dorisクラスターをアップデートを使用してアップグレードする方法について説明します。

従来のデプロイメントでのクラスターアップグレードと同様に、Doris OperatorによってデプロイされたDorisクラスターでも、BEからFEノードへのローリングアップグレードが必要です。Doris OperatorはKubernetesの[Performing a Rolling Update](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)に基づいてローリングアップグレード機能を提供します。

### アップグレード前の注意事項

- アップグレード操作はオフピーク時間帯に実行することを推奨します。
- ローリングアップグレード処理中、閉じられたノードへの接続は失敗し、リクエストが失敗する原因となります。この種のビジネスでは、クライアントにリトライ機能を追加することを推奨します。
- アップグレード前に、[General Upgrade Manual](https://doris.apache.org/docs/dev/admin-manual/cluster-management/upgrade)を読んで、アップグレード中のいくつかの原理と注意事項を理解することができます。
- アップグレード前にデータとメタデータの互換性を検証することはできません。そのため、クラスターアップグレードでは、クラスター内のデータの単一コピーと単一のFE FOLLOWERノードを避ける必要があります。
- アップグレード処理中にノードが再起動されるため、不要なクラスターバランシングとレプリカ修復ロジックがトリガーされる可能性があります。以下のコマンドで事前にシャットダウンしてください。

```mysql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```
- Dorisをアップグレードする際は、2つ以上のキーノードバージョンをまたいでアップグレードしないという原則に従ってください。複数のキーノードバージョンをまたいでアップグレードしたい場合は、まず最新のキーノードバージョンにアップグレードし、その後順次アップグレードしてください。非キーノードバージョンの場合は、スキップしても問題ありません。詳細については、[Upgrade Version Instructions](https://doris.apache.org/docs/dev/admin-manual/cluster-management/upgrade/#doris-release-notes)を参照してください。

### アップグレード操作

アップグレードプロセスにおけるノードタイプの順序は以下の通りです。特定のタイプのノードが存在しない場合は、スキップされます：

```shell
   cn/be -> fe -> broker
```
対応するクラスターコンポーネントの`image`を順次変更し、設定を適用することを推奨します。現在のタイプのコンポーネントが完全にアップグレードされ、ステータスが正常に戻った後、次のタイプのノードのローリングアップグレードを実行できます。

#### BEのアップグレード

クラスターのcrd（Doris Operatorが定義する`DorisCluster`タイプリソース名の略称）ファイルを保持している場合、設定ファイルを変更して`kubectl apply`コマンドを実行することでアップグレードできます。

1. `spec.beSpec.image`を変更

  `apache/doris:be-2.1.8`を`apache/doris:be-2.1.9`に変更

  ```shell
  $ vim doriscluster-sample.yaml
  ```
2. 変更を保存し、アップグレードする変更を適用します：

  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```
`kubectl edit dcr`を通じて直接変更することもできます。

1. namespace `doris`配下のdcrリストを確認して、更新が必要な`cluster_name`を取得します。

  ```shell
  $ kubectl get dcr -n doris
  NAME                  FESTATUS    BESTATUS    CNSTATUS
  doriscluster-sample   available   available
  ```
2. 変更、保存、反映

  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
テキストエディターに入った後、`spec.beSpec.image`を見つけて、`apache/doris:be-2.1.8`を`apache/doris:be-2.1.9`に変更します

3. アップグレードプロセスと結果を表示します：

  ```shell
  $ kubectl get pod -n doris
  ```
すべてのPodが再構築されてRunning状態になると、アップグレードは完了です。

#### FEのアップグレード

クラスターのcrd（Doris Operatorが定義する`DorisCluster`タイプリソース名の略語）ファイルを保持している場合は、設定ファイルを変更して`kubectl apply`コマンドを実行することでアップグレードできます。

1. `spec.feSpec.image`を変更する

  `apache/doris:fe-2.1.8`を`apache/doris:fe-2.1.9`に変更する

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
テキストエディターに入った後、`spec.feSpec.image` を見つけて `apache/doris:fe-2.1.8` を `apache/doris:fe-2.1.9` に変更します

2. アップグレードプロセスと結果を確認します：

  ```shell
  $ kubectl get pod -n doris
  ```
すべてのPodが再構築されてRunning状態になると、アップグレードが完了します。

### アップグレード完了後
#### クラスターノードのステータスを確認

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
FEノードの`Alive`ステータスがtrueで、`Version`の値が新しいバージョンである場合、FEノードのアップグレードは成功しています。

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
BEノードの`Alive`ステータスがtrueで、`Version`値が新しいバージョンの場合、BEノードのアップグレードは成功です。

#### クラスターレプリカ同期とバランシングの復元
各ノードのステータスが正しいことを確認した後、以下のSQLを実行してクラスターバランシングとレプリカ修復を復元します：

```
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```
## `metadata_failure_recovery`モードでのFE起動
Frontend（FE）サービスがリーダーを選出できず利用不可能になった場合、最も高い`VLSN`を持つノードを選択し、回復メカニズムを使用してマスターとして強制起動することでクラスターを回復できます。

### コンテナ化環境での回復モードでの起動
1. 最も高い`VLSN`を持つノードを特定する  
   Kubernetesでは、FE Podが起動するたびに、そのノードの最新10件の`VLSN`レコードが出力されます。以下に例を示します：

    ```
    the annotations value:
    the value not equal!  debug
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:19:2025-08-05 03:42:47.650 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica-feeder fe_d8763579_92da_4d72_8c58_4e62b88bdff0 start stream at VLSN: 30
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:21:2025-08-05 03:42:47.659 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica initialization completed. Replica VLSN: -1  Heartbeat master commit VLSN: 49  DTVLSN:0 Replica VLSN delta: 50
    [Tue Aug  5 06:14:05 UTC 2025] start with meta run start_fe.sh with additional options: '--console'
    ```
この例では、現在のノードで最も高い`VLSN`は30であり、これはログプレフィックス`start stream at VLSN:`によって示されています。
2. 最も高い`VLSN`を持つPodをリカバリ用に指定する  
   最も高い`VLSN`を持つノードに対応するPodを特定した後、そのPodにアノテーションを付けてリカバリメカニズムを有効にします：

    ```
    kubectl annotate pod {podName} "selectdb.com.doris/recovery=true"
    ```
再起動時、Podは自動的に`--metadata_failure_recovery`フラグを起動コマンドに追加し、リカバリモードで開始します。
3. リカバリ後にアノテーションを削除する  
   FEサービスが正常に動作したら、今後の再起動時に予期しない動作を避けるため、手順2で追加したアノテーションを必ず削除してください。

:::tip 注意
1. アノテーションを追加した後は、kubectl delete podを使用してPodを再起動しないでください。これによりアノテーションが削除されます。代わりに、kubeletに自動的に再起動させるか、コンテナ内のプロセスを手動で終了させてください。
2. FEを`metadata_failure_recovery`モードで開始すると、大量のログ再生により時間がかかる場合があります。実行前に、FEサービスの[startup probe timeout](./install-config-cluster.md#startup-probe-timeout)を増加し、リカバリ起動を開始する前にすべてのFE Podを削除してください。
:::
