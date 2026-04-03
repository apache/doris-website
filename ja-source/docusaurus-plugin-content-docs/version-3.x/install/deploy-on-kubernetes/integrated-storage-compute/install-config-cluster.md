---
{
  "title": "Dorisをデプロイするための設定",
  "language": "ja",
  "description": "デフォルトのDorisClusterリソースデプロイメントでは、FEおよびBEイメージが最新バージョンでない可能性があります、"
}
---
## クラスター計画
デフォルトのDorisClusterリソースデプロイメントでは、FEとBEのイメージが最新バージョンではない可能性があり、FEとBEの両方でデフォルトのレプリカ数が3に設定されています。さらに、FEのデフォルトリソース設定は6 CPUと12Giのメモリであり、BEでは8 CPUと16Giのメモリです。このセクションでは、要件に応じてこれらのデフォルト設定を変更する方法について説明します。

### イメージ設定
Doris OperatorはDorisバージョンから分離されており、Dorisバージョン2.0以上のデプロイメントをサポートしています。

**FEイメージ設定**  
FEイメージのバージョンを指定するには、以下の設定を使用してください：

```yaml
spec:
  feSpec:
    image: ${image}
```
${image}を希望するイメージ名に置き換えてから、対象の[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)で設定を更新してください。公式のFEイメージは[FE Image](https://hub.docker.com/r/apache/doris/tags?name=fe)で入手できます。

**BEイメージ設定**  
BEイメージのバージョンを指定するには、以下の設定を使用してください：

```yaml
spec:
  beSpec:
    image: ${image}
```
${image}を希望するイメージ名に置き換えて、対象の[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)の設定を更新してください。公式BEイメージは[BE Image](https://hub.docker.com/r/apache/doris/tags?name=be)で利用可能です。

### Replicas設定
**FE replicas設定**  
デフォルトのFEレプリカ数を3から5に変更するには、以下の設定を使用してください：

```yaml
spec:
  feSpec:
    replicas: 5
```
ターゲットの[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)の設定を更新してください。

**BEレプリカ設定**  
デフォルトのFEレプリカ数を3から5に変更するには、以下の設定を使用してください：

```yaml
spec:
  beSpec:
    replicas: 5
```
デプロイする必要がある[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)に設定を更新します。

### コンピューティングリソース設定
**FEコンピューティングリソース設定**  
FEのデフォルトコンピューティングリソース設定は6 CPUと12Giのメモリです。これを8CPUと16Giに変更するには、以下の設定を使用します：

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
ターゲットの [DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster) で設定を更新します。

**BE計算リソース設定**    
BEのデフォルトの計算リソース設定は8 CPUと16Giのメモリです。これを16 CPUと32Giのメモリに変更するには、以下の設定を使用します：

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
対象の [DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster) の設定を更新します。

:::tip Tip  
FE と BE の起動に必要な最小リソースは 4 CPU と 8Gi のメモリです。通常のパフォーマンステストでは、8 CPU と 8Gi のメモリを設定することを推奨します。  
:::

## カスタム起動設定

Doris は Kubernetes において、設定ファイルをサービスから分離するために ConfigMap を使用します。デフォルトでは、サービスは起動パラメータ設定として、イメージ内のデフォルト設定を使用します。起動パラメータをカスタマイズするには、[FE Configuration Document](../../../admin-manual/config/fe-config) および [BE Configuration Document](../../../admin-manual/config/be-config.md) の手順に従って特定の ConfigMap を作成します。そして、[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster) がデプロイされる namespace にカスタマイズされた ConfigMap をデプロイします。

### FE のカスタム起動設定
#### Step 1: FE ConfigMap の作成とデプロイ
以下の例では、Doris FE で使用するために fe-conf という名前の ConfigMap を定義します：

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
    # Log dir
    LOG_DIR = ${DORIS_HOME}/log
    # For jdk 8
    JAVA_OPTS="-Dfile.encoding=UTF-8 -Djavax.security.auth.useSubjectCredsOnly=false -Xss4m -Xmx8192m -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+PrintClassHistogramAfterFullGC -Xloggc:$LOG_DIR/log/fe.gc.log.$CUR_DATE -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=50M -Dlog4j2.formatMsgNoLookups=true"

    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Dfile.encoding=UTF-8 -Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*,classhisto*=trace:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED --add-opens java.base/sun.nio.ch=ALL-UNNAMED"
    # Set your own JAVA_HOME
    # JAVA_HOME=/path/to/jdk/
    ##
    ## the lowercase properties are read by main program.
    ##
    # store metadata, must be created before start FE.
    # Default value is ${DORIS_HOME}/doris-meta
    # meta_dir = ${DORIS_HOME}/doris-meta
    # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
    # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers

    http_port = 8030
    rpc_port = 9020
    query_port = 9030
    edit_log_port = 9010
    arrow_flight_sql_port = -1

    # Choose one if there are more than one ip except loopback address.
    # Note that there should at most one ip match this list.
    # If no ip match this rule, will choose one randomly.
    # use CIDR format, e.g. 10.10.10.0/24 or IP format, e.g. 10.10.10.1
    # Default value is empty.
    # priority_networks = 10.10.10.0/24;192.168.0.0/16

    # Advanced configurations
    # log_roll_size_mb = 1024
    # INFO, WARN, ERROR, FATAL
    syg_level = INFO
    # NORMAL, BRIEF, ASYNC
    syg_mode = ASYNC
    # audit_log_dir = $LOG_DIR
    # audit_log_modules = slow_query, query
    # audit_log_roll_num = 10
    # meta_delay_toleration_second = 10
    # qe_max_connection = 1024
    # qe_query_timeout_second = 300
    # qe_slow_log_ms = 5000
    enable_fqdn_mode = true
```
ConfigMapを使用してFEスタートアップ設定をマウントする場合、設定に対応するキーは`fe.conf`である必要があります。ConfigMapをファイルに書き込み、以下のコマンドを使用してDorisClusterリソースがデプロイされているnamespaceにデプロイします：

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```
ここで、${namespace}はDorisClusterがデプロイされるnamespaceを指し、${feConfigMapFile}はFE用のConfigMapファイルの名前です。

#### ステップ2: DorisClusterリソースの更新
起動設定をマウントするために`fe-conf`という名前のConfigMapを使用するには、[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)のFE specに以下の設定を追加します：

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```
デプロイする必要がある[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)に設定を更新してください。

:::tip Tip
起動設定に`enable_fqdn_mode=true`が含まれていることを確認してください。IPモードを使用したく、K8sがpod IPを再起動後も同じに保つ機能を持つ場合は、設定についてissue [#138](https://github.com/apache/doris-operator/issues/138)を参照してください。
:::

### カスタムBE起動設定
#### ステップ1: BE ConfigMapの作成とデプロイ  
以下の例では、Doris BEで使用するための`be-conf`という名前のConfigMapを定義します:

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
    # Log dir
    LOG_DIR="${DORIS_HOME}/log/"
    # For jdk 8
    JAVA_OPTS="-Dfile.encoding=UTF-8 -Xmx2048m -DlogPath=$LOG_DIR/jni.log -Xloggc:$LOG_DIR/be.gc.log.$CUR_DATE -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives"
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Dfile.encoding=UTF-8 -Djol.skipHotspotSAAttach=true -Xmx2048m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED -Darrow.enable_null_check_for_get=false"
    # Set your own JAVA_HOME
    # JAVA_HOME=/path/to/jdk/
    # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
    # https://jemalloc.net/jemalloc.3.html
    JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:5000,dirty_decay_ms:5000,oversize_threshold:0,prof:true,prof_active:false,lg_prof_interval:-1"
    JEMALLOC_PROF_PRFIX="jemalloc_heap_profile_"
    # ports for admin, web, heartbeat service
    be_port = 9060
    webserver_port = 8040
    heartbeat_service_port = 9050
    brpc_port = 8060
    arrow_flight_sql_port = -1
    # HTTPS configures
    enable_https = false
    # path of certificate in PEM format.
    ssl_certificate_path = "$DORIS_HOME/conf/cert.pem"
    # path of private key in PEM format.
    ssl_private_key_path = "$DORIS_HOME/conf/key.pem"

    # Choose one if there are more than one ip except loopback address.
    # Note that there should at most one ip match this list.
    # If no ip match this rule, will choose one randomly.
    # use CIDR format, e.g. 10.10.10.0/24 or IP format, e.g. 10.10.10.1
    # Default value is empty.
    # priority_networks = 10.10.10.0/24;192.168.0.0/16

    # data root path, separate by ';'
    # You can specify the storage type for each root path, HDD (cold data) or SSD (hot data)
    # eg:
    # storage_root_path = /home/disk1/doris;/home/disk2/doris;/home/disk2/doris
    # storage_root_path = /home/disk1/doris,medium:SSD;/home/disk2/doris,medium:SSD;/home/disk2/doris,medium:HDD
    # /home/disk2/doris,medium:HDD(default)
    #
    # you also can specify the properties by setting '<property>:<value>', separate by ','
    # property 'medium' has a higher priority than the extension of path
    #
    # Default value is ${DORIS_HOME}/storage, you should create it by hand.
    # storage_root_path = ${DORIS_HOME}/storage

    # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
    # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers

    # Advanced configurations
    # INFO, WARNING, ERROR, FATAL
    sys_log_level = INFO
    # sys_log_roll_mode = SIZE-MB-1024
    # sys_log_roll_num = 10
    # sys_log_verbose_modules = *
    # log_buffer_level = -1

    # aws sdk log level
    #    Off = 0,
    #    Fatal = 1,
    #    Error = 2,
    #    Warn = 3,
    #    Info = 4,
    #    Debug = 5,
    #    Trace = 6
    # Default to turn off aws sdk log, because aws sdk errors that need to be cared will be output through Doris logs
    aws_log_level=0
    ## If you are not running in aws cloud, you can disable EC2 metadata
    AWS_EC2_METADATA_DISABLED=true
```
ConfigMapを使用してBEスタートアップ設定をマウントする場合、設定に対応するキーは`be.conf`である必要があります。ConfigMapをファイルに書き込み、以下のコマンドを使用して[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)がデプロイされているnamespaceにデプロイします：

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```
ここで、${namespace}はDorisClusterリソースをデプロイする必要があるnamespaceを指し、${beConfigMapFile}はBE用のConfigMapファイル名を指します。

#### ステップ 2: DorisClusterリソースの更新
起動設定をマウントするために`be-conf`という名前のConfigMapを使用するには、[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)のBE specに以下の設定を追加します：

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```
:::tip Tip  
コンテナ内のconfigディレクトリにファイルをマウントしたい場合は、startup configMapを使用してファイルをマウントしてください。configディレクトリは${DORIS_HOME}/confです。
:::

### 複数のConfigMapのマウント
Doris Operatorは、コンテナ内の異なるディレクトリに複数のConfigMapをマウントすることをサポートし、柔軟な設定管理を可能にします。

**FEに複数のConfigMapをマウントする**  
以下の例では、2つのConfigMap `test-fe1`と`test-fe2`をFEコンテナ内のディレクトリ"/etc/fe/config1/"と"/etc/fe/config2"にそれぞれマウントする方法を示しています：

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
同様に、以下の例では、2つのConfigMap `test-be1`と`test-be2`を、BEコンテナ内のディレクトリ"/etc/be/config1"と"/etc/be/config2"にそれぞれマウントする方法を示しています：

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
KubernetesベースのDorisデプロイメントでは、FEに対して以下のパスを永続化することを推奨します：
1. メタデータ：/opt/apache-doris/fe/doris-meta（FEメタデータのデフォルトストレージ設定）
2. ログ：/opt/apache-doris/fe/log（ログの永続化が必要な場合）

#### FEのメタデータ永続化
デフォルトストレージ設定を使用してFEメタデータを永続化するには、[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)に以下の設定を追加してください：

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
上記の設定において、${your_storageclass} は使用したい StorageClass の名前を表し、${storageSize} は割り当てたいストレージサイズを表します。形式は [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) です。例: 100Gi。

#### FE ログの永続化
クラスターに一元化されたログ収集システムがない場合は、[DorisCluster resource](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster) に以下の設定を追加して FE ログディレクトリを永続化してください:

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
上記の設定において、`${your_storageclass}`は使用したいStorageClassの名前を表し、`${storageSize}`は割り当てたいストレージサイズを表します。`${storageSize}`の形式は、K8sの[quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)メソッドに従います（例：100Gi）。使用時に必要に応じて置き換えてください。

:::tip Tip  
[カスタマイズされた設定ファイル](#custom-fe-startup-configuration)でmeta_dirや`LOG_DIR`を再設定している場合は、mountPathを再設定してください。
:::

### BEの永続化ストレージ
DorisデプロイメントのBEノードでは、以下のパスを永続化することを推奨します：  
1. データストレージ：/opt/apache-doris/be/storage（BEデータのデフォルトストレージ）
2. ログ：/opt/apache-doris/be/log（ログの永続化が必要な場合）

#### データの永続化
- **デフォルトストレージ設定の使用**  
  デフォルトストレージ設定を使用してデータを永続化するには、以下の設定で[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)を更新してください：

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
上記の設定において、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は使用したいストレージサイズを表します。${storageSize}のフォーマットは、100Giのように、K8sの[quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います。使用時に必要に応じて置き換えてください。

- **BEストレージパスのカスタマイズ**  
  複数のディスクを活用するには、storage_root_pathを使用して複数のストレージディレクトリを設定できます。例えば、storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSDの場合、設定には以下を含める必要があります：

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
上記の設定では、${your_storageclass}は使用したいStorageClassの名前を表し、${storageSize}は使用したいストレージサイズを表します。${storageSize}の形式は、K8sの[quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。使用時に必要に応じて置き換えてください。

#### 永続化BE log
デフォルト設定を使用してBE logを永続化するには、DorisClusterリソース[DorisClusterリソース](install-doris-cluster.md#step-2-custom-the-template-and-deploy-cluster)を以下のように更新します：

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
上記の設定において、`${your_storageclass}`は使用したいStorageClassの名前を表し、`${storageSize}`は使用したいストレージサイズを表します。`${storageSize}`の形式は、100Giなど、K8sの[quantity表現方法](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います。使用時には必要に応じてそれらを置き換えてください。

## アクセス設定
KubernetesはVIP（Virtual IP）およびロードバランサーとしてServiceの使用を提供します。Serviceには3つの外部公開モードがあります：ClusterIP、NodePort、およびLoadBalancerです。

### ClusterIP
DorisはKubernetes上でデフォルトでClusterIPアクセスモードを提供します。ClusterIPアクセスモードは、この内部IPを通じてサービスを公開するために、Kubernetesクラスター内で内部IPアドレスを提供します。ClusterIPモードでは、サービスはクラスター内でのみアクセス可能です。

#### ステップ1：ClusterIPを設定する
DorisはKubernetes上でデフォルトでClusterIPアクセスモードを提供します。何も変更することなくClusterIPアクセスモードを使用できます。

#### ステップ2：Serviceを取得する
クラスターをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されたサービスを表示できます：

```shell
kubectl -n doris get svc
```
返される結果は以下の通りです:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```
上記の結果では、FEとBE用の2つのタイプのサービスがあり、それぞれ「internal」と「service」のサフィックスが付いています：
- 「internal」サフィックス付きのサービスは、ハートビート、データ交換、その他の操作など、Doris内部での内部通信にのみ使用でき、外部使用は想定されていません。
- 「service」サフィックス付きのサービスは、ユーザーが使用できます。

#### Step 3: コンテナ内からDorisにアクセスする

以下のコマンドを使用して、現在のKubernetesクラスタ内にmysqlクライアントを含むPodを作成できます：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
クラスター内のコンテナから、外部に公開されている「service」サフィックスが付いたサービス名を使用してDorisクラスターにアクセスできます：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```
### NodePort
KubernetesクラスターからDorisに外部アクセスするには、NodePortサービスタイプを使用できます。NodePortのポート割り当てには、動的割り当てと静的割り当ての2つの方法があります。
- 動的割り当て: ポートが明示的に設定されていない場合、podが作成される際にKubernetesがデフォルト範囲（30000-32767）から未使用のポートを自動的に割り当てます。
- 静的割り当て: ポートが明示的に指定された場合、そのポートが利用可能であればKubernetesがそのポートを割り当て、固定されることを保証します。

Dorisは外部アクセス用に以下のポートを公開します：

| Port Name | default value | Port Description                     |
|------| ---- |--------------------------|
| Query Port | 9030 | MySQLプロトコル経由でDorisクラスターにアクセスするために使用 |
| HTTP Port | 8030 | FE上のhttpサーバーポート、FE情報の表示に使用 |
| Web Server Port | 8040 | BE上のhttpサーバーポート、BE情報の表示に使用 |

#### Step 1: NodePortの設定
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
#### Step 2: サービスの取得
クラスターをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されているサービスを確認できます：

```shell
kubectl get service
```
返される結果は以下の通りです：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
#### Step 3: NodePortを使用してサービスにアクセスする
NodePort経由でDorisにアクセスするには、ノードIPとマッピングされたポートを知る必要があります。ノードIPは以下のコマンドで取得できます：

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
その後、任意のノードのIPアドレス（例：192.168.88.61、192.168.88.62、または192.168.88.63）をマップされたポートと組み合わせてDorisにアクセスできます。例えば、ノード192.168.88.62とポート31545を使用する場合：

```shell
  mysql -h 192.168.88.62 -P 31545 -uroot
```
### LoadBalancer
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) serviceタイプは、通常クラウドサービスプロバイダーによって提供される追加のロードバランサーを提供します。このモードは、クラウドプラットフォームによって管理されるKubernetesクラスター上でDorisクラスターをデプロイする場合にのみ利用可能です。
#### Step 1: LoadBalancerモードを設定する
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
#### Step 2: サービスの取得
クラスターをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されるサービスを確認できます：

```shell
kubectl get service
```
返される結果は以下の通りです：

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
#### ステップ3: LoadBalancerを使用したサービスへのアクセス
LoadBalancerを通じてDorisにアクセスするには、外部IP（EXTERNAL-IPフィールドに提供される）と対応するポートを使用します。例えば、`mysql`コマンドを使用する場合：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```
## 管理クラスター用のユーザー名とパスワードの設定
Dorisノードを管理するには、管理操作用のユーザー名とパスワードを使用してMySQLプロトコル経由でライブFEノードに接続する必要があります。Dorisは[RBACに類似した権限管理メカニズム](../../../admin-manual/auth/authentication-and-authorization)を実装しており、ユーザーはノード管理を実行するために[Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions)権限を持つ必要があります。デフォルトでは、Doris Operatorはパスワードなしモードでrootユーザーを使用してクラスターをデプロイします。

ユーザー名とパスワードを設定するプロセスは、3つのシナリオに分けることができます：
- クラスターデプロイ時のrootユーザーパスワードの初期化
- rootパスワードなしデプロイメントでの管理権限を持つ非rootユーザーの自動設定
- rootパスワードなしモードでクラスターをデプロイした後のrootユーザーパスワードの設定

アクセスを保護するには、rootユーザーにパスワードを追加した後、DorisClusterリソースでNode_Priv権限を持つユーザー名とパスワードを設定する必要があります。クラスターノードを管理するためのユーザー名とパスワードを設定する方法は2つあります：
- 環境変数を使用する
- Kubernetes Secretを使用する

### クラスターデプロイ時のrootユーザーパスワードの設定
rootユーザーのパスワードを安全に設定するため、Dorisは2段階SHA-1暗号化プロセスを使用して[`fe.conf`](../../../admin-manual/config/fe-config#initial_root_password)でパスワードを暗号化することをサポートしています。パスワードを設定する方法は以下の通りです。

#### ステップ1：root暗号化パスワードの生成

2段階SHA-1暗号化を使用してrootパスワードを暗号化するには、以下の方法を使用してください：

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
- Golang コード:

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
設定ファイル形式の要件に従って、暗号化されたパスワードを `fe.conf` に設定します。その後、ConfigMapを使用してKubernetesクラスターに設定を配布します。詳細は[クラスターパラメーター設定セクション](#custom-fe-startup-configuration)に記載されています。

#### ステップ 2: DorisClusterリソースの設定
fe.confでrootパスワードを設定した後、Doris起動時に最初のFEノードに自動的にパスワードが適用されます。他のノードがクラスターに参加するには、DorisClusterリソースでユーザー名とパスワードを指定して、Doris Operatorが自動ノード管理を実行できるようにします。
- 環境変数の使用

  DorisClusterリソースの".spec.adminUser.name"および".spec.adminUser.password"フィールドにユーザー名rootとパスワードを設定します。Doris Operatorは以下の設定を自動的にコンテナが使用する環境変数に変換します。コンテナ内部の補助サービスは、環境変数で設定されたユーザー名とパスワードを使用して、指定されたクラスターに自分自身を追加します。設定形式は以下の通りです：

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```
ここで、${password}はrootの暗号化されていないパスワードです。

- secretの使用

  ユーザー名とパスワードを安全に管理するために、Kubernetes [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret)を使用できます。rootのユーザー名とパスワードを保存するSecretを設定し、DorisClusterリソースでそれを参照します。
  a. 必要なSecretの設定

  以下の形式に従って必要なBasic認証Secretを設定します：

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```
ここで、${password}はrootに設定された暗号化されていないパスワードです。

  b. デプロイするDorisClusterリソースの設定

  以下の形式で必要なSecretを指定するようにDorisClusterを設定します：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
ここで、${secretName} は root のユーザー名とパスワードを含む Secret の名前です。

### デプロイ時に非 root 管理ユーザーとパスワードを自動作成する（推奨）
セキュリティを強化するため、root ユーザーを使用するのではなく、最初のデプロイ時に管理用の非 root ユーザーを作成することを推奨します。この方法では、非 root ユーザーのユーザー名とパスワードは環境変数または Secret を通じて設定されます。Doris コンテナーの補助サービスは、データベースにユーザーを自動作成し、パスワードを設定し、必要な Node_priv 権限を付与します。デプロイ後、Doris Operator は新しく作成された非 root のユーザー名とパスワードを使用してクラスターノードを管理します。

- 環境変数の使用：

  非 root ユーザーを設定するには、DorisCluster リソースで環境変数を使用してユーザー名とパスワードを設定できます：

    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名で、${DB_ADMIN_PASSWD}は新しく作成されたユーザー名に設定されたパスワードです。

- Secretの使用:
  ユーザー名とパスワードを安全に管理するために、基本認証用のKubernetes Secretを使用できます。
  a. 必要なsecretを設定する

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名で、${DB_ADMIN_PASSWD}は新しく作成されたユーザー名に設定されたパスワードです。  
  次のコマンドを実行してSecretをKubernetesクラスターにデプロイします：

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
ここで、${namespace}はDorisClusterリソースをデプロイする必要があるnamespaceであり、${secretFileName}はデプロイするSecretのファイル名です。

  b. DorisClusterリソースを設定する

  以下の形式に従ってDorisClusterリソースを更新してください：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
ここで、${secretName} はデプロイされたBasic認証Secretの名前です。

:::tip Tip  
デプロイ後、rootパスワードを設定してください。Doris Operatorは、自動的に新しく作成されたユーザー名とパスワードを使用してノードを管理するように切り替わります。自動的に作成されたユーザーを削除しないでください。  
:::

### クラスターデプロイ後のrootユーザーパスワードの設定
Dorisクラスターをデプロイしてrootユーザーのパスワードを設定した後、Doris Operatorがクラスターノードを自動的に管理できるよう、必要な[Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions)権限を持つ管理ユーザーを作成することが重要です。この目的でrootユーザーを使用することは推奨されません。代わりに、[ユーザー作成と権限割り当てセクション](../../../sql-manual/sql-statements/account-management/CREATE-USER)を参照して新しいユーザーを作成し、Node_priv権限を付与してください。

#### ステップ1：Node_priv権限を持つユーザーの作成
まず、MySQLプロトコルを使用してDorisデータベースに接続し、必要な権限を持つ新しいユーザーを作成します：

  ```shell
  CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
  ```
- ${DB_ADMIN_USER}: 作成したいユーザーの名前。
- ${DB_ADMIN_PASSWD}: 新しく作成されたユーザーのパスワード。

#### Step 2: 新しいユーザーにNode_priv権限を付与する
新しく作成されたユーザーにNode_priv権限を付与します：

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```
${DB_ADMIN_USER}: 前のステップで作成したユーザー名。

ユーザーの作成、パスワードの設定、権限の付与の詳細については、[CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER)セクションを参照してください。

#### Step 3: DorisClusterの設定
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
  新しいユーザー用のBasic Authentication Secretを作成します：

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```
ここで、${DB_ADMIN_USER}は新しく作成されたユーザー名で、${DB_ADMIN_PASSWD}は新しく作成されたユーザー名に設定されたパスワードです。
次のコマンドでSecretをKubernetesクラスターにデプロイします：

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
ここで、${namespace}はDorisClusterリソースをデプロイする必要があるnamespaceであり、${secretFileName}はデプロイするSecretのファイル名です。

  b. DorisClusterリソースを更新する  
  Secretがデプロイされたら、DorisClusterリソースを更新してSecretを指定します：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
ここで、${secretName}は、デプロイされたBasic認証Secretの名前です。

:::tip Tip  
rootパスワードを設定し、デプロイ後にノードを管理するための新しいユーザー名とパスワードを設定した後、既存のサービスはローリング方式で一度再起動されます。  
:::

## 設定変更時の自動サービス再起動
Dorisは設定ファイルを通じて起動パラメータを指定します。ほとんどのパラメータはWebインターフェースを通じて変更でき、すぐに有効になりますが、サービス再起動を必要とする特定のパラメータは、バージョン25.1.0で導入されたDoris Operatorの再起動機能を通じて自動的に処理できるようになりました。    
`DorisCluster`リソースでこの機能を有効にするには、以下のように設定してください：

```yaml
spec:
  enableRestartWhenConfigChange: true
```
この設定が存在する場合、Doris Operatorは以下を実行します：
1. クラスター起動設定の変更を監視します（ConfigMapを介してマウントされます。[起動設定のカスタマイズ](#custom-startup-configuration)を参照）。
2. 設定が変更された際に、影響を受けるサービスを自動的に再起動します。

### 使用例
FEとBEのconfigmap監視と再起動をサポートします。例としてFEの使用方法を示します。
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
2. FE サービス設定を更新する。
   fe-configmap ConfigMap（FE サービス設定を含む）の `fe.conf` キー配下の値を変更する際、Doris Operator は変更を適用するために FE サービスのローリング再起動を自動的に実行します。

## Kerberos 認証の使用
Doris Operator は、バージョン 25.2.0 以降、Kubernetes 上の Doris（バージョン 2.1.9、3.0.4 以降）に対する Kerberos 認証をサポートしています。Doris で Kerberos 認証を有効にするには、[krb5.conf ファイル](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html)と [keytab ファイル](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html)の両方が必要です。
Doris Operator は、ConfigMap リソースを使用して krb5.conf ファイルをマウントし、Secret リソースを使用して keytab ファイルをマウントします。Kerberos 認証を有効にするワークフローは以下の通りです：

1. krb5.conf ファイルを含む ConfigMap を作成する：

    ```shell
    kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
    ```
${namespace} を DorisCluster がデプロイされているネームスペースに、${name} を ConfigMap の希望する名前に置き換えてください。
2. keytab ファイルを含む Secret を作成します：

    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
    ```
${namespace}をDorisClusterがデプロイされているnamespaceに置き換え、${name}をSecretの希望する名前に置き換えてください。複数のkeytabファイルをマウントする必要がある場合は、[kubectl create Secret documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)を参照して、それらを単一のSecretに含めてください。
3. krb5.confを含むConfigMapとkeytabファイルを含むSecretを指定するようにDorisClusterリソースを設定します：

    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
${krb5ConfigMapName}: krb5.confファイルを含むConfigMapの名前。${keytabSecretName}: keytabファイルを含むSecretの名前。${keytabPath}: Secretがkeytabファイルをマウントするコンテナ内のディレクトリパス。このパスは、catalogを作成する際にhadoop.kerberos.keytabで指定されるディレクトリと一致する必要があります。catalogの設定詳細については、[Hive Catalog configuration](../../../lakehouse/catalogs/hive-catalog.mdx#configuring-catalog)のドキュメントを参照してください。

## 共有ストレージの設定
バージョン25.4.0以降、Doris OperatorはReadWriteManyアクセスモードの共有ストレージを複数のコンポーネント間のすべてのポッドにマウントすることをサポートしています。この機能を使用する前に、共有ストレージのPersistentVolumeおよびPersistentVolumeClaimリソースが作成されていることを確認してください。Dorisクラスターをデプロイする前に、以下に示すようにDorisClusterリソースを設定してください：

```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- `${mountPath}` はストレージがマウントされるコンテナ内の絶対パスを指定します。
- `${sharedPVCName}` は、マウントされる `PersistentVolumeClaim` の名前を参照します。
- `supportComponents` は共有ストレージを必要とするコンポーネントの名前を一覧表示します。上記の例では、FE と BE の両方のコンポーネントが共有ストレージをマウントします。supportComponents 配列が空のままの場合、デプロイされたすべてのコンポーネントがデフォルトで共有ストレージをマウントします。

:::tip Tip
`mountPath` パラメータは `${DORIS_HOME}` をプレフィックスとして使用できます。`${DORIS_HOME}` が使用されると、FE コンテナ内では `/opt/apache-doris/fe` に、BE コンテナ内では `/opt/apache-doris/be` に解決されます。
:::

## Probe タイムアウトの設定
DorisCluster は各サービスに対して 2 種類の probe タイムアウト設定を提供します：`startup probe timeout` と `liveness probe timeout`。サービスが指定された startup タイムアウト期間内に開始に失敗した場合、失敗したとみなされ再起動されます。
サービスが指定された liveness タイムアウトよりも長い間応答しなくなった場合、対応する Pod が自動的に再起動されます。

### Startup Probe Timeout
- FE Service Startup Timeout Configuration

    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
上記の設定は、FEサービスの起動タイムアウトを3600秒に設定します。
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
上記の設定は、FEサービスのlivenesstaimeoutを60秒に設定します。
- BEサービスLiveness Timeout設定

    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
上記の設定では、BEサービスのliveness timeoutを60秒に設定します。
