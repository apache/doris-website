---
{
  "title": "Dorisをデプロイするための設定",
  "language": "ja",
  "description": "デフォルトのDorisClusterリソースデプロイメントでは、FEおよびBEイメージが最新バージョンでない可能性があります、"
}
---
## クラスター計画
デフォルトのDorisClusterリソースデプロイメントでは、FEおよびBEイメージが最新バージョンではない可能性があり、FEとBEの両方のデフォルトレプリカ数は3に設定されています。さらに、FEのデフォルトリソース設定はCPU 6個とメモリ12Giで、BEはCPU 8個とメモリ16Giです。このセクションでは、要件に応じてこれらのデフォルト設定を変更する方法について説明します。

### イメージ設定
Doris OperatorはDorisバージョンから分離されており、Dorisバージョン2.0以上のデプロイをサポートしています。

**FEイメージ設定**  
FEイメージバージョンを指定するには、以下の設定を使用します：

```yaml
spec:
  feSpec:
    image: ${image}
```
${image}を希望するイメージ名に置き換えてから、対象の[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で設定を更新してください。公式のFEイメージは[FE Image](https://hub.docker.com/r/apache/doris/tags?name=fe)で利用できます。

**BEイメージ設定**  
BEイメージバージョンを指定するには、以下の設定を使用してください：

```yaml
spec:
  beSpec:
    image: ${image}
```
${image}を希望するイメージ名に置き換えてから、ターゲットの[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で設定を更新してください。公式BEイメージは[BE Image](https://hub.docker.com/r/apache/doris/tags?name=be)で入手できます。

### Replicas設定
**FE Replicas設定**  
デフォルトのFEレプリカ数を3から5に変更するには、以下の設定を使用してください：

```yaml
spec:
  feSpec:
    replicas: 5
```
ターゲットの[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で設定を更新します。

**BE replicas設定**  
デフォルトのFEレプリカ数を3から5に変更するには、以下の設定を使用します：

```yaml
spec:
  beSpec:
    replicas: 5
```
デプロイする必要がある[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)の設定を更新してください。

### コンピューティングリソース設定
**FEコンピューティングリソース設定**  
FEのデフォルトコンピュートリソース設定は6 CPUと12Giのメモリです。これを8CPUと16Giに変更するには、以下の設定を使用してください:

```yaml
spec:
  feSpec:
    requests:
      cpu: 8
      memory: 16Gi
    limits:
      cpu: 8
      memory: 16Gi
```
ターゲットの[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で設定を更新します。

**BEコンピューティングリソース設定**
BEのデフォルトのコンピューティングリソース設定は8 CPUと16Giのメモリです。これを16 CPUと32Giのメモリに変更するには、以下の設定を使用します：

```yaml
spec:
  beSpec:
    requests:
      cpu: 16
      memory: 32Gi
    limits:
      cpu: 16
      memory: 32Gi
```
ターゲットの[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で設定を更新してください。

:::tip Tip  
FEとBEの起動に必要な最小リソースは4 CPUと8Giのメモリです。通常のパフォーマンステストでは、8 CPUと8Giのメモリを設定することを推奨します。  
:::

## カスタム起動設定
DorisはKubernetesにおいて、設定ファイルをサービスから分離するためにConfigMapを使用します。デフォルトでは、サービスは起動パラメータ設定としてイメージ内のデフォルト設定を使用します。起動パラメータをカスタマイズするには、[FE Configuration Document](../../admin-manual/config/fe-config)および[BE Configuration Document](../../admin-manual/config/be-config)の手順に従って特定のConfigMapを作成してください。その後、カスタマイズしたConfigMapを[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)をデプロイする予定のnamespaceにデプロイします。

### カスタムFE起動設定
#### ステップ1: FE ConfigMapの作成とデプロイ
以下の例では、Doris FEで使用するためのfe-confという名前のConfigMapを定義しています：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fe-conf
  labels:
    app.kubernetes.io/component: fe
data:
  fe.conf: |
    CUR_DATE=`date +%Y%m%d-%H%M%S`
    # the output dir of stderr and stdout
    LOG_DIR = ${DORIS_HOME}/log
    JAVA_OPTS="-Djavax.security.auth.useSubjectCredsOnly=false -Xss4m -Xmx8192m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$CUR_DATE"
    # For jdk 9+, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_9="-Djavax.security.auth.useSubjectCredsOnly=false -Xss4m -Xmx8192m -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xlog:gc*:$DORIS_HOME/log/fe.gc.log.$CUR_DATE:time"
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
    enable_fqdn_mode = true
```
ConfigMapを使用してFEスタートアップ設定をマウントする場合、設定に対応するキーは`fe.conf`である必要があります。ConfigMapをファイルに書き込み、以下のコマンドを使用してDorisClusterリソースがデプロイされている名前空間にデプロイします：

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```
ここで、${namespace} は DorisCluster をデプロイする名前空間を指し、${feConfigMapFile} は FE の ConfigMap ファイルの名前です。

#### ステップ 2: DorisCluster リソースを更新する
`fe-conf` という名前の ConfigMap を起動設定のマウントに使用するには、[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster) の FE spec に以下の設定を追加してください：

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```
:::tip ヒント
起動設定に `enable_fqdn_mode=true` が含まれていることを確認してください。IPモードを使用し、K8sでpod IPが再起動後も同じままになる機能を使いたい場合は、設定についてissue [#138](https://github.com/apache/doris-operator/issues/138) を参照してください。
:::

### カスタムBE起動設定
#### ステップ1: BE ConfigMapの作成とデプロイ  
次の例では、Doris BEで使用するための `be-conf` という名前のConfigMapを定義しています：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-conf
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    CUR_DATE=`date +%Y%m%d-%H%M%S`

    PPROF_TMPDIR="$DORIS_HOME/log/"

    JAVA_OPTS="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xloggc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

    # For jdk 9+, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_9="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xlog:gc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

    # since 1.2, the JAVA_HOME need to be set to run BE process.
    # JAVA_HOME=/path/to/jdk/

    # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
    # https://jemalloc.net/jemalloc.3.html
    JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:15000,dirty_decay_ms:15000,oversize_threshold:0,lg_tcache_max:20,prof:false,lg_prof_interval:32,lg_prof_sample:19,prof_gdump:false,prof_accum:false,prof_leak:false,prof_final:false"
    JEMALLOC_PROF_PRFIX=""

    # INFO, WARNING, ERROR, FATAL
    sys_log_level = INFO

    # ports for admin, web, heartbeat service
    be_port = 9060
    webserver_port = 8040
    heartbeat_service_port = 9050
    brpc_port = 8060
```
ConfigMapを使用してBEスタートアップ設定をマウントする場合、設定に対応するキーは`be.conf`である必要があります。ConfigMapをファイルに書き込み、以下のコマンドを使用して[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)がデプロイされているnamespaceにデプロイします：

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```
ここで、${namespace}はDorisClusterリソースをデプロイする必要があるnamespaceを指し、${beConfigMapFile}はBE用のConfigMapファイルの名前です。

#### step 2: DorisClusterリソースの更新
起動設定をマウントするために`be-conf`という名前のConfigMapを使用するには、[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)のBE specに以下の設定を追加します：

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```
:::tip Tip  
コンテナ内のconfig ディレクトリにファイルをマウントする場合は、startup configMapを使用してファイルをマウントしてください。config ディレクトリは ${DORIS_HOME}/conf です。  
:::

### 複数のConfigMapのマウント
Doris Operatorは、複数のConfigMapをコンテナ内の異なるディレクトリにマウントすることをサポートしており、柔軟な設定管理を可能にします。

**FE用の複数のConfigMapのマウント**  
以下の例は、2つのConfigMap `test-fe1` と `test-fe2` を、FEコンテナ内のディレクトリ "/etc/fe/config1/" と "/etc/fe/config2" にそれぞれマウントする方法を示しています：

```yaml
spec:
  feSpec:
    configMaps:
    - configMapName: test-fe1
      mountPath: /etc/fe/config1
    - configMapName: test-fe2
      mountPath: /etc/fe/config2
```
**BE用の複数のConfigMapのマウント**  
同様に、以下の例では2つのConfigMap `test-be1` と `test-be2` をBEコンテナ内のディレクトリ "/etc/be/config1" と "/etc/be/config2" にそれぞれマウントする方法を示します：

```yaml
  spec:
    beSpec:
      configMaps:
      - configMapName: test-be1
        mountPath: /etc/be/config1
      - configMapName: test-be2
        mountPath: /etc/be/config2
```
## 永続ストレージ
Kubernetesは物理ストレージにデータを永続化するために[Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)を提供します。KubernetesにおいてDoris Operatorは、デプロイが必要な[DorisCluster Resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で定義されたテンプレートに基づいて、適切なPersistentVolumesに関連付けられたPersistentVolumeClaimsを自動的に作成します。

### FEの永続ストレージ
KubernetesベースのDorisデプロイメントでは、FEの以下のパスを永続化することが推奨されます：
1. メタデータ：/opt/apache-doris/fe/doris-meta（FEメタデータのデフォルトストレージ設定）
2. ログ：/opt/apache-doris/fe/log（ログの永続化が必要な場合）

#### FEメタデータの永続化
デフォルトストレージ設定を使用してFEメタデータを永続化するには、[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)に以下の設定を追加します：

```yaml
spec:
  feSpec:
    persistentVolumes:
    - mountPath: /opt/apache-doris/fe/doris-meta
      name: meta
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        storageClassName: ${your_storageclass}
        accessModes:
        - ReadWriteOnce
        resources:
          # notice: if the storage size less 5G, fe will not start normal.
          requests:
            storage: ${storageSize}
```
上記の設定では、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は割り当てたいストレージサイズを表します。形式は[quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)で、例えば100Giです。

#### 永続的なFEログ
クラスタに集中ログ収集システムがない場合は、[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)に以下の設定を追加してFEログディレクトリを永続化します：

```yaml
spec:
  feSpec:
    persistentVolumes:
    - mountPath: /opt/apache-doris/fe/log
      name: log
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        storageClassName: ${your_storageclass}
        accessModes:
        - ReadWriteOnce
        resources:
          # notice: if the storage size less 5G, fe will not start normal.
          requests:
            storage: ${storageSize}
```
上記の設定において、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は割り当てたいストレージサイズを表します。${storageSize}の形式は、K8sの[quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)メソッドに従います。例：100Gi。使用時には必要に応じて置き換えてください。

:::tip Tip  
[カスタマイズされた設定ファイル](#custom-fe-startup-configuration)でmeta_dirまたは`LOG_DIR`を再設定した場合は、mountPathを再設定してください。
:::

### BEの永続化ストレージ
Dorisデプロイメントのbeノードについては、以下のパスを永続化することを推奨します：
1. データストレージ：/opt/apache-doris/be/storage（BEデータのデフォルトストレージ）。
2. ログ：/opt/apache-doris/be/log（ログの永続化が必要な場合）。

#### 永続化データ
- **デフォルトストレージ設定の使用**  
  デフォルトストレージ設定を使用してデータを永続化するには、[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)を以下の設定で更新してください：

  ```yaml
  beSpec:
    persistentVolumes:
    - mountPath: /opt/apache-doris/be/storage
      name: be-storage
      persistentVolumeClaimSpec:
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
  ```
上記の設定では、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は使用したいストレージサイズを表します。${storageSize}のフォーマットは、100GiのようなK8sの[quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います。使用時に必要に応じて置き換えてください。

- **BEストレージパスのカスタマイズ**  
  複数のディスクを活用するために、storage_root_pathを使用して複数のストレージディレクトリを設定できます。例えば、storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSDの場合、設定には以下を含める必要があります：

  ```yaml
  beSpec:
    persistentVolumes:
    - mountPath: /home/disk1/doris
      name: be-storage1
      persistentVolumeClaimSpec:
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
    - mountPath: /home/disk2/doris
      name: be-storage2
      persistentVolumeClaimSpec:
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
  ```
上記の設定において、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は使用したいストレージサイズを表します。${storageSize}の形式はK8sの[quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います。例：100Gi。使用する際は必要に応じて置き換えてください。

#### Persistent BE log
デフォルト設定を使用してBEログを永続化するには、DorisClusterリソース[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)を以下のように更新してください：

```yaml
beSpec:
  persistentVolumes:
  - mountPath: /opt/apache-doris/be/log
    name: belog
    persistentVolumeClaimSpec:
      storageClassName: ${your_storageclass}
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: ${storageSize}
```
上記の設定において、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は使用したいストレージサイズを表します。${storageSize}の形式は、K8sの[quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。使用時に必要に応じて置き換えてください。

## アクセス設定
KubernetesはVIP（Virtual IP）およびロードバランサーとしてServiceの使用を提供します。ServiceにはClusterIP、NodePort、LoadBalancerの3つの外部公開モードがあります。

### ClusterIP
DorisはKubernetes上でデフォルトでClusterIPアクセスモードを提供します。ClusterIPアクセスモードは、この内部IPを通してサービスを公開するために、Kubernetesクラスタ内の内部IPアドレスを提供します。ClusterIPモードでは、サービスはクラスタ内からのみアクセスできます。

#### ステップ1：ClusterIPの設定
DorisはKubernetes上でデフォルトでClusterIPアクセスモードを提供します。変更なしでClusterIPアクセスモードを使用できます。

#### ステップ2：Serviceの取得
クラスタをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されているサービスを確認できます：

```shell
kubectl -n doris get svc
```
返される結果は以下の通りです：

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```
上記の結果では、FEとBEに対して2種類のサービスがあり、それぞれ「internal」と「service」のサフィックスが付いています：
- 「internal」サフィックスが付いたサービスは、ハートビート、データ交換、その他の操作などのDoris内部での内部通信にのみ使用でき、外部使用は想定されていません。
- 「service」サフィックスが付いたサービスは、ユーザーが使用できます。

#### Step 3: コンテナ内からdorisにアクセスする

以下のコマンドを使用して、現在のKubernetesクラスター内にmysqlクライアントを含むpodを作成できます：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
クラスター内のコンテナから、外部に公開されている「service」サフィックスが付いたサービス名を使用してDorisクラスターにアクセスできます：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```
### NodePort
KubernetesクラスターからDorisに外部アクセスするには、NodePortサービスタイプを使用できます。NodePortにポートを割り当てる方法は、動的割り当てと静的割り当ての2つがあります。
- 動的割り当て: ポートが明示的に設定されていない場合、Kubernetesはpodが作成される際に、デフォルト範囲（30000-32767）から未使用のポートを自動的に割り当てます。
- 静的割り当て: ポートが明示的に指定されている場合、Kubernetesはそのポートが利用可能であれば割り当て、固定されたポートを確保します。

Dorisは外部アクセス用に以下のポートを公開しています：

| Port Name | default value | Port Description                     |
|------| ---- |--------------------------|
| Query Port | 9030 | MySQLプロトコル経由でDorisクラスターにアクセスするために使用 |
| HTTP Port | 8030 | FE上のhttpサーバーポート、FE情報を表示するために使用 |
| Web Server Port | 8040 | BE上のhttpサーバーポート、BE情報を表示するために使用 |

#### ステップ1: NodePortを設定する
**FE NodePort**  
- 動的割り当て:

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```
- 静的割り当て:

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
        servicePorts:
        - nodePort: 31001
          targetPort: 8030
        - nodePort: 31002
          targetPort: 9030
  ```
**BE NodePort**
- 動的割り当て:

  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```
- 静的割り当て：

  ```yaml
    beSpec:
      service:
        type: NodePort
        servicePorts:
        - nodePort: 31006
          targetPort: 8040
  ```
#### ステップ 2: サービスの取得
クラスターをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されているサービスを確認できます：

```shell
kubectl get service
```
返された結果は以下の通りです：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
#### Step 3: NodePortを使用してサービスにアクセスする
NodePort経由でDorisにアクセスするには、NodeのIPとマッピングされたポートを知る必要があります。以下を使用してnode IPを取得できます：

```shell
  kubectl get nodes -owide
```
出力例::

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
任意のノード（例：192.168.88.61、192.168.88.62、または192.168.88.63）のIPアドレスとマップされたポートを使用してDorisにアクセスできます。例えば、ノード192.168.88.62とポート31545を使用する場合：

```shell
  mysql -h 192.168.88.62 -P 31545 -uroot
```
### LoadBalancer
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) serviceタイプは、通常クラウドサービスプロバイダーによって提供される追加のロードバランサーを提供します。このモードは、クラウドプラットフォームによって管理されるKubernetesクラスター上でDorisクラスターをデプロイする場合にのみ利用可能です。
#### ステップ1: LoadBalancerモードの設定  
**FE LoadBalancer**

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
```
**BE LoadBalancer**

```yaml
spec:
  beSpec:
    service:
      type: LoadBalancer
```
#### ステップ2: サービスの取得  
クラスターをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されているサービスを表示できます：

```shell
kubectl get service
```
返された結果は以下の通りです：

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
#### Step 3: LoadBalancer を使用してサービスにアクセスする
LoadBalancer を通じて Doris にアクセスするには、外部 IP（EXTERNAL-IP フィールドで提供される）と対応するポートを使用します。例えば、`mysql` コマンドを使用する場合：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```
## 管理クラスタのユーザー名とパスワードの設定
Dorisノードを管理するには、管理操作のためにユーザー名とパスワードを使用してMySQLプロトコル経由でライブFEノードに接続する必要があります。Dorisは[RBACと類似した権限管理メカニズム](../../admin-manual/auth/authentication-and-authorization)を実装しており、ユーザーはノード管理を実行するために[Node_priv](../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions)権限を持つ必要があります。デフォルトでは、Doris Operatorはrootユーザーをパスワードなしモードでクラスタをデプロイします。

ユーザー名とパスワードの設定プロセスは3つのシナリオに分けることができます：
- クラスタデプロイ中のrootユーザーパスワードの初期化
- rootパスワードなしデプロイでの管理権限を持つ非rootユーザーの自動設定
- rootパスワードなしモードでクラスタをデプロイした後のrootユーザーパスワードの設定

アクセスを保護するために、rootユーザーにパスワードを追加した後、DorisClusterリソースでNode_Priv権限を持つユーザー名とパスワードを設定する必要があります。クラスタノードを管理するためのユーザー名とパスワードを設定する方法は2つあります：
- 環境変数を使用する
- Kubernetes Secretを使用する

### クラスタデプロイ中のrootユーザーパスワード設定
rootユーザーのパスワードを安全に設定するために、Dorisは2段階SHA-1暗号化プロセスを使用して[`fe.conf`](../../admin-manual/config/fe-config#initial_root_password)でパスワードを暗号化することをサポートしています。以下はパスワードの設定方法です。

#### ステップ1: root暗号化パスワードの生成

2段階SHA-1暗号化を使用してrootパスワードを暗号化するには、以下の方法を使用します：

- Java Code:

  ```java
  import org.apache.commons.codec.digest.DigestUtils;
  
  public static void main( String[] args ) {
        //the original password
        String a = "123456";
        String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
        //output the 2 stage encrypted password.
        System.out.println("*"+b);
    }
  ```
- Golangコード:

  ```go
  import (
  "crypto/sha1"
  "encoding/hex"
  "fmt"
  "strings"
  )
  
  func main() {
      //original password
      plan := "123456"
      //the first stage encryption.
      h := sha1.New()
      h.Write([]byte(plan))
      eb := h.Sum(nil)
      
      //the two stage encryption.
      h.Reset()
      h.Write(eb)
      teb := h.Sum(nil)
      dst := hex.EncodeToString(teb)
      tes := strings.ToUpper(fmt.Sprintf("%s", dst))
      //output the 2 stage encrypted password. 
      fmt.Println("*"+tes)
  }
  ```
設定ファイル形式の要件に従って、暗号化されたパスワードを `fe.conf` に設定します。次に、ConfigMapを使用してKubernetesクラスターに設定を配布します。これについては[クラスターパラメータ設定セクション](#custom-fe-startup-configuration)で説明されています。

#### ステップ2: DorisClusterリソースの設定
fe.confでrootパスワードを設定した後、Dorisは起動時に最初のFEノードにパスワードを自動的に適用します。他のノードがクラスターに参加するには、DorisClusterリソースでユーザー名とパスワードを指定して、Doris Operatorが自動ノード管理を実行できるようにします。
- 環境変数の使用

  DorisClusterリソースの".spec.adminUser.name"および".spec.adminUser.password"フィールドに、ユーザー名rootとパスワードを設定します。Doris Operatorは、以下の設定をコンテナが使用する環境変数に自動的に変換します。コンテナ内の補助サービスは、環境変数によって設定されたユーザー名とパスワードを使用して、指定されたクラスターに自身を追加します。設定形式は以下の通りです:

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```
ここで、${password}はrootの暗号化されていないパスワードです。

- secretの使用

  ユーザー名とパスワードを安全に管理するために、Kubernetes [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret)を使用できます。rootのユーザー名とパスワードを格納するようにSecretを設定し、DorisClusterリソースでそれを参照します。  
  a. 必要なSecretの設定

  以下の形式に従って、必要なBasic認証Secretを設定します：

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```
ここで、${password} は root に設定された暗号化されていないパスワードです。

  b. デプロイするDorisClusterリソースを設定する

  以下の形式で必要なSecretを指定するようにDorisClusterを設定します：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
ここで、${secretName}はrootユーザー名とパスワードを含むSecretの名前です。

### デプロイ時の非root管理ユーザーとパスワードの自動作成（推奨）
セキュリティ強化のため、rootユーザーを使用するよりも、初回デプロイ時に管理用の非rootユーザーを作成することが推奨されます。この方法では、非rootユーザーのユーザー名とパスワードは環境変数またはSecretsを通じて設定されます。Dorisコンテナの補助サービスが自動的にデータベース内にユーザーを作成し、パスワードを設定し、必要なNode_priv権限を付与します。デプロイ後、Doris Operatorは新しく作成された非rootユーザー名とパスワードを使用してクラスターノードを管理します。

- 環境変数の使用：

  非rootユーザーを設定するには、DorisClusterリソース内で環境変数を使用してユーザー名とパスワードを設定できます：

    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名で、${DB_ADMIN_PASSWD}は新しく作成されたユーザー名に設定されたパスワードです。

- Secretの使用:
  ユーザー名とパスワードを安全に管理するために、基本認証にKubernetes Secretを使用できます。
  a. 必要なsecretを設定する

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名、${DB_ADMIN_PASSWD}は新しく作成されたユーザー名に設定されたパスワードです。
以下を実行してSecretをKubernetesクラスターにデプロイします：

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
ここで、${namespace} は DorisCluster リソースをデプロイする必要がある namespace であり、${secretFileName} はデプロイする Secret のファイル名です。

  b. DorisCluster リソースを設定する

  以下の形式に従って DorisCluster リソースを更新してください：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
ここで、${secretName} は配置された Basic authentication Secret の名前です。

:::tip Tip  
デプロイ後、root パスワードを設定してください。Doris Operator は、自動的に新しく作成されたユーザー名とパスワードを使用してノードを管理するように切り替わります。自動作成されたユーザーを削除しないようにしてください。  
:::

### クラスタデプロイ後の root ユーザーパスワード設定
Doris クラスタをデプロイし、root ユーザーのパスワードを設定した後、Doris Operator がクラスタノードを自動管理できるように、必要な [Node_priv](../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions) 権限を持つ管理ユーザーを作成することが重要です。この目的で root ユーザーを使用することは推奨されません。代わりに、[ユーザー作成と権限割り当てセクション](../../sql-manual/sql-statements/account-management/CREATE-USER) を参照して新しいユーザーを作成し、Node_priv 権限を付与してください。

#### ステップ 1: Node_priv 権限を持つユーザーの作成
まず、MySQL プロトコルを使用して Doris データベースに接続し、必要な権限を持つ新しいユーザーを作成します:

  ```shell
  CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
  ```
- ${DB_ADMIN_USER}: 作成したいユーザーの名前。
- ${DB_ADMIN_PASSWD}: 新しく作成されたユーザーのパスワード。

#### step 2: 新しいユーザーにNode_priv権限を付与する
新しく作成されたユーザーにNode_priv権限を付与します：

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```
${DB_ADMIN_USER}: 前のステップで作成したユーザー名。

ユーザーの作成、パスワードの設定、権限の付与の詳細については、[CREATE-USER](../../sql-manual/sql-statements/account-management/CREATE-USER)セクションを参照してください。

#### ステップ3: DorisClusterを設定する
- 環境変数を使用する場合

  DorisClusterリソースで新しいユーザーの名前とパスワードを直接設定します：

  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名で、${DB_ADIC_PASSWD}は新しく作成されたユーザーに設定されたパスワードです。

- Secretの使用
  ユーザー名とパスワードを安全に管理するために、Kubernetes Secretsを使用できます。
  a. 必要なsecretを作成する
  新しいユーザーのためのBasic Authentication Secretを作成します：

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名であり、${DB_ADMIN_PASSWD}は新しく作成されたユーザー名に設定されたパスワードです。
次のコマンドでSecretをKubernetesクラスターにデプロイします：

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
ここで、${namespace}はDorisClusterリソースをデプロイする必要があるnamespaceであり、${secretFileName}はデプロイするSecretのファイル名です。

  b. DorisClusterリソースの更新  
  Secretがデプロイされたら、DorisClusterリソースを更新してSecretを指定します：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
ここで、${secretName}は、デプロイされたBasic認証Secretの名前です。

:::tip Tip  
rootパスワードの設定とデプロイ後のノード管理用の新しいユーザー名とパスワードの設定後、既存のサービスはローリング方式で一度再起動されます。  
:::  

## 設定変更時の自動サービス再起動
Dorisは設定ファイルを通じて起動パラメータを指定します。ほとんどのパラメータはWebインターフェース経由で変更でき、即座に有効になりますが、サービス再起動が必要な特定のパラメータは、バージョン25.1.0で導入されたDoris Operatorの再起動機能を通じて自動的に処理できるようになりました。    
`DorisCluster`リソースでこの機能を有効にするには、以下のように設定します：

```yaml
spec:
  enableRestartWhenConfigChange: true
```
この設定が存在する場合、Doris Operatorは以下を実行します：
1. クラスター起動設定の変更を監視します（ConfigMapを介してマウント、[起動設定のカスタマイズ](#custom-startup-configuration)を参照）。
2. 設定が変更された際に、影響を受けるサービスを自動的に再起動します。

### 使用例
FEとBEでconfigmap監視と再起動をサポートします。FEの使用例を例として示します。
1. DorisClusterデプロイメント仕様のサンプル：

    ```yaml
    spec:
      enableRestartWhenConfigChange: true
      feSpec:
        image: apache/doris:fe-2.1.8
        replicas: 1
        configMapInfo:
        configMapName: fe-configmap
    ```
2. FEサービス設定の更新  
   fe-configmap ConfigMap内の`fe.conf`キー配下の値を変更する場合（FEサービス設定を含む）、Doris Operatorは変更を適用するためにFEサービスのローリング再起動を自動的に実行します。

## Kerberos認証の使用
Doris Operatorは、バージョン25.2.0以降、Kubernetes上のDoris（バージョン2.1.9、3.0.4以降）に対するKerberos認証をサポートしています。DorisでKerberos認証を有効にするには、[krb5.confファイル](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html)と[keytabファイル](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html)の両方が必要です。
Doris Operatorは、ConfigMapリソースを使用してkrb5.confファイルをマウントし、Secretリソースを使用してkeytabファイルをマウントします。Kerberos認証を有効にするワークフローは以下の通りです：

1. krb5.confファイルを含むConfigMapを作成する：

    ```shell
    kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
    ```
${namespace} を DorisCluster がデプロイされている namespace に、${name} を ConfigMap の希望する名前に置き換えてください。
2. keytab ファイルを含む Secret を作成します：

    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
    ```
${namespace}をDorisClusterがデプロイされているnamespaceに、${name}をSecretの希望する名前に置き換えてください。複数のkeytabファイルをマウントする必要がある場合は、[kubectl create Secret documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)を参照して、それらを単一のSecretに含めてください。
3. krb5.confを含むConfigMapとkeytabファイルを含むSecretを指定するようにDorisClusterリソースを設定します：

    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
${krb5ConfigMapName}: krb5.confファイルを含むConfigMapの名前。${keytabSecretName}: keytabファイルを含むSecretの名前。${keytabPath}: Secretがkeytabファイルをマウントするコンテナ内のディレクトリパス。このパスは、カタログ作成時にhadoop.kerberos.keytabで指定されるディレクトリと一致する必要があります。カタログ設定の詳細については、[Hive Catalog configuration](../../lakehouse/catalogs/hive-catalog.mdx#configuring-catalog)のドキュメントを参照してください。

## 共有ストレージの設定
バージョン25.4.0以降、Doris OperatorはReadWriteManyアクセスモードでの共有ストレージを複数コンポーネント間のすべてのポッドにマウントすることをサポートしています。この機能を使用する前に、共有ストレージのPersistentVolumeとPersistentVolumeClaimリソースが作成されていることを確認してください。Dorisクラスターをデプロイする前に、以下に示すようにDorisClusterリソースを設定します：

```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- `${mountPath}` は、ストレージがマウントされるコンテナ内の絶対パスを指定します。
- `${sharedPVCName}` は、マウントする `PersistentVolumeClaim` の名前を参照します。
- `supportComponents` は、共有ストレージが必要なコンポーネントの名前をリストします。上記の例では、FEとBEの両方のコンポーネントが共有ストレージをマウントします。supportComponents配列が空のままの場合、デプロイされたすべてのコンポーネントがデフォルトで共有ストレージをマウントします。

:::tip Tip
`mountPath` パラメータは `${DORIS_HOME}` をプレフィックスとして使用できます。`${DORIS_HOME}` が使用された場合、FEコンテナ内では `/opt/apache-doris/fe` に、BEコンテナ内では `/opt/apache-doris/be` に解決されます。
:::

## Probe Timeoutの設定
DorisClusterは各サービスに対して2つのタイプのprobe timeout設定を提供します：`startup probe timeout` と `liveness probe timeout`。サービスが指定されたstartup timeoutの期間内に開始に失敗した場合、失敗したとみなされて再起動されます。
サービスが指定されたliveness timeoutよりも長い間応答しなくなった場合、対応するPodが自動的に再起動されます。

### Startup Probe Timeout
- FE Service Startup Timeout設定

    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
上記の設定により、FEサービスの起動タイムアウトが3600秒に設定されます。
- BEサービス起動タイムアウト設定

    ```
    spec:
      beSpec:
        startTimeout: 3600
    ```
### Liveness Probe Timeout
- FE Service Liveness Timeout設定

    ```
    spec:
      feSpec:
        liveTimeout: 60
    ```
上記の設定では、FE サービスの liveness タイムアウトを 60 秒に設定します。
- BE Service Liveness Timeout Configuration

    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
上記の設定では、BEサービスのliveness timeoutを60秒に設定しています。
