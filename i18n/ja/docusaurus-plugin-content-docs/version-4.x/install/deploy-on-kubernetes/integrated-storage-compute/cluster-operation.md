---
{
    "title": "クラスターの運用",
    "language": "ja",
    "description": "Kubernetes 環境での Doris クラスターの運用ガイド。サービスのスケーリング、ローリングアップグレード、CrashLoopBackOff への対処、Debug モードでの起動、メタデータの復旧などを説明します。",
    "keywords": ["Doris クラスターの運用", "スケーリング", "ローリングアップグレード", "CrashLoopBackOff", "Debug モード", "メタデータの復旧", "K8s", "Kubernetes"]
}
---

## サービスがクラッシュしたときにコンテナーに入る方法

K8s 環境では、予期しない事象によってサービスが `CrashLoopBackOff` 状態になることがあります。`kubectl get pod --namespace ${namespace}` コマンドを使用すると、指定した namespace 内の Pod の状態と pod_name を確認できます。

この状態では、describe コマンドと logs コマンドだけではサービス障害の原因を特定できません。サービスが `CrashLoopBackOff` 状態になった場合、exec でコンテナーに入ってデバッグできるよう、デプロイされた Pod を `running` 状態にする仕組みが必要です。

Doris Operator には `Debug` 実行モードがあります。以下では、サービスが `CrashLoopBackOff` 状態になったときに手動でデバッグするための Debug モードへの切り替え方と、問題解決後に通常の起動へ戻す方法を説明します。

### Debug モードで起動する

運用中にサービスの Pod が CrashLoopBackOff 状態になったり、正常に起動できなくなったりした場合は、次の手順でサービスを `Debug` モードに切り替え、手動で起動して原因を調査します。

1. **次のコマンドで問題のある Pod にアノテーションを追加します**

  ```shell
  kubectl annotate pod ${pod_name} --namespace ${namespace} apache.org.doris/runmode=debug
  ```

  次回サービスが再起動すると、`Debug` モードでの起動を示すアノテーションが検出されます。サービスは `Debug` モードで起動し、Pod の状態は `running` になります。

2. **サービスが `Debug` モードになると、Pod は正常な状態で表示されます。次のコマンドで Pod に入ります**

  ```shell
  kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```
  
3. **`Debug` モードでサービスを手動起動します。Pod に入った後、設定ファイルの該当するポートを変更し、`start_xx.sh` スクリプトを手動で実行します。スクリプトのディレクトリは `/opt/apache-doris/xx/bin` です。**

  FE では `query_port`、BE では `heartbeat_service_port` を変更します。これにより、クラッシュしたノードが `Debug` モードでも Service 経由でアクセス可能なままとなり、トラフィックが誤って振り分けられることを防ぎます。

### Debug モードを終了する

問題の原因を特定したら、次のコマンドで該当する Pod を削除して `Debug` モードを終了します。その後、サービスは通常モードで起動します。

```shell
kubectl delete pod ${pod_name} --namespace ${namespace}
```

:::tip ヒント
**Pod に入ったら、対応する Doris コンポーネントを手動で起動する前に、必ず設定ファイルのポート情報を変更してください。**
- FE では `query_port=9030` の設定を変更します。デフォルトのパスは `/opt/apache-doris/fe/conf/fe.conf` です。
- BE では `heartbeat_service_port=9050` の設定を変更します。デフォルトのパスは `/opt/apache-doris/be/conf/be.conf` です。
:::

## サービスのスケーリング

K8s 上の Doris をスケーリングするには、DorisCluster リソースで該当コンポーネントの replicas フィールドを変更します。リソースを直接編集する方法と、コマンドを使用する方法があります。

### DorisCluster リソースを取得する

`kubectl --namespace {namespace} get doriscluster` コマンドを使用して、デプロイ済みの DorisCluster リソース（略称 dcr）の名前を取得します。このドキュメントでは、namespace に `doris` を使用します。

```shell
kubectl --namespace doris get doriscluster
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

### リソースをスケーリングする

K8s の操作では、リソースを目的の状態に変更すると、Operator サービスが操作を自動的に実行します。`kubectl --namespace {namespace}  edit doriscluster {dcr_name}` で編集モードに入り、該当する spec の replicas 値を変更してスケーリングできます。保存して終了すると、Doris Operator が操作を完了します。次のコマンドを使用して、各コンポーネントをスケーリングすることもできます。

#### FE をスケーリングする

1. **現在の FE サービス数を確認します**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS       AGE
  doriscluster-sample-fe-0   1/1     Running   0              10d
  ```

2. **FE をスケーリングします**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"feSpec":{"replicas":3}}}'
  ```

3. **スケーリング結果を確認します**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-2   1/1     Running   0          9m37s
  doriscluster-sample-fe-1   1/1     Running   0          9m37s
  doriscluster-sample-fe-0   1/1     Running   0          8m49s
  ```

#### BE をスケーリングする

1. **現在の BE サービス数を確認します**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  ```

2. **BE をスケーリングします**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"beSpec":{"replicas":3}}}'
  ```

3. **スケーリング結果を確認します**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  doriscluster-sample-be-2   1/1     Running   0             12m
  doriscluster-sample-be-1   1/1     Running   0             12m
  ```

### ノードのスケールイン

ノードのスケールインについては、現在の Doris-Operator は安全なノードの廃止を十分にサポートしていません。クラスターコンポーネントの replicas 属性を減らせば FE または BE ノードの数を減らせますが、この操作ではノードを直接停止してオフラインにします。現在の Doris-Operator には、オフラインにする前にレプリカを安全に移行するための [decommission](../../../sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND) が実装されていません。このため問題が発生する可能性があります。次の点に注意してください。

- テーブルに単一のレプリカしかない場合に BE ノードを不用意にオフラインにすると、必ずデータが失われます。この操作はできる限り避けてください。

- FE Follower ノードを不用意にオフラインにしないでください。メタデータが破損し、サービスに影響する可能性があります。

- FE Observer タイプのノードは、任意にオフラインにしてもリスクはありません。

- CN ノードはデータレプリカを保持しないため、任意にオフラインにできます。ただし、その CN ノード上のリモートデータキャッシュは失われ、短期的にはデータクエリの性能が低下する可能性があります。

## Doris クラスターをアップグレードする

Doris クラスター全体をアップグレードする場合は、最初に BE、次に FE をアップグレードする必要があります。Doris Operator は、Kubernetes の [ローリングアップデート機能](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)を利用して、各コンポーネントを順次アップグレードします。

### アップグレード前の注意事項

- アップグレードは業務のピーク時間帯を避けて実施することを推奨します。

- ローリングアップグレード中、停止したノードへの接続は無効になり、リクエストが失敗します。この影響を受ける業務では、クライアント側に再試行機能を追加することを推奨します。

- アップグレード前に[一般的なアップグレードマニュアル](../../../admin-manual/cluster-management/upgrade.md)を読み、アップグレードの原則と注意事項を確認できます。

- アップグレード前にデータとメタデータの互換性を検証することはできません。そのため、単一レプリカのデータや FE FOLLOWER ノードが単一のクラスターは、アップグレードの対象としないでください。

- アップグレード中にはノードが再起動するため、不要なクラスターのバランシングやレプリカ修復処理が実行される可能性があります。まず次のコマンドでこれらを無効にします。

```
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

- Doris のアップグレードでは、重要なバージョンを二つ以上飛ばさないという原則に従ってください。複数の重要なバージョンをまたぐ場合は、まず直近の重要なバージョンにアップグレードし、その後順番にアップグレードします。重要でないバージョンは飛ばせます。詳しくは[アップグレードのバージョンに関する注意事項](../../../admin-manual/cluster-management/upgrade.md)を参照してください。

### アップグレード手順

アップグレードするノードタイプの順序は次のとおりです。該当するタイプのノードがない場合は、そのタイプを飛ばします。

```
  cn/be -> fe -> broker
```

該当するクラスターコンポーネントの `image` を順番に変更して設定を適用することを推奨します。現在のタイプのコンポーネントがすべてアップグレードされ、状態が正常に戻るまで待ってから、次のタイプのノードをローリングアップグレードしてください。

#### BE をアップグレードする

クラスターの CRD ファイル（Doris Operator はリソースタイプ名の略称として `DorisCluster` を定義しています）が残っている場合は、設定ファイルを変更して `kubectl apply` を実行することでアップグレードできます。

1. `spec.beSpec.image` を変更します

   `apache/doris:be-2.1.8` を `apache/doris:be-2.1.9` に変更します。
  
2. 変更を保存し、この変更を適用して FE をアップグレードします。

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

`kubectl edit dcr` を使用して直接変更することもできます。

1. namespace 'doris' の dcr 一覧を表示し、更新対象の `cluster_name` を取得します。

   ```shell
   $ kubectl get dcr -n doris
   NAME                  FESTATUS    BESTATUS    CNSTATUS
   Doriscluster-sample   available   available
   ```

2. 変更して保存し、適用します。

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```
  
   テキストエディターが開いたら `spec.beSpec.image` を探し、`apache/doris:be-2.1.8` を `apache/doris:be-2.1.9` に変更します。

3. アップグレードの進行状況と結果を確認します。

   ```shell
   kubectl get pod -n doris
   ```
  
すべての Pod が再作成され、Running 状態になるとアップグレードは完了です。

#### FE をアップグレードする

クラスターの crd ファイル（Doris-Operator はリソースタイプ名の略称として `DorisCluster` を定義しています）が残っている場合は、設定ファイルを変更して `kubectl apply` を実行することでアップグレードできます。

1. `spec.feSpec.image` を変更します

   `apache/doris:fe-2.1.8` を `apache/doris:fe-2.1.9` に変更します。

   ```shell
   vim doriscluster-sample.yaml
   ```

2. 変更を保存し、この変更を適用して FE をアップグレードします。

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

`kubectl edit dcr` を使用して直接変更することもできます。

1. 変更して保存し、適用します。

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```

   テキストエディターが開いたら `spec.feSpec.image` を探し、`apache/doris:fe-2.1.8` を `apache/doris:fe-2.1.9` に変更します。

2. アップグレードの進行状況と結果を確認します。
   ```shell
   kubectl get pod -n doris
   ```
  
すべての Pod が再作成され、Running 状態になるとアップグレードは完了です。

### アップグレード後の処理

#### クラスターノードの状態を確認する

[Doris クラスターへのアクセス](install-config-cluster.md#access-configuration)に記載された方法で、`mysql-client` を使用して Doris にアクセスします。

`show frontends` や `show backends` などの SQL を使用して、各コンポーネントのバージョンと状態を確認します。

```sql
show frontends\G;
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

FE ノードの `alive` 状態が true で、`Version` の値が新しいバージョンであれば、FE ノードのアップグレードは成功しています。

```sql
show backends\G;
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

BE ノードの `alive` 状態が true で、`Version` の値が新しいバージョンであれば、BE ノードのアップグレードは成功しています。

#### クラスターのレプリカ同期とバランシングを再開する

各ノードが正常な状態であることを確認したら、次の SQL を実行してクラスターのバランシングとレプリカ修復を再開します。

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## metadata_failure_recovery モードで FE を起動する

FE がマスターを選出できずサービスを利用できない場合は、`VLSN` 値が最大のノードを選び、`metadata_failure_recovery` の仕組みを使ってマスターノードとして強制起動し、クラスターを復旧できます。

### コンテナー環境で復旧モードを使用して起動する

1. `VLSN` 値が最大のノードを探します。
   K8s では、FE Pod が起動するたびに、そのノードの直近 10 件の `VLSN` レコードが次のように出力されます。
    ```
    the annotations value:
    the value not equal!  debug
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:19:2025-08-05 03:42:47.650 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica-feeder fe_d8763579_92da_4d72_8c58_4e62b88bdff0 start stream at VLSN: 30
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:21:2025-08-05 03:42:47.659 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica initialization completed. Replica VLSN: -1  Heartbeat master commit VLSN: 49  DTVLSN:0 Replica VLSN delta: 50
    [Tue Aug  5 06:14:05 UTC 2025] start with meta run start_fe.sh with additional options: '--console'
    ```
   上記は、インスタンスクラスターの FE 起動時に出力される `VLSN` レコードです。このノードの最大の `VLSN` は 30 です（ログの出力プレフィックスは `start stream at VLSN:` です）。
2. 最大値のノードの Pod を、復旧の仕組みを使用するノードとして選択します。
   `VLSN` 値が最大のノードの Pod を特定したら、次のコマンドでその Pod に復旧の仕組みを使った起動を指示するアノテーションを追加します。
    ```
    kubectl annotate pod {podName} "selectdb.com.doris/recovery=true"
    ```
   Pod が再起動すると、そのノードの起動コマンドに ` --metadata_failure_recovery` が自動的に追加され、サービスが復旧モードで起動します。
3. サービスが正常に戻ったら、手順 2 で追加したアノテーションを必ず削除してください。削除しないと、後でノードを再起動した際に予期しない動作が発生する可能性があります。

:::tip ヒント
1. アノテーションを追加した後、Pod を削除して再起動しないでください。アノテーションが失われます。kubelet が自動的に Pod を再起動するのを待つか、コンテナーに入ってプロセスを手動で終了してください。
2. `metadata_failure_recovery` モードで起動するときは、FE のログ再生に時間がかかります。このモードで起動する前に、まず FE サービスの[起動プローブのタイムアウト](install-config-cluster.md#startup-probe-timeout-configuration)を変更し、その後すべての FE Pod を削除して `metadata_failure_recovery` を起動してください。
:::
