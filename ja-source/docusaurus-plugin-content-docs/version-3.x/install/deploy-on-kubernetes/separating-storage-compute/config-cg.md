---
{
  "title": "Config ComputeGroups",
  "language": "ja",
  "description": "分離されたストレージとコンピュートクラスターにおいて、Compute Groupはデータのインポートとオブジェクトストレージからのデータキャッシングを担当し、クエリを強化します"
}
---
分離されたストレージおよびコンピュート クラスターでは、Compute Groupがobject storageからのデータのインポートとキャッシュを担当し、クエリパフォーマンスを向上させます。コンピュート グループは相互に分離されています。

## 最小限のCompute Group設定
コンピュート グループは、同一のタスクを実行するBEノードのコレクションです。`DorisDisaggregatedCluster`リソースを設定する際、各コンピュート グループには一意の識別子を割り当てる必要があり、これは名前としても機能し、一度設定すると変更できません。最小限のコンピュート グループ設定は3つのコンポーネントから構成されます：`uniqueId`、`image`、`replicas`。例：

```yaml
spec:
  computeGroups:
   - uniqueId: ${uniqueId}
     image: ${beImage}
     replicas: 1
```
ここで、`${beImage}` は BE サービスをデプロイするために使用されるイメージです。[Apache Doris 公式リポジトリ](https://hub.docker.com/r/apache/doris) で提供されるイメージを使用してください。`${uniqueId}` は計算グループの一意識別子および名前で、パターン `[a-zA-Z][0-9a-zA-Z_]+` と一致する必要があります。`replicas` フィールドは計算グループ内の BE ノードの数を指定します。

## 複数の計算グループの設定
`DorisDisaggregatedCluster` リソースは複数の独立した計算グループのデプロイをサポートします。以下の例では、`cg1` と `cg2` の 2 つの計算グループを含む設定を示しています：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```
この例では、compute group `cg1` は3つのレプリカを持ち、compute group `cg2` は2つのレプリカを持ちます。compute groupは分離されていますが、各グループ内のBEノードは、分離クラスター全体で同じイメージを使用することが推奨されます。

## Compute リソースの設定
分離クラスターのデフォルトデプロイメントサンプルでは、BEサービスにリソース制限はありません。`DorisDisaggregatedCluster` リソースはKubernetesの [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用してCPUとメモリリソースを指定します。例えば、compute group `cg1` のBEノードに8つのCPUコアと8Giのメモリを割り当てるには、以下の設定を使用します：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```
この設定を適切な[DorisDisaggregatedCluster resource](install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster)に適用してください。

## アクセス設定
デフォルトでは、compute groupは外部にserviceを公開しません。Doris Operatorは`DorisDisaggregatedCluster` resource内のcompute groupに対するproxyとしてServiceを提供します。3つのservice公開モードがサポートされています：`ClusterIP`、`NodePort`、`LoadBalancer`です。

### ClusterIP
Kubernetesはデフォルトで[ClusterIP service type](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用し、これによりcluster内の内部アドレスが提供されます。

#### Step 1: Service TypeをClusterIPとして設定
DorisはKubernetesにおいてデフォルトでClusterIPモードを使用するよう設定されているため、追加の設定は不要です。

#### Step 2: Serviceアクセスアドレスの取得
clusterをデプロイした後、以下のコマンドを使用してcompute groupに対して公開されているServiceを確認してください：

```yaml
kubectl -n doris get svc
```
サンプル出力は以下のとおりです：

```yaml
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```
この出力は、`doris` namespace 内で `uniqueId` が `cg1` の compute group に対する Service を表示しています。

### NodePort
Kubernetes クラスター外部から Doris への外部アクセスが必要な場合、[NodePort service type](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport) を使用できます。NodePort は 2 つの設定方法をサポートします：静的ホストポートマッピングと動的ホストポート割り当て。
- 動的ホストポート割り当て：
    明示的なポートマッピングが提供されない場合、pod が作成される際に Kubernetes が自動的に未使用のホストポート（デフォルト範囲：30000–32767）を割り当てます。
- 静的ホストポートマッピング：
    ポートマッピングが指定され、ホストポートが利用可能な場合、Kubernetes はそのポートを割り当てます。静的割り当てでは、ポートマッピングを計画する必要があります。Doris は外部との相互作用のために以下のポートを提供します：

| Port Name | Default Port	 | Description                     |
|--| ---- |--------------------------|
| Web Server Port | 8040 | BE 上の HTTP server port、BE 情報の表示に使用されます。|

#### Static Configuration
compute group `cg1` の場合、静的 NodePort 設定は以下の通りです：

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      service:
        type: NodePort
        portMaps:
          - nodePort: 31012
            targetPort: 8040
```
この設定では、コンピュートグループ`cg1`のBEリスニングポート8040がホストポート31012にマップされます。

#### 動的設定
コンピュートグループ`cg1`の動的NodePort設定は以下の通りです：

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      service:
        type: NodePort
```
### LoadBalancer モード
[LoadBalancer service](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) タイプは、クラウドベースの Kubernetes 環境で適用可能であり、クラウドプロバイダーのロードバランサーによって提供されます。
以下のように、`computeGroup.service` タイプを LoadBalancer に設定します：

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```
## カスタムスタートアップ設定
1. スタートアップ情報を含むカスタムConfigMapの作成
    デフォルトのデプロイメントでは、各コンピュートグループのBEサービスは、イメージに埋め込まれたデフォルト設定ファイルで起動します。Doris OperatorはKubernetes ConfigMapを使用してカスタムスタートアップ設定ファイルをマウントします。以下はBEサービス用のConfigMapの例です：

    ```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: be-configmap
      labels:
        app.kubernetes.io/component: be
    data:
      be.conf: |
        # For JDK 17, these JAVA_OPTS serve as the default JVM options
        JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
        file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
        deploy_mode = cloud
    ```
分離クラスターにおけるBEサービスのスタートアップ設定には、file_cache_path設定を含める必要があります。必要な形式については、[Doris decoupled configuration for be.conf](./../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf)を参照してください。

2. ConfigMapをデプロイする
    以下のコマンドを使用して、スタートアップ設定を含むカスタムConfigMapをKubernetesクラスターにデプロイします：

    ```yaml
    kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml
    ```
ここで、`${namespace}` は `DorisDisaggregatedCluster` がデプロイされる名前空間であり、`${beConfigMapFileName}` はカスタム ConfigMap を含むファイルの名前です。

3. ConfigMap を使用するように DorisDisaggregatedCluster リソースを更新する
    以下に示すように、必要な場所に ConfigMap をマウントするようにリソースを変更します：

    ```yaml
    spec:
      computeGroups:
      - uniqueId: cg1
        configMaps:
        - name: be-configmap
          mountPath: "/etc/doris"
    ```
:::tip Note
起動設定は `/etc/doris` ディレクトリにマウントする必要があります。
:::

## 永続ストレージ設定
デフォルトのデプロイメントでは、BEサービスはキャッシュとしてKubernetes [`EmptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) を使用します。EmptyDirは非永続ストレージモードであり、サービス再起動後にキャッシュされたデータが失われ、クエリパフォーマンスが低下する可能性があります。

サービス再起動後にキャッシュされたデータが保持され、クエリ効率が低下しないようにするには、キャッシュに永続ストレージを設定する必要があります。BEサービスのログは、標準出力と起動設定の `LOG_DIR` パラメータで指定されたディレクトリの両方に出力されます。さらに、StreamLoadインポートプロセスは `/opt/apache-doris/be/storage` を一時ストレージの場所として使用します。予期しないサービス再起動によるデータ損失を防ぐため、このディレクトリにも永続ストレージをマウントする必要があります。

### 永続ストレージの例
以下は、必要なデータディレクトリに永続ストレージをマウントする設定例です：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/be/log
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - mountPaths:
      - /opt/apache-doris/be/storage
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
            storage: 500Gi
```
この設定では、カスタムストレージ設定を使用して300GiのPersistent Volumeがログディレクトリにマウントされます。別の300GiのPersistent VolumeがWALおよびStreamLoadインポート用のディレクトリにマウントされます。キャッシュディレクトリには、ストレージテンプレートから作成された500GiのPersistent Volumeがマウントされます。

:::tip Note
- mountPaths配列が空の場合、現在のストレージ設定はテンプレートとして扱われます。ユーザーが[startup configuration](#custom-startup-configuration)でfile_cache_pathを指定すると、operatorが自動的にディレクトリパスを解析してマウントします。

- クラウドディスクのパフォーマンスを最大化するため、4つのディレクトリを設定し、4つのPersistent Volumeをマウントすることを推奨します。
:::

### ログの永続化を無効にする
ログの永続化が不要で、ログを標準出力にのみ出力する場合は、以下のように設定します：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
