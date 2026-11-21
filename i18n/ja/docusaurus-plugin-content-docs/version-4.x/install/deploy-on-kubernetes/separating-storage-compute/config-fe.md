---
{
    "title": "FE の設定",
    "language": "ja",
    "description": "存算分離クラスタにおける FE（FrontEnd）の設定ガイド。コンピュートリソース、Follower の数、起動パラメータ、アクセス方式（ClusterIP/NodePort/LoadBalancer）、永続ストレージの設定について詳しく説明します。",
    "keywords": ["Doris", "storage-compute separation", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "persistent storage"]
}
---

## この章で学ぶこと {#what-you-will-learn-in-this-chapter}

- FE コンポーネントのコンピュートリソース（CPU とメモリ）の設定方法
- FE Follower の数とロールの設定方法
- ConfigMap を使用した FE の起動パラメータのカスタマイズ方法
- アクセスする場所に応じた FE サービスのアクセス方式（ClusterIP/NodePort/LoadBalancer）の選び方
- メタデータの消失を防ぐための FE の永続ストレージの設定方法

## 設定の概要 {#configuration-overview}

存算分離モードでは、FE（Frontend）は主にクエリの解析と計画を担当します。この章では、次の順序で FE の設定について説明します。

| 設定項目 | 解決する課題 |
| --- | --- |
| コンピュートリソースの設定 | FE に CPU とメモリを明示的に割り当てる |
| Follower ノード数の設定 | 分散デプロイメントでメタデータ管理ノードを計画する |
| 起動設定のカスタマイズ | ConfigMap を使用してデフォルトの起動パラメータを上書きする |
| アクセス方式の設定 | アクセスする場所（クラスタ内、クラスタ外、クラウドプラットフォーム）に応じて FE サービスを公開する |
| 永続ストレージの設定 | FE の再起動後にメタデータが失われるのを防ぐ |

## コンピュートリソースの設定 {#configure-compute-resources}

Doris-Operator リポジトリの[デプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、FE のリソース制限はデフォルトで設定されていません。本番環境では、Kubernetes の [requests と limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) を使用して、FE のコンピュートリソースを明示的に設定することを推奨します。

次の例では、FE に 8c8Gi のコンピュートリソースを割り当てます。

```yaml
spec:
    feSpec:
        requests:
            cpu: 8
            memory: 8Gi
        limits:
            cpu: 8
            memory: 8Gi
```

この設定を、[デプロイする `DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)に適用します。

### JVM ヒープと Pod メモリ {#fe-jvm-memory}

Kubernetes の `requests.memory` はスケジューリングを制御し、`limits.memory` はコンテナの総メモリ量を制限します。Doris Operator は、どちらの値からも FE の JVM ヒープサイズを計算しません。ヒープ、Metaspace、スレッドスタック、ダイレクトメモリ、その他のネイティブメモリ割り当てを、コンテナのメモリ制限内に収める必要があります。

メモリ制限を引き下げる前に、デプロイするイメージから `fe.conf` をコピーし、JVM オプションの `-Xms` と `-Xmx` の両方を調整してください。JDK 17 のイメージでは、`JAVA_OPTS_FOR_JDK_17` を編集し、その他のオプションは維持してください。たとえば、以下の ConfigMap では、前述の 8 GiB のコンテナ制限内で 4 GiB のヒープを使用します。本番環境のヒープサイズは、メタデータの規模とワークロードに合わせて決めてください。「起動設定のカスタマイズ」で説明するように `feSpec.configMaps` を使用してファイルをマウントし、FE を再起動して設定を適用します。

Kubernetes で `OOMKilled` が報告された場合は、実際に適用されている JVM オプションと Pod のメモリ制限を比較してください。制限を引き上げる際もヒープ以外のメモリ用に余裕を残してください。ヒープを縮小する際は、大きい `-Xms` を残したまま `-Xmx` だけを引き下げないでください。

## Follower ノード数の設定 {#configure-the-number-of-follower-nodes}

FE サービスには次のロールがあり、それぞれの役割は以下のとおりです。

| ロール | 役割 |
| --- | --- |
| Follower | SQL の解析とメタデータの管理・保存を担当する |
| Observer | SQL の解析を担当し、Follower のクエリおよび書き込みの負荷を分担する |

Doris は bdbje ストレージシステムを使用してメタデータを管理します。bdbje の基盤となる実装は、Paxos プロトコルのアルゴリズムに似ています。分散デプロイメントでは、複数の Follower ノードを設定し、共同でメタデータ管理に参加させる必要があります。

`DorisDisaggregatedCluster` リソースを使用して Doris の存算分離クラスタをデプロイする場合、Follower のデフォルト数は 1 です。`electionNumber` フィールドで Follower ノードの数を調整できます。次の例では、Follower の数を 3 に設定します。

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip ヒント

存算分離クラスタのデプロイ後は、`electionNumber` を変更できません。デプロイ前に Follower の数を計画してください。

:::

## 起動設定のカスタマイズ {#custom-startup-configuration}

Doris Operator は、Kubernetes の ConfigMap を使用して FE の起動設定をマウントします。設定手順は次のとおりです。

### ステップ 1: FE の起動設定用 ConfigMap を作成する {#step-1-write-the-fe-startup-configmap}

次のように、FE の起動設定を含む ConfigMap を定義します。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: fe-configmap
    namespace: default
    labels:
        app.kubernetes.io/component: fe
data:
    fe.conf: |
        CUR_DATE=`date +%Y%m%d-%H%M%S`
        # Log dir
        LOG_DIR = ${DORIS_HOME}/log
        # For jdk 17, this JAVA_OPTS will be used as default JVM options
        JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx4096m -Xms4096m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
        # INFO, WARN, ERROR, FATAL
        sys_log_level = INFO
        # NORMAL, BRIEF, ASYNC
        sys_log_mode = NORMAL
        # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
        # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers
        http_port = 8030
        rpc_port = 9020
        query_port = 9030
        edit_log_port = 9010
        enable_fqdn_mode=true
        deploy_mode = cloud
```

### ステップ 2: 対象の名前空間に ConfigMap をデプロイする {#step-2-deploy-the-configmap-to-the-target-namespace}

次のコマンドで、`DorisDisaggregatedCluster` が存在する名前空間に ConfigMap をデプロイします。

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

パラメータの説明:

- `${namespace}`: `DorisDisaggregatedCluster` が存在する名前空間
- `${feConfigMapName}`: 上記の設定を含むファイルの名前

### ステップ 3: DorisDisaggregatedCluster から ConfigMap を参照する {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

[`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)を更新し、次のように `feSpec.configMaps` 配列を使用して ConfigMap をマウントします。

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip ヒント

Kubernetes デプロイメントで起動設定をカスタマイズする際は、次の点に注意してください。

1. `meta_service_endpoint` または `cluster_id` の設定を追加**しないでください**。Doris-Operator がこれらの値を自動的に注入します。
2. `enable_fqdn_mode=true` を**必ず**設定してください。

:::

## アクセス設定 {#access-configuration}

Doris-Operator は Kubernetes Service を使用して VIP と負荷分散の機能を提供します。アクセスする場所に応じて、次の公開方式から選択できます。

| アクセス方式 | 適した環境 | 説明 |
| --- | --- | --- |
| ClusterIP | Kubernetes クラスタ内からのみアクセスする場合 | デフォルトの方式で、追加設定は不要 |
| NodePort | Kubernetes クラスタの外部からアクセスする場合（自前で構築したクラスタでよく使用） | ホストのポートを介してサービスを公開する |
| LoadBalancer | クラウドプラットフォーム環境でクラウドのロードバランサーを介してアクセスする場合 | クラウドサービスプロバイダーがロードバランサーを提供する |

以下では、各方式の設定方法を説明します。

### ClusterIP 方式 {#clusterip-mode}

Kubernetes はデフォルトで [ClusterIP 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用します。この方式では、Kubernetes クラスタ内からのみアクセスできる内部アドレスが提供されます。

#### ステップ 1: ClusterIP を設定する {#step-1-configure-clusterip}

ClusterIP はデフォルトのアクセス方式です。使用するための**追加の変更は不要**です。

#### ステップ 2: Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスタのデプロイ後、次のコマンドで FE が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

出力例を以下に示します。

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

出力には、次の種類の Service が含まれます。

- `internal` サフィックスが付くもの: ハートビートやデータ交換など、Doris の内部通信にのみ使用され、外部には公開されない
- `internal` サフィックスが付かないもの: FE サービスへの外部アクセスに使用される

#### ステップ 3: コンテナ内から Doris にアクセスする {#step-3-access-doris-from-inside-a-container}

次のコマンドを実行し、現在の Kubernetes クラスタ内に MySQL クライアントを含む Pod を作成します。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

コンテナ内で、`internal` サフィックスが付かない Service 名を使用して Doris クラスタに接続します。

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### NodePort 方式 {#nodeport-mode}

Kubernetes クラスタの外部から Doris にアクセスするには、[NodePort 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を使用します。NodePort 方式には、次のポート割り当て方法があります。

| 割り当て方法 | 説明 |
| --- | --- |
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Kubernetes が未使用のホストポートを自動的に割り当てる（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定する。ホストポートが使用されておらず、競合がなければ、そのポートが固定で割り当てられる |

静的割り当てでは、ポートマッピングの計画が必要です。Doris はデフォルトで、外部との通信に次のポートを提供します。

**表 1: FE サービスのポートの説明**

| ポート名  | デフォルトのポート | ポートの説明                       |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | MySQL プロトコルを介した Doris クラスタへのアクセスに使用する |
| HTTP Port  | 8030    | FE の HTTP Server ポート。FE の情報の確認に使用する |

#### ステップ 1: FE の NodePort を設定する {#step-1-configure-fe-nodeport}

必要に応じて、次のいずれかの設定を選択します。

- **ポートの動的割り当て**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **ポートの静的割り当て**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
                portMaps:
                    - nodePort: 31001
                      targetPort: 8030
                    - nodePort: 31002
                      targetPort: 9030
    ```

#### ステップ 2: Service を取得する {#step-2-get-the-service}

クラスタのデプロイ後、次のコマンドで `Service` を確認します。

```shell
kubectl get service
```

出力を以下に示します。

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### ステップ 3: NodePort を介して Doris にアクセスする {#step-3-access-doris-through-nodeport}

MySQL 接続を例に説明します。Doris の Query Port がホストポート 31545 にマッピングされていると仮定します。手順は次のとおりです。

1. Kubernetes クラスタ内の任意のノードの IP アドレスを取得します。

    ```shell
    kubectl get nodes -owide
    ```

    出力例:

    ```shell
    NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
    r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    ```

2. 任意のノードの IP アドレス（192.168.88.62 など）とマッピング先のポートを使用して、Doris クラスタに接続します。

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer 方式 {#loadbalancer-mode}

[LoadBalancer 方式](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しています。ロードバランサーはクラウドサービスプロバイダーが提供します。

#### ステップ 1: LoadBalancer 方式を設定する {#step-1-configure-loadbalancer-mode}

`feSpec.service` のタイプを `LoadBalancer` に設定します。

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### ステップ 2: Service を取得する {#step-2-get-the-service-1}

クラスタのデプロイ後、次のコマンドで `Service` を確認します。

```shell
kubectl get service
```

出力例:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### ステップ 3: LoadBalancer を介してアクセスする {#step-3-access-through-the-loadbalancer}

MySQL 接続を例に説明します。Query Port が 9030 で待ち受けていると仮定します。次のコマンドで Doris クラスタに接続します。

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 永続ストレージ {#persistent-storage}

[デフォルトのデプロイ](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、FE サービスはメタデータの保存に Kubernetes の [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) を使用します。`EmptyDir` は永続化されないストレージ方式のため、**サービスの再起動後にメタデータが失われます**。

再起動後に FE のメタデータが失われないようにするには、FE の永続ストレージを設定してください。Doris Operator は次の選択肢を提供しています。用途に応じて選択してください。

| 選択肢 | 適した用途 |
| --- | --- |
| ストレージテンプレートによる自動生成 | ログとメタデータに同じストレージ設定を使用し、設定を簡略化する |
| マウントポイントのカスタム設定 | ディレクトリごとに異なるストレージ仕様が必要な場合 |
| ログを永続化しない | ログを標準出力にのみ書き込み、永続化する必要がない場合 |

### ストレージテンプレートによる自動生成 {#auto-generate-using-a-storage-template}

次のように、ストレージテンプレートを使用してログとメタデータの永続化を一括で設定します。

```yaml
spec:
    feSpec:
        persistentVolumes:
            - persistentVolumeClaimSpec:
                # storageClassName: ${storageclass_name}
                accessModes:
                    - ReadWriteOnce
                resources:
                    requests:
                        storage: 200Gi
```

この設定でクラスタをデプロイすると、次のようになります。

- Doris Operator がログディレクトリ（デフォルトは `/opt/apache-doris/fe/log`）とメタデータディレクトリ（デフォルトは `/opt/apache-doris/fe/doris-meta`）に永続ストレージを自動的にマウントする
- [起動設定のカスタマイズ](#custom-startup-configuration)でログディレクトリまたはメタデータディレクトリを明示的に指定した場合、Doris Operator がその設定を自動的に解析し、それに応じてストレージをマウントする
- 永続ストレージには [StorageClass 方式](https://kubernetes.io/docs/concepts/storage/storage-classes/)を使用する。`storageClassName` で使用する StorageClass を指定できる

### マウントポイントのカスタム設定 {#custom-mount-point-configuration}

Doris Operator は、ディレクトリごとのストレージ設定に対応しています。たとえば、カスタムストレージ設定を使用してログディレクトリに 300Gi のディスクをマウントし、ストレージテンプレートを使用してメタデータディレクトリに 200Gi のディスクをマウントします。

```yaml
spec:
    feSpec:
        persistentVolumes:
            - mountPaths:
                - /opt/apache-doris/fe/log
              persistentVolumeClaimSpec:
                # storageClassName: ${storageclass_name}
                accessModes:
                    - ReadWriteOnce
                resources:
                    requests:
                        storage: 300Gi
            - persistentVolumeClaimSpec:
                # storageClassName: ${storageclass_name}
                accessModes:
                    - ReadWriteOnce
                resources:
                    requests:
                        storage: 200Gi
```

:::tip ヒント

`mountPaths` 配列が空の場合、そのストレージ設定はテンプレート設定として扱われます。つまり、個別に設定されていないすべてのディレクトリに適用されます。

:::

### ログを永続化しない {#do-not-persist-logs}

ログを永続化せず、標準出力にのみ書き込む場合は、次の設定を使用します。

```yaml
spec:
    feSpec:
        logNotStore: true
```
