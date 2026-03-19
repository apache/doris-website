---
{
  "title": "Config FE",
  "language": "ja",
  "description": "FEは主に、分離されたストレージとコンピュートモードにおけるクエリ解析、プランニング、および関連タスクを担当する。"
}
---
FEは分離ストレージ・コンピューティングモードにおいて、主にクエリ解析、プランニング、および関連タスクを担当します。

## コンピューティングリソースの設定
[Doris Operatorリポジトリ](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)で提供されているデプロイメントサンプルでは、FEサービスはデフォルトでリソース制限がありません。サービスのCPUおよびメモリリソースは、Kubernetesの[requests and limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)を使用して設定できます。例えば、FEに8個のCPUコアと8Giのメモリを割り当てるには、以下の設定を使用します：

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
上記の設定を、デプロイ予定の[DorisDisaggregatedCluster resource](./install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster)で更新してください。

## Follower ノード数の設定
Doris Frontend (FE) サービスには、FollowerとObserverの2つのタイプの役割があります。Followerノードは、SQL解析、メタデータ管理、ストレージを担当します。ObserverノードはSQLの解析を行い、Followerからのクエリと書き込みトラフィックを分散します。Dorisはメタデータ管理にbdbjeストレージシステムを使用し、Paxosプロトコルに類似したアルゴリズムを実装しています。

分散デプロイメントでは、分散環境内でのメタデータ管理に参加するために、複数のFollowerノードを設定する必要があります。

`DorisDisaggregatedCluster` resourceを使用してコンピューティングとストレージが分離されたDorisクラスタをデプロイする場合、Followerノードのデフォルト数は1に設定されています。以下の設定を使用してFollowerの数を設定できます。以下の例では、3つのFollowerノードを設定しています：

```yaml
spec:
  feSpec:
    electionNumber: 3
```
:::tip 注意
分散クラスターがデプロイされると、`electionNumber`設定は変更できません。
:::

## カスタムスタートアップ設定
Doris OperatorはKubernetes ConfigMapを使用してFEスタートアップ設定をマウントします。設定するには以下の手順に従ってください：

1. FEスタートアップ設定を含むカスタムConfigMapの作成  
    デフォルトのデプロイメントでは、各FEサービスはイメージに埋め込まれたデフォルト設定ファイルで起動します。カスタムConfigMapを作成することでこれをオーバーライドできます。例：

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
2. ConfigMapをデプロイする  
    次を実行して、DorisDisaggregatedClusterリソースが存在するnamespaceにカスタムConfigMapをデプロイします：

    ```shell
    kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
    ```
ここで、`${namespace}`は`DorisDisaggregatedCluster`リソースの名前空間であり、`${feConfigMapName}`はConfigMapのファイル名です。

3. ConfigMapを使用するように`DorisDisaggregatedCluster`リソースを更新する  
    `DorisDisaggregatedCluster`リソースで、以下に示すように`feSpec.configMaps`配列を使用してConfigMapをマウントします：

    ```yaml
    spec:
      feSpec:
        replicas: 2
        configMaps:
        - name: fe-configmap
    ```
`DorisDisaggregatedCluster`リソースでは、`configMaps`フィールドは配列であり、各要素の`name`は現在のnamespace内のConfigMapの名前を表します。

:::tip Tip
1. Kubernetesデプロイメントでは、起動設定に`meta_service_endpoint`や`cluster_id`を含める必要はありません。Doris Operatorがこの情報を自動的に追加するためです。
2. 起動設定をカスタマイズする際は、`enable_fqdn_mode`をtrueに設定する必要があります。
:::

## アクセス設定
Doris OperatorはKubernetes Servicesを使用してVIPとロードバランシング機能を提供し、3つの公開モードをサポートします：`ClusterIP`、`NodePort`、`LoadBalancer`。

### ClusterIPモード
Kubernetesはデフォルトで[`ClusterIP service type`](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用します。このモードはKubernetesクラスター内部のアドレスを提供します。

#### ステップ1：ClusterIPモードの設定
デフォルトでは、DorisはKubernetes上でClusterIPモードを使用するよう設定されており、追加の設定は必要ありません。

#### ステップ2：Serviceアクセスアドレスの取得
クラスターをデプロイした後、以下を実行してFE serviceを確認します：

```yaml
kubectl -n doris get svc
```
サンプル出力は以下の通りです：

```yaml
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```
上記の出力では、接尾辞「internal」が付いたサービスは内部通信（例：ハートビート、データ交換）にのみ使用され、外部には公開されません。「internal」接尾辞が付いていないサービスは、FEサービスへの外部アクセスに使用されます。

#### ステップ3: コンテナ内からDorisにアクセスする
現在のKubernetesクラスタでMySQLクライアントを含むPodを作成するには、次のコマンドを実行します：

```yaml
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
Pod内で、"internal"サフィックスを持たないService名を使用してDorisクラスターに接続します：

```yaml
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```
### NodePortモード
KubernetesクラスターからDorisに外部アクセスするには、[NodePortサービスタイプ](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を使用できます。NodePortモードは、静的ホストポート割り当てと動的ホストポート割り当ての2つの設定方法をサポートしています。
- 動的ホストポート割り当て：
    明示的なポートマッピングが提供されない場合、Kubernetesはpodの作成時に未使用のホストポート（デフォルト範囲：30000–32767）を自動的に割り当てます。
- 静的ホストポート割り当て：
    ポートマッピングが明示的に指定され、ホストポートが利用可能で競合がない場合、Kubernetesはそのポートを割り当てます。静的割り当ての場合、ポートマッピングを計画する必要があります。Dorisは外部との相互作用のために以下のポートを提供します：

| ポート名 | デフォルトポート | 説明 |
|------------|-------------|----------------------------------------------------------|
| Query Port | 9030        | MySQLプロトコル経由でDorisクラスターにアクセスするために使用されます。 |
| HTTP Port  | 8030        | FE上のHTTPサーバーポートで、FE情報の表示に使用されます。 |

#### ステップ1：FE NodePortの設定
- 動的割り当て設定：

    ```yaml
    spec:
      feSpec:
        service:
          type: NodePort
    ```
- Static Assignment設定例:

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
#### ステップ2: Serviceの取得
クラスターがデプロイされた後、以下のコマンドを実行してServiceを確認します：

```yaml
kubectl get service
```
サンプル出力は以下の通りです：

```yaml
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```
#### ステップ3: NodePortを使用したDorisへのアクセス
例えば、DorisのQuery Portがホストポート31545にマップされている場合、まずKubernetesクラスター内の1つのノードのIPアドレスを以下を実行して取得します:

```yaml
kubectl get nodes -o wide
```
サンプル出力は以下のとおりです：

```yaml
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
これらのノードIPのいずれか（例：192.168.88.62）を使用して、以下でDorisクラスターに接続します：

```yaml
mysql -h 192.168.88.62 -P31545 -uroot
```
### LoadBalancerモード
[LoadBalancerサービス](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)タイプは、クラウドベースのKubernetes環境に適用でき、クラウドプロバイダーのロードバランサーによって提供されます。

#### ステップ1: LoadBalancerモードを設定する
以下に示すように、`feSpec.service`タイプをLoadBalancerに設定します：

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```
#### Step 2: Serviceの取得
クラスターをデプロイした後、以下のコマンドを実行してServiceを確認します：

```yaml
kubectl get service
```
サンプル出力は以下の通りです：

```yaml
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```
#### ステップ3: LoadBalancerを使用したDorisへのアクセス
例えば、DorisのQuery Portがポート9030で待機している場合、以下を使用して接続します：

```yaml
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P9030 -uroot
```
## 永続ストレージ
デフォルトのデプロイメントでは、FEサービスはメタデータストレージモードとしてKubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)を使用します。EmptyDirは非永続であるため、サービス再起動後にメタデータが失われます。再起動後にFEメタデータが保持されることを保証するには、永続ストレージを設定する必要があります。

### ストレージテンプレートを使用した永続ストレージの自動生成
以下に示すように、ストレージテンプレートを使用してログとメタデータの永続ストレージを設定します：

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
上記の設定でデプロイされると、Doris Operatorはログディレクトリ（デフォルト `/opt/apache-doris/fe/log`）とメタデータディレクトリ（デフォルト `/opt/apache-doris/fe/doris-meta`）に対して永続ストレージを自動的にマウントします。ログまたはメタデータディレクトリが[カスタム起動設定](#custom-startup-configuration)で明示的に指定されている場合、Doris Operatorはそれを解析し、それに応じて永続ストレージをマウントします。永続ストレージは[StorageClassメカニズム](https://kubernetes.io/docs/concepts/storage/storage-classes/)を使用して実装されており、`storageClassName`フィールドを通じて必要なStorageClassを指定することができます。

### カスタムマウントポイント設定
Doris Operatorはマウントポイントのカスタマイズされたストレージ設定をサポートします。次の例では、カスタム設定を使用してログディレクトリに300Giのストレージをマウントし、ストレージテンプレートを使用してメタデータディレクトリに200Giをマウントします：

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
`mountPaths`配列が空の場合、現在のストレージ設定がテンプレート設定を使用していることを示します。
:::

### ログの永続化を無効にする
ログの永続化が不要で、ログを標準出力にのみ出力したい場合は、以下のように設定します：

```yaml
spec:
  feSpec:
    logNotStore: true
```
