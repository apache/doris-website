---
{
    "title": "FE の設定",
    "language": "ja",
    "description": "ストレージとコンピュートを分離したクラスタでの FE（FrontEnd）の設定ガイド。コンピュートリソース、Follower の数、起動パラメータ、アクセス方式（ClusterIP／NodePort／LoadBalancer）、永続ストレージの設定を説明します。",
    "keywords": ["Doris", "ストレージとコンピュートの分離", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "永続ストレージ"]
}
---

## この章で学ぶこと

- FE コンポーネントのコンピュートリソース（CPU とメモリ）の設定方法
- FE Follower の数と役割の設定方法
- ConfigMap を使用して FE の起動パラメータをカスタマイズする方法
- アクセス元に応じた FE サービスのアクセス方式（ClusterIP／NodePort／LoadBalancer）の選び方
- メタデータの損失を防ぐための FE の永続ストレージの設定方法

## 設定の概要

ストレージとコンピュートを分離したモードでは、FE（Frontend）は主にクエリの解析と計画を担当します。この章では、以下の順に FE の設定を説明します。

| 設定項目 | 解決する課題 |
| --- | --- |
| コンピュートリソースの設定 | FE に CPU とメモリを明示的に割り当てる |
| Follower ノード数の設定 | 分散デプロイメントにおけるメタデータ管理ノードを計画する |
| 起動設定のカスタマイズ | ConfigMap を使用してデフォルトの起動パラメータを上書きする |
| アクセス方式の設定 | アクセス元（クラスタ内、クラスタ外、クラウドプラットフォーム）に応じて FE サービスを公開する |
| 永続ストレージの設定 | FE の再起動後にメタデータが失われるのを防ぐ |

## コンピュートリソースの設定

Doris-Operator リポジトリの[デプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、デフォルトで FE にリソース制限がありません。本番環境では、Kubernetes の [requests と limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) を使用して FE のコンピュートリソースを明示的に設定することを推奨します。

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

この設定を[デプロイ対象の `DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource)に適用します。

## Follower ノード数の設定

FE サービスには次の 2 つのロールがあります。

| ロール | 役割 |
| --- | --- |
| Follower | SQL の解析とメタデータの管理・保存を担当する |
| Observer | SQL の解析を担当し、Follower のクエリおよび書き込み負荷を分担する |

Doris は bdbje ストレージシステムを使用してメタデータを管理します。bdbje の基盤となる実装は、Paxos プロトコルのアルゴリズムに似ています。分散デプロイメントでは、メタデータの管理に共同で参加する複数の Follower ノードを設定する必要があります。

`DorisDisaggregatedCluster` リソースを使用して Doris のストレージとコンピュートを分離したクラスタをデプロイする場合、Follower のデフォルト数は 1 です。`electionNumber` フィールドで Follower ノード数を調整できます。次の例では Follower 数を 3 に設定します。

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip Tip

ストレージとコンピュートを分離したクラスタをデプロイした後は、`electionNumber` を変更できません。デプロイ前に Follower の数を決めてください。

:::

## 起動設定のカスタマイズ

Doris Operator は Kubernetes ConfigMap を通じて FE の起動設定をマウントします。設定手順は次のとおりです。

### ステップ 1：FE 起動用の ConfigMap を作成する

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
        JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
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

### ステップ 2：ConfigMap を対象の名前空間にデプロイする

次のコマンドを使用して、ConfigMap を `DorisDisaggregatedCluster` が存在する名前空間にデプロイします。

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

パラメータの説明：

- `${namespace}`：`DorisDisaggregatedCluster` が存在する名前空間
- `${feConfigMapName}`：上記の設定を含むファイルの名前

### ステップ 3：DorisDisaggregatedCluster から ConfigMap を参照する

次のように [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource)を更新し、`feSpec.configMaps` 配列を通じて ConfigMap をマウントします。

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip Tip

Kubernetes へのデプロイで起動設定をカスタマイズする場合は、次の 2 点に注意してください。

1. `meta_service_endpoint` または `cluster_id` を設定に**追加しないでください**。Doris-Operator がこれらの値を自動的に注入します。
2. `enable_fqdn_mode=true` を**必ず設定してください**。

:::

## アクセスの設定

Doris-Operator は Kubernetes Service を使用して VIP と負荷分散を提供します。アクセス元に応じて、次の 3 つの公開方式から選択できます。

| アクセス方式 | 適した場面 | 説明 |
| --- | --- | --- |
| ClusterIP | Kubernetes クラスタ内からのみアクセスする場合 | デフォルトの方式で、追加の設定は不要 |
| NodePort | Kubernetes クラスタ外からアクセスする場合（自前で構築したクラスタでよく使用） | ホストのポートを通じてサービスを公開する |
| LoadBalancer | クラウドプラットフォーム環境でクラウドのロードバランサーを通じてアクセスする場合 | ロードバランサーはクラウドサービスプロバイダーが提供する |

以下で各方式の設定方法を説明します。

### ClusterIP 方式

Kubernetes はデフォルトで [ClusterIP 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用します。この方式では、クラスタ内からのみアクセスできる内部アドレスが提供されます。

#### ステップ 1：ClusterIP を設定する

ClusterIP はデフォルトのアクセス方式なので、使用するための**追加の変更は不要**です。

#### ステップ 2：Service のアクセスアドレスを取得する

クラスタをデプロイした後、次のコマンドで FE が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

出力例：

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

出力には 2 種類の Service が含まれます。

- `internal` 接尾辞が付く Service：Doris の内部通信（ハートビートやデータ交換など）にのみ使用され、外部には公開されない
- `internal` 接尾辞が付かない Service：FE サービスへの外部アクセスに使用される

#### ステップ 3：コンテナ内から Doris にアクセスする

次のコマンドを実行して、現在の Kubernetes クラスタに MySQL クライアントを含む Pod を作成します。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

コンテナ内で、`internal` 接尾辞のない Service 名を使用して Doris クラスタに接続します。

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### NodePort 方式

Kubernetes クラスタ外から Doris にアクセスするには、[NodePort 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を使用します。NodePort 方式には、ポートを割り当てる方法が 2 つあります。

| 割り当て方法 | 説明 |
| --- | --- |
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Kubernetes が未使用のホストポートを自動的に割り当てる（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定する。ホストポートが使用中でなく競合がなければ、ポートは固定される |

静的割り当てでは、ポートマッピングを計画する必要があります。Doris はデフォルトで、外部との通信に次のポートを提供します。

**表 1：FE サービスのポートの説明**

| ポート名 | デフォルトのポート | 説明 |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030 | MySQL プロトコル経由で Doris クラスタにアクセスするために使用 |
| HTTP Port | 8030 | FE 上の HTTP Server のポート。FE の情報を確認するために使用 |

#### ステップ 1：FE の NodePort を設定する

必要に応じて、次のいずれかの設定を選択します。

- **ポートの動的割り当て**：

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **ポートの静的割り当て**：

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

#### ステップ 2：Service を取得する

クラスタをデプロイした後、次のコマンドで `Service` を確認します。

```shell
kubectl get service
```

出力例：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### ステップ 3：NodePort 経由で Doris にアクセスする

MySQL 接続を例にします。Doris の Query Port がホストポート 31545 にマッピングされていると仮定します。手順は次のとおりです。

1. Kubernetes クラスタ内の任意のノードの IP アドレスを取得します。

    ```shell
    kubectl get nodes -owide
    ```

    出力例：

    ```shell
    NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
    r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    ```

2. 任意のノードの IP アドレス（192.168.88.62 など）とマッピングされたポートを使用して、Doris クラスタに接続します。

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer 方式

[LoadBalancer 方式](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドサービスプロバイダーがロードバランサーを提供する、クラウドプラットフォーム上の Kubernetes 環境に適しています。

#### ステップ 1：LoadBalancer 方式を設定する

タイプ `LoadBalancer` を `feSpec.service` に設定します。

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### ステップ 2：Service を取得する

クラスタをデプロイした後、次のコマンドで `Service` を確認します。

```shell
kubectl get service
```

出力例：

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### ステップ 3：LoadBalancer 経由でアクセスする

MySQL 接続を例にします。Query Port が 9030 で待ち受けていると仮定します。次のコマンドで Doris クラスタに接続します。

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 永続ストレージ

[デフォルトのデプロイ](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、FE サービスはメタデータの保存先として Kubernetes の [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) を使用します。`EmptyDir` は永続ストレージではないため、**サービスの再起動後にメタデータが失われます**。

FE の再起動後もメタデータを失わないように、FE の永続ストレージを設定します。Doris Operator には次の 3 つの選択肢があります。必要に応じて選択してください。

| 選択肢 | 適した場面 |
| --- | --- |
| ストレージテンプレートによる自動生成 | ログとメタデータに同じストレージ設定を使用し、設定を簡素化する場合 |
| カスタムマウントポイントの設定 | ディレクトリごとに異なるストレージ仕様が必要な場合 |
| ログを永続化しない | ログを標準出力にのみ書き込み、永続化する必要がない場合 |

### ストレージテンプレートによる自動生成

次のようにストレージテンプレートを使用して、ログとメタデータに共通の永続ストレージ設定を適用します。

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

この設定でクラスタをデプロイすると、次のように動作します。

- Doris Operator がログディレクトリ（デフォルトは `/opt/apache-doris/fe/log`）とメタデータディレクトリ（デフォルトは `/opt/apache-doris/fe/doris-meta`）に永続ストレージを自動的にマウントする
- [起動設定のカスタマイズ](#custom-startup-configuration)でログまたはメタデータのディレクトリを明示的に指定した場合、Doris Operator がその設定を自動的に解析し、対応するストレージをマウントする
- 永続ストレージには [StorageClass 方式](https://kubernetes.io/docs/concepts/storage/storage-classes/)を使用する。`storageClassName` で目的の StorageClass を指定できる

### カスタムマウントポイントの設定

Doris Operator では、ディレクトリごとにストレージを設定できます。たとえば、カスタムストレージ設定でログディレクトリに 300Gi のディスクをマウントし、ストレージテンプレートでメタデータディレクトリに 200Gi のディスクをマウントできます。

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

:::tip Tip

`mountPaths` 配列が空の場合、そのストレージ設定はテンプレート設定として扱われます（つまり、個別に設定されていないすべてのディレクトリに適用されます）。

:::

### ログを永続化しない

ログを永続化せず、標準出力にのみ書き込む場合は、次のように設定します。

```yaml
spec:
    feSpec:
        logNotStore: true
```
