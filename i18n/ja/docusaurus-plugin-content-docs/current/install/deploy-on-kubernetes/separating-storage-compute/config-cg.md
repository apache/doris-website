---
{
  "title": "Config ComputeGroups",
  "language": "ja",
  "description": "疎結合ストレージ・コンピュートクラスターにおいて、Compute Groupは、オブジェクトストレージからのデータインポートとデータキャッシュを担当し、クエリを向上させる"
}
---
分離されたストレージとCompute Groupクラスタにおいて、Compute Groupはオブジェクトストレージからのデータインポートとデータキャッシュを担当し、クエリパフォーマンスを向上させます。Compute Groupは互いに分離されています。

## 最小限のCompute Group設定
Compute Groupは同一のタスクを実行するBEノードの集合です。`DorisDisaggregatedCluster`リソースを設定する際、各Compute Groupには名前としても機能する一意の識別子を割り当てる必要があり、一度設定すると変更できません。最小限のCompute Group設定は3つのコンポーネントで構成されます：`uniqueId`、`image`、`replicas`。例：

```yaml
spec:
  computeGroups:
   - uniqueId: ${uniqueId}
     image: ${beImage}
     replicas: 1
```
ここで、`${beImage}`はBEサービスをデプロイするために使用されるイメージです。[Apache Doris公式リポジトリ](https://hub.docker.com/r/apache/doris)から提供されるイメージを使用してください。`${uniqueId}`はコンピュートグループの一意識別子および名前であり、`[a-zA-Z][0-9a-zA-Z_]+`パターンに一致する必要があります。`replicas`フィールドは、コンピュートグループ内のBEノード数を指定します。

## 複数のコンピュートグループの設定
`DorisDisaggregatedCluster`リソースは、複数の独立したコンピュートグループのデプロイをサポートします。以下の例では、`cg1`と`cg2`という2つのコンピュートグループを含む設定を示しています：

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
この例では、コンピュートグループ `cg1` には3つのレプリカがあり、コンピュートグループ `cg2` には2つのレプリカがあります。コンピュートグループは分離されていますが、各グループ内のBEノードは分離クラスター全体で同じイメージを使用することが推奨されます。

## コンピュートリソースの設定
分離クラスターのデフォルトデプロイメントサンプルでは、BEサービスにリソース制限はありません。`DorisDisaggregatedCluster` リソースは、Kubernetes の [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用してCPUとメモリリソースを指定します。例えば、コンピュートグループ `cg1` のBEノードに8つのCPUコアと8Giのメモリを割り当てるには、以下の設定を使用します：

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
この設定を適切な[DorisDisaggregatedClusterリソース](install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster)に適用してください。

## アクセス設定
デフォルトでは、computeグループは外部にサービスを公開しません。Doris Operatorは`DorisDisaggregatedCluster`リソース内のcomputeグループのプロキシとしてServiceを提供します。`ClusterIP`、`NodePort`、`LoadBalancer`の3つのサービス公開モードがサポートされています。

### ClusterIP
Kubernetesはデフォルトで[ClusterIPサービスタイプ](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用し、これによりクラスタ内の内部アドレスが提供されます。

#### ステップ1：ServiceタイプをClusterIPとして設定
DorisはデフォルトでKubernetes内のClusterIPモードを使用するよう設定されており、追加の設定は不要です。

#### ステップ2：Serviceアクセスアドレスの取得
クラスタをデプロイ後、以下のコマンドを使用してcomputeグループに公開されたServiceを確認してください：

```yaml
kubectl -n doris get svc
```
サンプル出力は以下の通りです：

```yaml
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```
この出力は、`doris` namespace 内の `uniqueId` が `cg1` である compute group の Service を示しています。

### NodePort
Kubernetes クラスター外部から Doris への外部アクセスが必要な場合、[NodePort サービスタイプ](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を使用できます。NodePort は2つの設定方法をサポートしています：静的ホストポートマッピングと動的ホストポート割り当て。
- 動的ホストポート割り当て：
  明示的なポートマッピングが提供されていない場合、Kubernetes は pod が作成される際に自動的に未使用のホストポート（デフォルト範囲：30000–32767）を割り当てます。
- 静的ホストポートマッピング：
  ポートマッピングが指定されており、ホストポートが利用可能な場合、Kubernetes はそのポートを割り当てます。静的割り当ての場合、ポートマッピングを計画する必要があります。Doris は外部との相互作用のために以下のポートを提供します：

| Port Name | Default Port	 | Description                     |
|--| ---- |--------------------------|
| Web Server Port | 8040 | BE 上の HTTP サーバーポート、BE 情報を表示するために使用されます。|

#### 静的設定
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
この設定では、コンピュートグループ`cg1`のBEリスニングポート8040がホストポート31012にマップされています。

#### Dynamic Configuration
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
`computeGroup.service` タイプを LoadBalancer に設定します。以下のように：

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
   デフォルトのデプロイメントでは、各コンピュートグループのBEサービスは、イメージに埋め込まれたデフォルト設定ファイルで起動します。Doris Operatorは、Kubernetes ConfigMapを使用してカスタムスタートアップ設定ファイルをマウントします。以下はBEサービス用のConfigMapの例です：

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
デカップルドクラスターのBEサービスのスタートアップ設定には、file_cache_path設定を含める必要があります。必要な形式については、[Doris decoupled configuration for be.conf](./../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf)を参照してください。

2. ConfigMapをデプロイする
   以下のコマンドを使用して、スタートアップ設定を含むカスタムConfigMapをKubernetesクラスターにデプロイします：

    ```yaml
    kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml
    ```
ここで、`${namespace}` は `DorisDisaggregatedCluster` がデプロイされる名前空間であり、`${beConfigMapFileName}` はカスタムConfigMapを含むファイルの名前です。

3. ConfigMapを使用するためにDorisDisaggregatedClusterリソースを更新する
   以下に示すように、必要な場所にConfigMapをマウントするためにリソースを変更します：

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
デフォルトのデプロイメントでは、BEサービスはキャッシュとしてKubernetes [`EmptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) を使用します。EmptyDirは非永続ストレージモードであり、サービスの再起動後にキャッシュされたデータが失われることを意味し、クエリパフォーマンスが低下する可能性があります。

サービスの再起動後にキャッシュされたデータが保持され、クエリ効率が低下しないようにするため、キャッシュ用に永続ストレージを設定する必要があります。BEサービスのログは、標準出力と起動設定の `LOG_DIR` パラメータで指定されたディレクトリの両方に出力されます。さらに、StreamLoadインポートプロセスは `/opt/apache-doris/be/storage` を一時ストレージの場所として使用します。予期しないサービス再起動によるデータ損失を防ぐため、このディレクトリにも永続ストレージをマウントする必要があります。

### 永続ストレージの例
以下は、必要なデータディレクトリに永続ストレージをマウントするための設定例です：

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
この設定では、カスタムストレージ設定を使用してログディレクトリに300Giの永続ボリュームがマウントされます。もう一つの300Giの永続ボリュームが、WALとStreamLoadインポートに使用されるディレクトリにマウントされます。キャッシュディレクトリは、ストレージテンプレートから作成された500Giの永続ボリュームでマウントされます。

:::tip Note
- mountPaths配列が空のままの場合、現在のストレージ設定はテンプレートとして扱われます。ユーザーが[起動設定](#custom-startup-configuration)でfile_cache_pathを指定すると、オペレーターは自動的にディレクトリパスを解析してマウントします。

- クラウドディスクのパフォーマンスを最大化するために、4つのディレクトリを設定し、4つの永続ボリュームをマウントすることを推奨します。
:::

### ログ永続化の無効化
ログの永続化が不要で、ログを標準出力にのみ出力する場合は、以下のように設定します：

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      logNotStore: true
```
