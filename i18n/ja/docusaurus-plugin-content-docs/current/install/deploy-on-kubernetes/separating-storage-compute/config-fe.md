---
{
    "title": "FE の設定",
    "language": "ja",
    "description": "ストレージとコンピュートを分離したクラスタにおける FE（FrontEnd）の設定について、計算リソース、Follower 数、起動パラメータ、アクセスモード（ClusterIP/NodePort/LoadBalancer）、永続ストレージの設定を詳しく説明します。",
    "keywords": ["Doris", "storage-compute separation", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "persistent storage"]
}
---

## この章で学ぶこと {#what-you-will-learn-in-this-chapter}

- FE コンポーネントの計算リソース（CPU とメモリ）の設定方法
- FE の Follower 数と各ロールの設定方法
- ConfigMap を使った FE の起動パラメータのカスタマイズ方法
- アクセスする環境に応じた FE サービスのアクセスモード（ClusterIP/NodePort/LoadBalancer）の選び方
- メタデータの消失を防ぐための FE の永続ストレージの設定方法

## 設定の概要 {#configuration-overview}

ストレージとコンピュートを分離したモードでは、FE（Frontend）は主にクエリの解析と計画を担当します。この章では、以下の順に FE の設定を説明します。

| 設定項目 | 対応する課題 |
| --- | --- |
| 計算リソースの設定 | FE に CPU とメモリを明示的に割り当てる |
| Follower ノード数の設定 | 分散デプロイメントでメタデータを管理するノードを計画する |
| 起動設定のカスタマイズ | ConfigMap を使ってデフォルトの起動パラメータを上書きする |
| アクセスモードの設定 | アクセスする環境（クラスタ内、クラスタ外、クラウドプラットフォーム）に応じて FE サービスを公開する |
| 永続ストレージの設定 | FE の再起動後にメタデータが失われるのを防ぐ |

## 計算リソースの設定 {#configure-compute-resources}

Doris-Operator リポジトリが提供する[デプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、デフォルトで FE のリソース制限は設定されていません。本番環境では、Kubernetes の [requests と limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) を使用して FE の計算リソースを明示的に設定することを推奨します。

以下は、FE に 8c8Gi の計算リソースを割り当てる例です。

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

### JVM ヒープと Pod のメモリ {#fe-jvm-memory}

Kubernetes の `requests.memory` はスケジューリングに使用され、`limits.memory` はコンテナ全体のメモリを制限します。Doris Operator は、どちらの値からも FE の JVM ヒープサイズを計算しません。ヒープ、Metaspace、スレッドスタック、直接メモリ、その他のネイティブメモリ割り当ての合計をコンテナのメモリ制限内に収める必要があります。

メモリ制限を引き下げる前に、デプロイするイメージから `fe.conf` をコピーし、JVM オプションの `-Xms` と `-Xmx` の両方を調整してください。JDK 17 のイメージでは、`JAVA_OPTS_FOR_JDK_17` を編集し、ほかのオプションは保持してください。たとえば、以下の ConfigMap では、上記の 8 GiB のコンテナ制限内で 4 GiB のヒープを使用します。本番環境のヒープサイズは、メタデータとワークロードに合わせて決めてください。「起動設定のカスタマイズ」で説明するように、`feSpec.configMaps` を通じてファイルをマウントし、FE を再起動して設定を適用します。

Kubernetes が `OOMKilled` を報告した場合は、実際に適用されている JVM オプションと Pod のメモリ制限を比較してください。制限を引き上げる際はヒープ以外のメモリ用に余裕を残してください。ヒープを縮小する際は、より大きい `-Xms` を残したまま `-Xmx` だけを引き下げないでください。

## Follower ノード数の設定 {#configure-the-number-of-follower-nodes}

FE サービスには、以下の役割を持つロールがあります。

| ロール | 担当する処理 |
| --- | --- |
| Follower | SQL の解析とメタデータの管理・保存 |
| Observer | SQL の解析と、Follower のクエリ処理および書き込み負荷の分担 |

Doris は bdbje ストレージシステムを使用してメタデータを管理します。bdbje の基盤となる実装は Paxos プロトコルのアルゴリズムに似ています。分散デプロイメントでは、複数の Follower ノードが共同でメタデータ管理に参加するように設定する必要があります。

`DorisDisaggregatedCluster` リソースを使用して、ストレージとコンピュートを分離した Doris クラスタをデプロイする場合、Follower のデフォルト数は 1 です。`electionNumber` フィールドで Follower ノード数を調整できます。以下の例では、Follower 数を 3 に設定します。

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip ヒント

ストレージとコンピュートを分離したクラスタをデプロイした後は、`electionNumber` を変更できません。デプロイ前に Follower 数を計画してください。

:::

## 起動設定のカスタマイズ {#custom-startup-configuration}

Doris Operator は、Kubernetes の ConfigMap を通じて FE の起動設定をマウントします。設定手順は以下のとおりです。

### ステップ 1: FE の起動設定用 ConfigMap を作成する {#step-1-write-the-fe-startup-configmap}

以下のように、FE の起動設定を含む ConfigMap を定義します。

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

### ステップ 2: ConfigMap を対象の名前空間にデプロイする {#step-2-deploy-the-configmap-to-the-target-namespace}

以下のコマンドで、`DorisDisaggregatedCluster` が存在する名前空間に ConfigMap をデプロイします。

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

パラメータの説明:

- `${namespace}`: `DorisDisaggregatedCluster` が存在する名前空間
- `${feConfigMapName}`: 上記の設定を含むファイルの名前

### ステップ 3: DorisDisaggregatedCluster から ConfigMap を参照する {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

[`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)を更新し、以下のように `feSpec.configMaps` 配列を通じて ConfigMap をマウントします。

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip ヒント

Kubernetes デプロイメントで起動設定をカスタマイズする際は、以下の点に注意してください。

1. `meta_service_endpoint` または `cluster_id` の設定を**追加しないでください**。Doris-Operator がこれらの値を自動的に注入します。
2. `enable_fqdn_mode=true` を**必ず設定してください**。

:::

## アクセス設定 {#access-configuration}

Doris-Operator は Kubernetes Service を使用して VIP と負荷分散機能を提供します。アクセスする環境に応じて、以下の公開モードから選択できます。

| アクセスモード | 適した環境 | 説明 |
| --- | --- | --- |
| ClusterIP | Kubernetes クラスタ内からのみアクセスする場合 | デフォルトのモード。追加の設定は不要 |
| NodePort | Kubernetes クラスタ外からアクセスする場合（独自構築のクラスタで一般的） | ホストのポートを通じてサービスを公開する |
| LoadBalancer | クラウドプラットフォーム上でクラウドのロードバランサーを通じてアクセスする場合 | クラウドサービスプロバイダーがロードバランサーを提供する |

以下では、各モードの設定方法を説明します。

### ClusterIP モード {#clusterip-mode}

Kubernetes はデフォルトで [ClusterIP モード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用します。このモードでは、Kubernetes クラスタ内からのみアクセスできる内部アドレスが提供されます。

#### ステップ 1: ClusterIP を設定する {#step-1-configure-clusterip}

ClusterIP はデフォルトのアクセスモードであり、使用するための**追加の変更は不要**です。

#### ステップ 2: Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスタのデプロイ後、以下のコマンドで FE が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

出力例を以下に示します。

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

出力には、以下の種類の Service が含まれます。

- `internal` 接尾辞が付く Service: ハートビートやデータ交換など、Doris 内部の通信にのみ使用され、外部には公開されない
- `internal` 接尾辞が付かない Service: FE サービスへの外部アクセスに使用される

#### ステップ 3: コンテナ内から Doris にアクセスする {#step-3-access-doris-from-inside-a-container}

以下のコマンドで、現在の Kubernetes クラスタに MySQL クライアントを含む Pod を作成します。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

コンテナ内で、`internal` 接尾辞のない Service 名を使用して Doris クラスタに接続します。

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### NodePort モード {#nodeport-mode}

Kubernetes クラスタの外部から Doris にアクセスするには、[NodePort モード](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を使用します。NodePort モードでは、次の方法でポートを割り当てられます。

| 割り当て方法 | 説明 |
| --- | --- |
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Kubernetes が未使用のホストポートを自動的に割り当てる（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定する。ホストポートが使用されておらず競合がなければ、そのポートが固定される |

静的に割り当てる場合は、ポートマッピングを計画する必要があります。Doris はデフォルトで、外部との通信に以下のポートを提供します。

**表 1: FE サービスのポートの説明**

| ポート名  | デフォルトポート | ポートの説明                       |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | MySQL プロトコルを通じて Doris クラスタにアクセスするために使用する |
| HTTP Port  | 8030    | FE 上の HTTP Server のポート。FE の情報を確認するために使用する |

#### ステップ 1: FE の NodePort を設定する {#step-1-configure-fe-nodeport}

必要に応じて、以下の設定から選択します。

- **動的ポート割り当て**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **静的ポート割り当て**:

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

クラスタのデプロイ後、以下のコマンドで `Service` を確認します。

```shell
kubectl get service
```

出力例を以下に示します。

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### ステップ 3: NodePort を通じて Doris にアクセスする {#step-3-access-doris-through-nodeport}

MySQL 接続を例にします。Doris の Query Port がホストポート 31545 にマッピングされていると仮定します。手順は以下のとおりです。

1. Kubernetes クラスタ内のいずれかのノードの IP アドレスを取得します。

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

2. いずれかのノードの IP アドレス（192.168.88.62 など）とマッピングされたポートを使用して、Doris クラスタに接続します。

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer モード {#loadbalancer-mode}

[LoadBalancer モード](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しています。ロードバランサーはクラウドサービスプロバイダーによって提供されます。

#### ステップ 1: LoadBalancer モードを設定する {#step-1-configure-loadbalancer-mode}

タイプを `LoadBalancer` に設定するには、`feSpec.service` に以下を指定します。

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### ステップ 2: Service を取得する {#step-2-get-the-service-1}

クラスタのデプロイ後、以下のコマンドで `Service` を確認します。

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

#### ステップ 3: LoadBalancer を通じてアクセスする {#step-3-access-through-the-loadbalancer}

MySQL 接続を例にします。Query Port が 9030 で待ち受けていると仮定すると、以下のコマンドで Doris クラスタに接続できます。

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 永続ストレージ {#persistent-storage}

[デフォルトのデプロイメント](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、FE サービスは Kubernetes の [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) をメタデータの保存に使用します。`EmptyDir` は永続ストレージではないため、**サービスの再起動後にメタデータが失われます**。

FE の再起動後もメタデータが失われないように、FE に永続ストレージを設定してください。Doris Operator では以下の選択肢が用意されています。要件に応じて選択してください。

| 選択肢 | 適した状況 |
| --- | --- |
| ストレージテンプレートによる自動生成 | ログとメタデータに同じストレージ設定を使用し、設定を簡単にしたい場合 |
| マウントポイントのカスタム設定 | ディレクトリごとに異なるストレージ仕様が必要な場合 |
| ログを永続化しない | ログを標準出力にのみ書き込み、永続化する必要がない場合 |

### ストレージテンプレートによる自動生成 {#auto-generate-using-a-storage-template}

以下のようにストレージテンプレートを使用して、ログとメタデータを共通の設定で永続化します。

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

この設定でクラスタをデプロイすると、以下が適用されます。

- Doris Operator は、ログディレクトリ（デフォルトは `/opt/apache-doris/fe/log`）とメタデータディレクトリ（デフォルトは `/opt/apache-doris/fe/doris-meta`）に永続ストレージを自動的にマウントする
- [起動設定のカスタマイズ](#custom-startup-configuration)でログディレクトリまたはメタデータディレクトリを明示的に指定した場合、Doris Operator はその設定を自動的に解析し、対応するストレージをマウントする
- 永続ストレージには [StorageClass モード](https://kubernetes.io/docs/concepts/storage/storage-classes/)を使用する。`storageClassName` で使用する StorageClass を指定できる

### マウントポイントのカスタム設定 {#custom-mount-point-configuration}

Doris Operator は、ディレクトリごとのストレージ設定をサポートします。たとえば、カスタムストレージ設定を使用してログディレクトリに 300Gi のディスクをマウントし、ストレージテンプレートを使用してメタデータディレクトリに 200Gi のディスクをマウントできます。

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

ログを永続化せず、標準出力にのみ書き込む場合は、以下の設定を使用します。

```yaml
spec:
    feSpec:
        logNotStore: true
```
