---
{
    "title": "02 Doris クラスターの設定",
    "language": "ja",
    "description": "DorisCluster リソースの設定ガイド。イメージ設定、レプリカ数の計画、計算リソースの割り当て、永続ストレージの設定、ConfigMap のカスタマイズ、Service のアクセス方式、ユーザー名とパスワードの管理について説明します。",
    "keywords": ["DorisCluster", "リソース設定", "レプリカ", "ConfigMap", "永続ストレージ", "NodePort", "LoadBalancer", "ClusterIP", "アクセス設定", "ストレージとコンピュートの統合"]
}
---

## クラスターの計画 {#cluster-planning}

デフォルトの `DorisCluster` リソースでは、FE と BE のイメージが最新バージョンとは限らず、どちらもレプリカ数はデフォルトで 3 です。計算リソースは、デフォルトで FE に 6c 12Gi、BE に 8c 16Gi が割り当てられます。以下では、必要に応じてこれらのデフォルト値を調整する方法を説明します。

### イメージの設定 {#image-settings}

Doris Operator は Doris のバージョンとは独立しています。Doris Operator は Doris 2.0 以降のデプロイをサポートします。

**FE イメージの設定**

FE イメージを指定するには、次のように設定します。

```yaml
spec:
  feSpec:
    image: ${image}
```

`${image}` をデプロイするイメージ名に置き換え、デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)の設定を更新します。Doris が提供する公式の [FE イメージ](https://hub.docker.com/r/apache/doris/tags?name=fe)を使用できます。

**BE イメージの設定**

BE イメージを指定するには、次のように設定します。

```yaml
spec:
  beSpec:
    image: ${image}
```

`${image}` をデプロイするイメージ名に置き換え、デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)の設定を更新します。Doris が提供する公式の [BE イメージ](https://hub.docker.com/r/apache/doris/tags?name=be)を使用できます。

### レプリカ数の設定 {#replica-settings}

**FE のレプリカ数の変更**

FE のデフォルトのレプリカ数を 3 から 5 に変更するには、次のように設定します。

```yaml
spec:
  feSpec:
    replicas: 5
```

デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)の設定を更新します。

**BE のレプリカ数の変更**

BE のデフォルトのレプリカ数を 3 から 5 に変更するには、次のように設定します。

```yaml
spec:
  beSpec:
    replicas: 5
```

デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)の設定を更新します。

### 計算リソースの設定 {#compute-resource-settings}

**FE の計算リソースの設定**

FE のデフォルトの計算リソースは 6c 12Gi です。8c 16Gi に変更するには、次のように設定します。

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

デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)の設定を更新します。

**BE の計算リソースの設定**

BE のデフォルトの計算リソースは 8c 16Gi です。16c 32Gi に変更するには、次のように設定します。

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

デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)の設定を更新します。

:::tip ヒント
FE と BE の起動に必要な最小リソースは 4c 8Gi です。通常の機能テストには 8c 8Gi を推奨します。
:::

## 起動設定のカスタマイズ {#customized-startup-configuration}

Kubernetes 上の Doris は、`ConfigMap` を使用して設定ファイルとサービスを分離します。デフォルトでは、サービスはイメージ内のデフォルト設定を起動パラメーターとして使用します。[FE の設定ドキュメント](../../../admin-manual/config/fe-config)と [BE の設定ドキュメント](../../../admin-manual/config/be-config)を参照し、カスタマイズした起動パラメーターを所定の `ConfigMap` にあらかじめ用意します。設定後、対象の [`DorisCluster` リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)がある名前空間にデプロイします。

### FE の起動設定のカスタマイズ {#fe-customized-startup-configuration}

#### ステップ 1：ConfigMap の設定とデプロイ {#step-1-configure-and-deploy-the-configmap}

次の例では、Doris FE で使用できる `fe-conf` という名前の ConfigMap を定義します。

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
    sys_log_level = INFO
    # NORMAL, BRIEF, ASYNC
    sys_log_mode = ASYNC
    # audit_log_dir = $LOG_DIR
    # audit_log_modules = slow_query, query
    # audit_log_roll_num = 10
    # meta_delay_toleration_second = 10
    # qe_max_connection = 1024
    # qe_query_timeout_second = 300
    # qe_slow_log_ms = 5000
    enable_fqdn_mode = true
```

ConfigMap を使用して FE の起動設定をマウントする場合、設定のキーは `fe.conf` でなければなりません。設定ファイルを用意したら、次のコマンドを使用して、`DorisCluster` リソースをデプロイする名前空間に配置します。

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```

ここで、`${namespace}` は対象の `DorisCluster` リソースをデプロイする名前空間、${feConfigMapFile} は上記の設定を含むファイル名です。

#### ステップ 2：DorisCluster リソースの設定 {#step-2-configure-the-doriscluster-resource}

fe-conf に対応する ConfigMap を例として、[デプロイする `DorisCluster` リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の情報を追加します。

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```

:::tip ヒント
Kubernetes にデプロイする場合は、FQDN モードを推奨します。起動設定に enable_fqdn_mode=true を追加します。IP モードを使用し、Kubernetes クラスターで再起動後も Pod の IP が変わらないことを保証できる場合は、issue [#138](https://github.com/apache/doris-operator/issues/138) を参照して IP モードで起動するよう設定してください。
:::

### BE の起動設定のカスタマイズ {#be-customized-startup-configuration}

#### ステップ 1：ConfigMap の設定とデプロイ {#step-1-configure-and-deploy-the-configmap-1}

次の例では、Doris BE で使用できる `be-conf` という名前の ConfigMap を定義します。

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
    # https://doris.apache.org/community/developer-guide/debug-tool#jemalloc-heap-profile
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

ConfigMap を使用して BE の起動設定をマウントする場合、設定のキーは `be.conf` でなければなりません。設定ファイルを用意したら、対象の `DorisCluster` リソースをデプロイする名前空間に配置します。

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```

ここで、`${namespace}` は `DorisCluster` リソースをデプロイする名前空間、${beConfigMapFile} は上記の設定を含むファイル名です。

#### ステップ 2：DorisCluster リソースの設定 {#step-2-configure-the-doriscluster-resource-1}

be-conf に対応する ConfigMap を例として、[デプロイする `DorisCluster` リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の情報を追加します。

```yaml
spec:
  beSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```

:::tip ヒント
起動設定と同じディレクトリにファイルをマウントするには、その起動設定を保持する ConfigMap にファイルの設定も格納します。ConfigMap のキーがファイル名、値が設定内容です。
:::

### 複数の ConfigMap のマウント {#mounting-multiple-configmaps}

Doris Operator は、ConfigMap で設定ファイルをマウントするだけでなく、複数の ConfigMap をコンテナー内の異なるディレクトリにマウントすることもできます。

**FE に複数の ConfigMap をマウントする**

次の例では、ConfigMap の `test-fe1` と `test-fe2` を、それぞれ FE コンテナーの `/etc/fe/config1/` と `/etc/fe/config2` にマウントします。

```yaml
spec:
  feSpec:
    configMaps:
    - configMapName: test-fe1
      mountPath: /etc/fe/config1
    - configMapName: test-fe2
      mountPath: /etc/fe/config2
```

上記の設定では、${your_storageclass} は使用する [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) の名前、${storageSize} は使用するストレージ容量です。${storageSize} の形式は K8s の[数量表記](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。必要に応じて置き換えてください。

**BE に複数の ConfigMap をマウントする**

次の例では、ConfigMap の test-be1 と test-be2 を、それぞれ BE コンテナーの `/etc/be/config1/` と `/etc/be/config2` にマウントします。

```yaml
spec:
  beSpec:
    configMaps:
    - configMapName: test-be1
      mountPath: /etc/be/config1
    - configMapName: test-be2
      mountPath: /etc/be/config2
```

上記の設定では、${your_storageclass} は使用する [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) の名前、${storageSize} は使用するストレージ容量です。${storageSize} の形式は K8s の[数量表記](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。必要に応じて置き換えてください。

## 永続ストレージの設定 {#configure-persistent-storage}

Doris クラスターでは、FE と BE のデータを永続化する必要があります。Kubernetes は、データを物理ストレージに永続化するための [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) を提供します。Kubernetes 環境では、Doris Operator が [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) を使用して、適切な PersistentVolume にバインドする PersistentVolumeClaim を自動的に作成します。

### FE の永続ストレージの設定 {#fe-persistent-storage-configuration}

Kubernetes に Doris クラスターをデプロイする際は、FE メタデータのデフォルトの保存先である `/opt/apache-doris/fe/doris-meta` のマウントポイントを永続化することを推奨します。Doris はデフォルトですべてのログを標準出力（コンソール）に出力します。クラスターにログ収集機能がない場合は、ログを永続化するために /opt/apache-doris/fe/log のマウントポイントも永続化することを推奨します。

#### FE メタデータの永続化 {#fe-metadata-persistence}

デフォルトの設定ファイルを使用する場合は、[デプロイする DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の内容を追加します。

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

上記の設定では、${your_storageclass} は指定する [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) の名前、${storageSize} は指定するストレージ容量です。形式は Kubernetes の[数量表記](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。

#### FE ログの永続化 {#fe-log-persistence}

デフォルトの設定ファイルを使用する場合は、デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の内容を追加します。

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

上記の設定では、${your_storageclass} は使用する [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) の名前、${storageSize} は使用するストレージ容量です。${storageSize} の形式は Kubernetes の[数量表記](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。

:::tip ヒント
`meta_dir` または `LOG_DIR` を[カスタマイズした設定ファイル](#fe-customized-startup-configuration)で再設定した場合は、それに応じて `mountPath` も変更してください。
:::

### BE の永続ストレージの設定 {#be-persistent-storage-configuration}

Kubernetes に Doris クラスターをデプロイする際は、BE ノードのデータ保存先のデフォルトである `/opt/apache-doris/be/storage` のマウントポイントを永続化することを推奨します。Kubernetes にデプロイした場合、Doris はデフォルトですべてのログを標準出力（コンソール）に出力します。クラスターにログ収集機能がない場合は、`/opt/apache-doris/be/log` のマウントポイントも永続化することを推奨します。

#### BE データの永続化 {#be-data-persistence}

- デフォルトの永続ストレージパス

  BE でデフォルト設定を使用する場合は、[デプロイする DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の内容を追加します。
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

  上記の設定では、${your_storageclass} は使用する [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) の名前、${storageSize} は使用するストレージ容量です。形式は Kubernetes の[数量表記](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。

- 複数のストレージパスの永続化

  カスタマイズした設定で `storage_root_path` に複数のストレージディレクトリを指定する場合（例：`storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD`）、デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の設定を追加します。

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
  
#### BE ログの永続化 {#be-log-persistence}

デフォルトの設定ファイルを使用する場合は、デプロイする [DorisCluster リソース](install-doris-cluster.md#step-2-install-the-customized-deployment-template)に次の内容を追加します。

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

上記の設定では、${your_storageclass} は使用する [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) の名前、${storageSize} は使用するストレージ容量です。形式は Kubernetes の[数量表記](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)に従います（例：100Gi）。

## アクセスの設定 {#access-configuration}

Kubernetes は Service を使用して仮想 IP（VIP）と負荷分散機能を提供します。Service には、外部への公開方式として `ClusterIP`、`NodePort`、`LoadBalancer` の三種類があります。

### ClusterIP {#clusterip}

デフォルトでは、Kubernetes 上の Doris は [ClusterIP アクセス方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用します。ClusterIP は Kubernetes クラスター内のアドレスを提供し、Kubernetes 内からサービスにアクセスする際に使用します。

#### ステップ 1：Service の種類を ClusterIP に設定する {#step-1-configure-clusterip-as-the-service-type}

  Kubernetes 上の Doris では、ClusterIP アクセス方式がデフォルトで有効です。追加の変更なしで使用できます。

#### ステップ 2：Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスターのデプロイ後、次のコマンドを実行して Doris Operator が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のとおりです。

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

上記の結果では、FE と BE にそれぞれ internal と service の接尾辞が付いた二種類の Service があります。

internal の接尾辞が付いた Service は、ハートビートやデータ交換など Doris 内部の通信にのみ使用され、外部には公開されません。

service の接尾辞が付いた Service は、クラスターのサービスへのアクセスに使用します。

#### ステップ 3：コンテナー内から Doris にアクセスする {#step-3-access-doris-inside-a-container}

次のコマンドを使用して、現在の Kubernetes クラスターに MySQL クライアントを含む Pod を作成します。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

コンテナー内では、`service` の接尾辞が付いた Service 名を使用して Doris クラスターに接続できます。

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort {#nodeport}

Kubernetes クラスターの外部から Doris にアクセスするには、[NodePort 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択できます。NodePort には、ホストポートの静的なマッピングと動的な割り当てという二つの設定方法があります。

- **ホストポートの動的割り当て**：ポートマッピングを明示的に設定しない場合、Pod の作成時に Kubernetes がホスト上の未使用ポート（デフォルトの範囲は 30000～32767）を自動的に割り当てます。

- **ホストポートの静的割り当て**：ポートマッピングを明示的に指定した場合、そのホストポートが未使用で競合しなければ、Kubernetes が固定ポートとして割り当てます。

静的割り当てにはポートマッピングの計画が必要です。Doris は外部との通信に次のポートを使用します。

| ポート名 | デフォルトのポート | 説明 |
|------| ---- |--------------------------|
| Query Port | 9030 | MySQL プロトコルを使用して Doris クラスターにアクセスするためのポート |
| HTTP Port | 8030 | FE の情報を表示するための FE の HTTP サーバーポート |
| Web Server Port | 8040 | BE の情報を表示するための BE の HTTP サーバーポート |


#### ステップ 1：FE と BE に NodePort を設定する {#step-1-configure-nodeport-for-fe-and-be}

**FE の NodePort**

- 動的割り当ての設定：

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```

- 静的割り当ての設定例：

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

**BE の NodePort**

- 動的割り当ての設定：

  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```

- 静的割り当ての設定例：

  ```yaml
  beSpec:
    service:
      type: NodePort
      servicePorts:
      - nodePort: 31006
        targetPort: 8040
  ```

#### ステップ 2：Service を取得する {#step-2-get-the-service}

クラスターのデプロイ後、次のコマンドを実行して `Service` を確認します。

```shell
kubectl get service
```

結果は次のとおりです。

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### ステップ 3：NodePort を使用して Service にアクセスする {#step-3-access-the-service-using-nodeport}

MySQL 接続を例に説明します。Doris の Query Port のデフォルトは 9030 です。上記の例では、ポート 9030 がホストのポート 31545 にマッピングされています。Doris クラスターにアクセスするには、クラスターのノードの IP アドレスが必要です。次のコマンドを実行して確認します。

```shell
kubectl get nodes -owide
```

結果は次のとおりです。

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

NodePort 方式では、任意のノードの IP アドレスとマッピングされたホストポートを使用して、Kubernetes クラスター内のサービスにアクセスできます。この例で利用できるノード IP は 192.168.88.61、192.168.88.62、192.168.88.63 です。次の例では、ノード 192.168.88.62 と `query port` からマッピングされたホストポート 31545 を使用して Doris に接続します。

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer {#loadbalancer}

[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) はクラウドサービスプロバイダーが提供するロードバランサーです。この設定は、クラウドプラットフォームが提供する Kubernetes 環境にのみ適用されます。

#### ステップ 1：LoadBalancer 方式を設定する {#step-1-configure-loadbalancer-mode}

**FE の LoadBalancer 設定**

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
```

**BE の LoadBalancer 設定**

  ```yaml
  spec:
    beSpec:
      service:
        type: LoadBalancer
  ```

#### ステップ 2：Service を取得する {#step-2-get-the-service-1}

クラスターのデプロイ後、次のコマンドを実行して `Service` を確認します。これを使用して `Doris` にアクセスできます。

```shell
kubectl get service
```

結果は次のとおりです。

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### ステップ 3：LoadBalancer 方式でアクセスする {#step-3-access-in-loadbalancer-mode}

MySQL 接続を例に示します。

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## 管理ユーザー名とパスワードの設定 {#configure-admin-username-and-password}

Doris のノードを管理するには、ユーザー名とパスワードを使用し、MySQL プロトコルで稼働中の FE ノードに接続する必要があります。Doris は [RBAC に似た権限管理の仕組み](../../../admin-manual/auth/authentication-and-authorization)を実装しています。ノード管理には [Node_priv](../../../admin-manual/auth/authentication-and-authorization#permission-types) 権限が必要です。デフォルトでは、Doris Operator はすべての権限を持ち、パスワードが設定されていない root ユーザーを使用して、DorisCluster リソースで設定されたクラスターをデプロイおよび管理します。root ユーザーにパスワードを設定した後は、Doris Operator がクラスターを自動管理できるように、Node_Priv 権限を持つユーザー名とパスワードを DorisCluster リソースで明示的に設定する必要があります。

DorisCluster リソースでは、クラスターのノード管理に使用するユーザー名とパスワードを、環境変数または [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) で設定できます。クラスター管理ユーザー名とパスワードの設定には、次の 3 つのケースがあります。

- クラスターのデプロイ時に root ユーザーのパスワードを初期化する。

- パスワードのない root ユーザーでデプロイする際に、管理権限を持つ root 以外のユーザーを自動的に作成する。

- パスワードのない root ユーザーでクラスターをデプロイした後に、root ユーザーのパスワードを設定する。

### クラスターのデプロイ時に root ユーザーのパスワードを設定する {#configure-the-root-user-password-during-cluster-deployment}

Doris では、root ユーザーのパスワードを暗号化した形式で `fe.conf` に設定できます。Doris Operator がクラスターのノードを自動管理できるよう、Doris の初回デプロイ時に root ユーザーのパスワードを設定します。手順は次のとおりです。

#### ステップ 1：暗号化した root パスワードを作成する {#step-1-build-the-encrypted-root-password}

Doris では、[FE 設定ファイル](../../../admin-manual/config/fe-config#initial_root_password)に root ユーザーのパスワードを暗号化した形式で設定できます。パスワードは二段階の SHA-1 で暗号化します。コード例を以下に示します。

Java による実装：

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

Golang による実装：

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

設定ファイルの要件に従って、暗号化したパスワードを `fe.conf` に記述します。[クラスターのパラメーター設定](#fe-customized-startup-configuration)に従い、設定ファイルを `ConfigMap` として Kubernetes クラスターに配布します。

#### ステップ 2：DorisCluster リソースを作成する {#step-2-build-the-doriscluster-resource}

設定ファイルに root の初期パスワードを設定すると、最初の Doris FE ノードの起動時に直ちに有効になります。後続のノードがクラスターに参加する際、Doris Operator は root のユーザー名とパスワードを使用してノードを追加します。そのため、Doris Operator がクラスターのノードを管理できるよう、デプロイする DorisCluster リソースにユーザー名とパスワードを指定する必要があります。

- 環境変数を使用する方法

  DorisCluster リソースの ".spec.adminUser.name" と ".spec.adminUser.password" フィールドに root のユーザー名とパスワードを設定します。Doris Operator はこれらをコンテナーの環境変数に自動変換し、コンテナー内の補助サービスはその環境変数を使用してクラスターにノードを追加します。設定形式は次のとおりです。

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```

  ここで、`${password}` は暗号化されていない root パスワードです。

- Secret を使用する方法

  Doris Operator は、[Basic 認証用 Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) を使用した管理用のユーザー名とパスワードの指定をサポートします。Doris Operator は Secret をコンテナー内の所定の場所にファイルとして自動的にマウントします。コンテナー内の補助サービスはそのファイルからユーザー名とパスワードを読み取り、クラスターにノードを自動追加します。basic-authentication-secret の stringData には、username と password の 2 つのフィールドのみを含めます。Secret を使用して管理用のユーザー名とパスワードを設定する手順は次のとおりです。

  a. 使用する Secret を設定する

  使用する Basic 認証用 Secret を次の形式で設定します。

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```

  ここで、`${password}` は root に設定した暗号化されていないパスワードです。
  次のコマンドを使用して、更新した Secret を Kubernetes クラスターにデプロイします。
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  ここで、`${namespace}` は DorisCluster リソースをデプロイする名前空間、${secretFileName} はデプロイする Secret のファイル名です。

  b. DorisCluster リソースを設定する

  デプロイする DorisCluster リソースに使用する Secret を指定します。設定は次のとおりです。

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  ここで、`${secretName}` は root のユーザー名とパスワードを含む Secret の名前です。

### デプロイ時に root 以外の管理ユーザーとパスワードを自動作成する（推奨） {#automatically-create-a-non-root-admin-user-and-password-during-deployment-recommended}

初回のデプロイ時に root の初期パスワードを設定しない場合は、環境変数または Secret を使用して、root 以外のユーザーとログイン用パスワードを設定します。Doris コンテナー内の補助サービスは、このユーザーを Doris 内に自動作成し、パスワードを設定して Node_priv 権限を付与します。その後、Doris Operator は自動作成したユーザー名とパスワードを使用してクラスターのノードを管理します。

- 環境変数を使用する方法

  デプロイする DorisCluster リソースを次の形式で設定します。
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  ここで、`${DB_ADMIN_USER}` は新規作成する管理権限を持つユーザー名、`${DB_ADMIN_PASSWD}` は新しいユーザーのパスワードです。

- Secret を使用する方法

  a. 使用する Secret を設定する

  使用する Basic 認証用 Secret を次の形式で設定します。

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  ここで、`${DB_ADMIN_USER}` は新規作成するユーザー名、`${DB_ADMIN_PASSWD}` はそのユーザーに設定するパスワードです。

  次のコマンドを使用して Secret を Kubernetes クラスターにデプロイします。

  ```
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  ここで、`${namespace}` は DorisCluster リソースをデプロイする名前空間、`${secretFileName}` はデプロイする Secret のファイル名です。

  b. DorisCluster リソースを更新する

  DorisCluster リソースで使用する Secret を次のように指定します。

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  ここで、`${secretName}` はデプロイした Basic 認証用 Secret の名前です。

:::tip ヒント
- デプロイ後に root のパスワードを設定します。Doris Operator は新しいユーザー名とパスワードを使用したクラスターのノード管理に切り替わります。新規作成したユーザーを削除しないでください。
:::

### クラスターのデプロイ後に root ユーザーのパスワードを設定する {#set-the-root-user-password-after-cluster-deployment}

Doris クラスターのデプロイ後、root ユーザーにパスワードが設定されていない場合は、Doris Operator がクラスターのノードを自動管理できるよう、[Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#permission-types) 権限を持つユーザーを設定する必要があります。root ユーザーの使用は推奨しません。[ユーザーの作成と権限付与](../../../sql-manual/sql-statements/account-management/CREATE-USER)を参照し、新しいユーザーを作成して Node_priv 権限を付与します。作成後、その管理ユーザー名とパスワードを環境変数または Secret で設定し、DorisCluster リソースに指定します。

#### ステップ 1：Node_priv 権限を持つユーザーを作成する {#step-1-create-a-user-with-node_priv-privilege}

MySQL プロトコルでデータベースに接続した後、次のコマンドを実行して Node_priv 権限のみを持つユーザーを作成し、パスワードを設定します。

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

ここで、${DB_ADMIN_USER} は作成するユーザー名、${DB_ADMIN_PASSWD} は設定するパスワードです。

#### ステップ 2：新しいユーザーに Node_priv 権限を付与する {#step-2-grant-node_priv-privilege-to-the-new-user}

MySQL プロトコルでデータベースに接続した後、次のコマンドを実行して新しいユーザーに Node_priv 権限を付与します。

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

ここで、${DB_ADMIN_USER} は新規作成したユーザー名です。

ユーザーの作成、パスワードの設定、権限の付与については、公式の [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) ドキュメントを参照してください。

#### ステップ 3：DorisCluster リソースを設定する {#step-3-configure-the-doriscluster-resource}

- 環境変数を使用する方法

  DorisCluster リソースに新規作成したユーザーとパスワードを次のように設定します。
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  ここで、${DB_ADMIN_USER} は新規作成したユーザー名、${DB_ADMIN_PASSWD} はそのユーザーに設定したパスワードです。

- Secret を使用する方法

  a. Secret を設定する

  次の形式で Basic 認証用 Secret を作成します。

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  ここで、${DB_ADMIN_USER} は新規作成したユーザー名、${DB_ADMIN_PASSWD} はそのユーザー名に設定したパスワードです。

  次のコマンドを使用して Secret を Kubernetes クラスターにデプロイします。

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  ここで、`${namespace}` は DorisCluster リソースをデプロイする名前空間、`${secretFileName}` はデプロイする Secret のファイル名です。

  b. Secret を使用する DorisCluster リソースを更新する

  DorisCluster リソースで使用する Secret を次のように指定します。

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  ここで、`${secretName}` はデプロイした Basic 認証用 Secret の名前です。

:::tip ヒント
- デプロイ後に root パスワードを設定し、新しい管理ユーザー名とパスワードを設定すると、既存のサービスでローリング再起動が一回発生します。
:::

## 起動設定の変更を適用するためにサービスを自動再起動する {#automatically-restart-service-to-apply-startup-configuration-changes}
Doris は設定ファイルで起動パラメーターを指定します。ほとんどのパラメーターは対応する Web インターフェースで変更でき、リアルタイムで反映されます。Web インターフェースで変更できない一部のパラメーターは、反映するためにサービスの再起動が必要です。Doris Operator バージョン 25.1.0 以降では、サービスの起動パラメーターの変更を自動再起動によって反映できます。
この機能を有効にするには、`DorisCluster` リソースを次のように設定します。
```yaml
spec:
  enableRestartWhenConfigChange: true
```
DorisCluster リソースに上記の設定が含まれる場合、Doris Operator は次のように動作します。
1. `DorisCluster` リソースでデプロイしたクラスターが依存する起動設定（ConfigMap でマウント。詳細は[起動設定のカスタマイズ](#customized-startup-configuration)を参照）が変更されたかどうかを監視します。
2. 起動設定が変更されると、対応するサービスを自動的に再起動して設定を反映します。

### 使用例 {#usage-example}
ConfigMap の監視と再起動は FE と BE のノードでサポートされます。以下では FE を例に説明します。
1. DorisCluster のデプロイ仕様は次のとおりです。
    ```yaml
    spec:
      enableRestartWhenConfigChange: true
      feSpec:
        image: apache/doris:fe-2.1.8
        replicas: 1
        configMapInfo:
          configMapName: fe-configmap
    ```
2. `fe-configmap` で指定した FE サービスの起動設定を更新します。
キー `fe.conf` に対応する `fe-configmap` 内の値（FE サービスの起動設定）を更新すると、Doris Operator は FE サービスを自動的にローリング再起動して設定を反映します。

## Kerberos 認証を使用する {#use-kerberos-authentication}
Doris Operator バージョン 25.2.0 以降では、Kubernetes 上の Doris（バージョン 2.1.9 および 3.0.4 以降）で Kerberos 認証をサポートします。Doris での Kerberos 認証には、[krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) と [keytab ファイル](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html)が必要です。
Doris Operator は `ConfigMap` リソースを使用して krb5.conf ファイルを、`Secret` リソースを使用して keytab ファイルをマウントします。Kerberos 認証を使用する手順は次のとおりです。
1. krb5.conf ファイルを含む ConfigMap を作成します。
    ```shell
    kubectl create -n ${namespace} create configmap ${name} --from-file=krb5.conf
    ```
   ${namespace} は `DorisCluster` をデプロイする名前空間、${name} は ConfigMap に付ける名前です。
2. keytab を含む Secret を作成します。
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file= ${xxx.keytab}
    ```
   ${namespace} は `DorisCluster` をデプロイする名前空間、${name} は Secret に付ける名前です。複数の `keytab` ファイルをマウントするには、[kubectl create Secret のドキュメント](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)を参照して、複数の `keytab` ファイルを一つの Secret に格納してください。
3. DorisCluster リソースを設定し、`krb5.conf` を含む ConfigMap と `keytab` ファイルを含む Secret を指定します。
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName} は使用する `krb5.conf` ファイルを含む ConfigMap の名前です。${keytabSecretName} は keytab ファイルを含む Secret の名前です。${keytabPath} は Secret をコンテナー内にマウントするパスです。このパスは、カタログの作成時に `hadoop.kerberos.keytab` で指定する、keytab ファイルがあるディレクトリです。カタログの作成については、[Hive Catalog](../../../lakehouse/catalogs/hive-catalog.mdx#configure-catalog) のドキュメントを参照してください。

## 共有ストレージを設定する {#configure-shared-storage}
Doris Operator バージョン 25.4.0 以降では、複数のコンポーネントのすべての Pod に `ReadWriteMany` の共有ストレージをマウントできます。使用前に、共有ストレージ用の `PersistentVolume` と `PersistentVolumeClaim` リソースをあらかじめ作成してください。Doris クラスターをデプロイする前に、`DorisCluster` リソースを次のように設定します。
```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- ${mountPath} はコンテナー内にマウントする絶対パスを指定します。
- ${sharedPVCName} はマウントする `PersistentVolumeClaim` の名前です。
- `supportComponents` はこの共有ストレージをマウントするコンポーネントの名前を指定します。上記の例では FE と BE が共有ストレージをマウントします。`supportComponents` 配列が空の場合は、デプロイしたすべてのコンポーネントが共有ストレージをマウントします。

:::tip ヒント
`mountPath` のパスの接頭辞には `${DORIS_HOME}` を使用できます。`mountPath` の先頭に `${DORIS_HOME}` を使用した場合、FE コンテナーでは `${DORIS_HOME}` は `/opt/apache-doris/fe`、BE コンテナーでは `${DORIS_HOME}` は `/opt/apache-doris/be` を指します。
:::

## プローブのタイムアウトを設定する {#configure-probe-timeouts}
`DorisCluster` では、各サービスに対して起動プローブのタイムアウトと生存プローブのタイムアウトを設定できます。サービスの起動時間が設定した起動プローブのタイムアウトを超えると、起動失敗と見なされ、サービスが再起動されます。生存プローブのタイムアウト内にサービスが応答しない場合、Pod が自動的に再起動されます。
### 起動プローブのタイムアウト設定 {#startup-probe-timeout-configuration}
- FE サービスの起動プローブのタイムアウト設定
    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
  上記の設定では、FE の起動タイムアウトを 3600 秒に設定します。
- BE サービスの起動プローブのタイムアウト設定
    ```
    spec:
      beSpec:
        startTimeout: 3600
    ```
  上記の設定では、BE の起動タイムアウトを 3600 秒に設定します。
### 生存プローブのタイムアウト設定 {#liveness-probe-timeout-configuration}
- FE サービスの生存プローブのタイムアウト設定
    ```
    spec:
      feSpec:
        liveTimeout: 60
    ```
  上記の設定では、FE の生存タイムアウトを 60 秒に設定します。
- BE サービスの生存プローブのタイムアウト設定
    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
  上記の設定では、BE の生存タイムアウトを 60 秒に設定します。
