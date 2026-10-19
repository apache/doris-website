---
{
    "title": "02 Doris 클러스터 구성",
    "language": "ko",
    "description": "DorisCluster 리소스 구성 가이드: 이미지 설정, 복제본 계획, 컴퓨팅 리소스 할당, 영구 스토리지 구성, ConfigMap 사용자 지정, Service 접근 모드, 사용자 이름 및 비밀번호 관리.",
    "keywords": ["DorisCluster", "리소스 구성", "복제본", "ConfigMap", "영구 스토리지", "NodePort", "LoadBalancer", "ClusterIP", "접근 구성", "스토리지와 컴퓨팅 통합"]
}
---

## 클러스터 계획 {#cluster-planning}

기본 `DorisCluster` 리소스의 FE 및 BE 이미지는 최신 버전이 아닐 수 있으며, 기본 복제본 수는 모두 3개입니다. 기본적으로 FE는 6c 12Gi의 컴퓨팅 리소스를, BE는 8c 16Gi를 사용합니다. 다음 절에서는 필요에 맞게 이러한 기본값을 조정하는 방법을 설명합니다.

### 이미지 설정 {#image-settings}

Doris Operator는 Doris 버전과 독립적으로 동작합니다. Doris Operator는 Doris 2.0 이상 버전의 배포를 지원합니다.

**FE 이미지 설정**

FE 이미지를 지정하려면 다음과 같이 구성합니다:

```yaml
spec:
  feSpec:
    image: ${image}
```

`${image}`를 배포할 이미지 이름으로 바꾼 다음, 배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)의 구성을 업데이트합니다. Doris에서 제공하는 공식 [FE 이미지](https://hub.docker.com/r/apache/doris/tags?name=fe)를 사용할 수 있습니다.

**BE 이미지 설정**

BE 이미지를 지정하려면 다음과 같이 구성합니다:

```yaml
spec:
  beSpec:
    image: ${image}
```

`${image}`를 배포할 이미지 이름으로 바꾼 다음, 배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)의 구성을 업데이트합니다. Doris에서 제공하는 공식 [BE 이미지](https://hub.docker.com/r/apache/doris/tags?name=be)를 사용할 수 있습니다.

### 복제본 설정 {#replica-settings}

**FE 복제본 수 변경**

기본 FE 복제본 수를 3개에서 5개로 변경하려면 다음과 같이 구성합니다:

```yaml
spec:
  feSpec:
    replicas: 5
```

배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)의 구성을 업데이트합니다.

**BE 복제본 수 변경**

기본 BE 복제본 수를 3개에서 5개로 변경하려면 다음과 같이 구성합니다:

```yaml
spec:
  beSpec:
    replicas: 5
```

배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)의 구성을 업데이트합니다.

### 컴퓨팅 리소스 설정 {#compute-resource-settings}

**FE 컴퓨팅 리소스 설정**

기본 FE 컴퓨팅 리소스는 6c 12Gi입니다. 이를 8c 16Gi로 변경하려면 다음과 같이 구성합니다:

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

배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)의 구성을 업데이트합니다.

**BE 컴퓨팅 리소스 설정**

기본 BE 컴퓨팅 리소스는 8c 16Gi입니다. 이를 16c 32Gi로 변경하려면 다음과 같이 구성합니다:

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

배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)의 구성을 업데이트합니다.

:::tip 팁
FE와 BE를 시작하는 데 필요한 최소 리소스는 4c 8Gi입니다. 일반적인 기능 테스트에는 8c 8Gi를 권장합니다.
:::

## 사용자 지정 시작 구성 {#customized-startup-configuration}

Kubernetes에서 Doris는 `ConfigMap`을 사용하여 구성 파일을 서비스와 분리합니다. 기본적으로 서비스는 이미지의 기본 구성을 시작 매개변수로 사용합니다. [FE 구성 문서](../../../admin-manual/config/fe-config)와 [BE 구성 문서](../../../admin-manual/config/be-config)를 참고하여 사용자 지정 시작 매개변수를 특정 `ConfigMap`에 미리 준비합니다. 구성이 완료되면 대상 [`DorisCluster` 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)가 있는 네임스페이스에 배포합니다.

### FE 사용자 지정 시작 구성 {#fe-customized-startup-configuration}

#### 1단계: ConfigMap 구성 및 배포 {#step-1-configure-and-deploy-the-configmap}

다음 예는 Doris FE에서 사용할 수 있는 `fe-conf`라는 이름의 ConfigMap을 정의합니다:

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

ConfigMap을 사용하여 FE 시작 구성을 마운트할 때 구성의 키는 반드시 `fe.conf`여야 합니다. 구성 파일을 준비한 후 다음 명령으로 `DorisCluster` 리소스를 배포할 네임스페이스에 배포합니다.

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```

여기서 `${namespace}`는 대상 `DorisCluster` 리소스를 배포할 네임스페이스이고, ${feConfigMapFile}은 위 구성이 들어 있는 파일의 이름입니다.

#### 2단계: DorisCluster 리소스 구성 {#step-2-configure-the-doriscluster-resource}

fe-conf에 해당하는 ConfigMap을 예로 들면, [배포된 `DorisCluster` 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 정보를 추가합니다:

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```

:::tip 팁
Kubernetes 배포에는 FQDN 모드를 권장합니다. 시작 구성에 enable_fqdn_mode=true를 추가합니다. IP 모드를 사용하려고 하며 Kubernetes 클러스터에서 재시작 후에도 Pod IP가 변경되지 않음을 보장할 수 있다면, 이슈 [#138](https://github.com/apache/doris-operator/issues/138)을 참고하여 IP 모드 시작을 구성합니다.
:::

### BE 사용자 지정 시작 구성 {#be-customized-startup-configuration}

#### 1단계: ConfigMap 구성 및 배포 {#step-1-configure-and-deploy-the-configmap-1}

다음은 Doris BE에서 사용할 수 있는 `be-conf`라는 이름의 ConfigMap을 정의합니다:

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

ConfigMap을 사용하여 BE 시작 구성을 마운트할 때 구성의 키는 반드시 `be.conf`여야 합니다. 구성 파일을 준비한 후 대상 `DorisCluster` 리소스를 배포할 네임스페이스에 배포합니다.

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```

여기서 `${namespace}`는 `DorisCluster` 리소스를 배포할 네임스페이스이고, ${beConfigMapFile}은 위 구성이 들어 있는 파일의 이름입니다.

#### 2단계: DorisCluster 리소스 구성 {#step-2-configure-the-doriscluster-resource-1}

be-conf에 해당하는 ConfigMap을 예로 들면, [배포된 `DorisCluster` 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 정보를 추가합니다:

```yaml
spec:
  beSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```

:::tip 팁
시작 구성과 같은 디렉터리에 파일을 마운트하려면 시작 구성이 들어 있는 ConfigMap에 해당 구성도 넣습니다. ConfigMap의 키는 파일 이름이고 값은 구성 내용입니다.
:::

### 여러 ConfigMap 마운트 {#mounting-multiple-configmaps}

Doris Operator는 ConfigMap을 통한 구성 파일 마운트뿐 아니라 여러 ConfigMap을 컨테이너의 서로 다른 디렉터리에 마운트하는 기능도 제공합니다.

**FE에 여러 ConfigMap 마운트**

다음 예는 ConfigMap `test-fe1`과 `test-fe2`를 FE 컨테이너의 `/etc/fe/config1/` 및 `/etc/fe/config2` 디렉터리에 각각 마운트하는 방법을 보여 줍니다:

```yaml
spec:
  feSpec:
    configMaps:
    - configMapName: test-fe1
      mountPath: /etc/fe/config1
    - configMapName: test-fe2
      mountPath: /etc/fe/config2
```

위 구성에서 ${your_storageclass}는 사용할 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)의 이름이고, ${storageSize}는 사용할 스토리지 크기입니다. ${storageSize}의 형식은 K8s [수량 표현식](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)을 따르며, 예를 들어 100Gi로 지정합니다. 필요에 맞게 바꿉니다.

**BE에 여러 ConfigMap 마운트**

다음 예는 ConfigMap test-be1과 test-be2를 BE 컨테이너의 `/etc/be/config1/` 및 `/etc/be/config2` 디렉터리에 각각 마운트하는 방법을 보여 줍니다:

```yaml
spec:
  beSpec:
    configMaps:
    - configMapName: test-be1
      mountPath: /etc/be/config1
    - configMapName: test-be2
      mountPath: /etc/be/config2
```

위 구성에서 ${your_storageclass}는 사용할 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)의 이름이고, ${storageSize}는 사용할 스토리지 크기입니다. ${storageSize}의 형식은 K8s [수량 표현식](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)을 따르며, 예를 들어 100Gi로 지정합니다. 필요에 맞게 바꿉니다.

## 영구 스토리지 구성 {#configure-persistent-storage}

Doris 클러스터의 FE 및 BE 구성 요소는 데이터를 영구 저장해야 합니다. Kubernetes는 데이터를 물리적 스토리지에 영구 저장하기 위한 [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) 메커니즘을 제공합니다. Kubernetes 환경에서 Doris Operator는 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)를 사용하여 적합한 PersistentVolume에 바인딩되는 PersistentVolumeClaim을 자동으로 생성합니다.

### FE 영구 스토리지 구성 {#fe-persistent-storage-configuration}

Kubernetes에 Doris 클러스터를 배포할 때는 기본적으로 `/opt/apache-doris/fe/doris-meta` 마운트 지점의 데이터를 영구 저장하도록 구성하는 것이 좋습니다. 이 경로가 FE 메타데이터의 기본 저장 경로이기 때문입니다. Doris는 기본적으로 모든 로그 정보를 표준 출력(콘솔)으로 출력합니다. 클러스터에 로그 수집 기능이 없다면 로그를 영구 저장할 수 있도록 /opt/apache-doris/fe/log 마운트 지점의 데이터를 영구 저장하는 것이 좋습니다.

#### FE 메타데이터 영구 저장 {#fe-metadata-persistence}

기본 구성 파일을 사용하는 경우 [배포된 DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 내용을 추가합니다:

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

위 구성에서 ${your_storageclass}는 지정할 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)의 이름이고, ${storageSize}는 지정할 스토리지 크기입니다. 형식은 Kubernetes [수량 표현식](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)을 따르며, 예를 들어 100Gi로 지정합니다.

#### FE 로그 영구 저장 {#fe-log-persistence}

기본 구성 파일을 사용하는 경우 배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 내용을 추가합니다:

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

위 구성에서 ${your_storageclass}는 사용할 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)의 이름이고, ${storageSize}는 사용할 스토리지 크기입니다. ${storageSize}의 형식은 Kubernetes [수량 표현식](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)을 따르며, 예를 들어 100Gi로 지정합니다.

:::tip 팁
`meta_dir` 또는 `LOG_DIR`을 [사용자 지정 구성 파일](#fe-customized-startup-configuration)에서 다시 설정한 경우, 이에 맞게 `mountPath`도 다시 설정합니다.
:::

### BE 영구 스토리지 구성 {#be-persistent-storage-configuration}

Kubernetes에 Doris 클러스터를 배포할 때는 `/opt/apache-doris/be/storage` 마운트 지점의 데이터를 영구 저장하도록 구성하는 것이 좋습니다. 이 경로가 BE 노드의 기본 데이터 저장 경로이기 때문입니다. Kubernetes에 배포된 Doris는 기본적으로 모든 로그 정보를 표준 출력(콘솔)으로 출력합니다. 클러스터에 로그 수집 기능이 없다면 `/opt/apache-doris/be/log` 마운트 지점의 데이터를 영구 저장하는 것이 좋습니다.

#### BE 데이터 영구 저장 {#be-data-persistence}

- 기본 영구 스토리지 경로

  BE가 기본 구성을 사용하는 경우 [배포된 DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 내용을 추가합니다:
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

  위 구성에서 ${your_storageclass}는 사용할 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)의 이름이고, ${storageSize}는 사용할 스토리지 크기입니다. 형식은 Kubernetes [수량 표현식](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)을 따르며, 예를 들어 100Gi로 지정합니다.

- 여러 스토리지 경로의 데이터 영구 저장

  사용자 지정 구성에서 `storage_root_path`로 여러 스토리지 디렉터리를 지정한 경우(예: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD`), 배포된 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 구성을 추가합니다:

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
  
#### BE 로그 영구 저장 {#be-log-persistence}

기본 구성 파일을 사용하는 경우 배포할 [DorisCluster 리소스](install-doris-cluster.md#step-2-install-the-customized-deployment-template)에 다음 내용을 추가합니다:

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

위 구성에서 ${your_storageclass}는 사용할 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)의 이름이고, ${storageSize}는 사용할 스토리지 크기입니다. 형식은 Kubernetes [수량 표현식](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/)을 따르며, 예를 들어 100Gi로 지정합니다.

## 접근 구성 {#access-configuration}

Kubernetes는 Service를 사용하여 vip와 부하 분산 기능을 제공합니다. Service에는 외부 노출 모드로 `ClusterIP`, `NodePort`, `LoadBalancer`의 세 가지가 있습니다.

### ClusterIP {#clusterip}

Kubernetes의 Doris는 기본적으로 [ClusterIP 접근 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)를 사용합니다. ClusterIP 접근 모드는 Kubernetes 클러스터 내부에 주소를 제공하며, 이 주소는 Kubernetes 내에서 서비스에 접근하는 주소로 사용됩니다.

#### 1단계: Service 유형을 ClusterIP로 구성 {#step-1-configure-clusterip-as-the-service-type}

  Doris는 Kubernetes에서 기본적으로 ClusterIP 접근 모드를 활성화합니다. 별도로 수정하지 않고 이 모드를 사용할 수 있습니다.

#### 2단계: Service 접근 주소 확인 {#step-2-get-the-service-access-address}

클러스터를 배포한 후 다음 명령을 실행하여 Doris Operator가 노출하는 서비스를 확인합니다:

```shell
kubectl -n doris get svc
```

결과는 다음과 같습니다:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

위 결과에서 FE와 BE에는 각각 internal과 service 접미사가 붙은 두 유형의 Service가 있습니다:

internal 접미사가 붙은 Service는 하트비트 및 데이터 교환과 같은 Doris 내부 통신에만 사용되며 외부에 노출되지 않습니다.

service 접미사가 붙은 Service는 클러스터 서비스에 접근하는 데 사용됩니다.

#### 3단계: 컨테이너 내부에서 Doris에 접근 {#step-3-access-doris-inside-a-container}

다음 명령을 사용하여 현재 Kubernetes 클러스터에 MySQL 클라이언트가 포함된 Pod를 생성합니다:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

컨테이너 내부에서는 `service` 접미사가 붙은 Service 이름으로 접근하여 Doris 클러스터에 연결할 수 있습니다:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort {#nodeport}

Kubernetes 클러스터 외부에서 Doris에 접근하려면 [NodePort 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)를 선택할 수 있습니다. NodePort 모드는 정적 호스트 포트 매핑과 동적 호스트 포트 할당이라는 두 가지 구성 방법을 제공합니다.

- **동적 호스트 포트 할당**: 포트 매핑을 명시적으로 설정하지 않으면 Kubernetes는 Pod를 생성할 때 호스트에서 사용하지 않는 포트를 자동으로 할당합니다(기본 범위 30000-32767).

- **정적 호스트 포트 할당**: 포트 매핑을 명시적으로 지정하면 Kubernetes는 해당 호스트 포트가 사용 중이 아니고 충돌이 없을 때 그 고정 포트를 할당합니다.

정적 할당을 사용하려면 포트 매핑을 계획해야 합니다. Doris는 외부 상호 작용을 위해 다음 포트를 제공합니다:

| 포트 이름 | 기본 포트 | 포트 설명                     |
|------| ---- |--------------------------|
| 쿼리 포트 | 9030 | MySQL 프로토콜로 Doris 클러스터에 접근하는 데 사용 |
| HTTP 포트 | 8030 | FE 정보를 확인하는 데 사용하는 FE의 http 서버 포트 |
| 웹 서버 포트 | 8040 | BE 정보를 확인하는 데 사용하는 BE의 http 서버 포트 |


#### 1단계: FE 및 BE의 NodePort 구성 {#step-1-configure-nodeport-for-fe-and-be}

**FE NodePort**

- 동적 할당 구성:

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```

- 정적 할당 구성 예:

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

- 동적 할당 구성:

  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```

- 정적 할당 구성 예:

  ```yaml
  beSpec:
    service:
      type: NodePort
      servicePorts:
      - nodePort: 31006
        targetPort: 8040
  ```

#### 2단계: Service 확인 {#step-2-get-the-service}

클러스터를 배포한 후 다음 명령을 실행하여 `Service`를 확인합니다:

```shell
kubectl get service
```

결과는 다음과 같습니다:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### 3단계: NodePort로 Service에 접근 {#step-3-access-the-service-using-nodeport}

MySQL 연결을 예로 들어 보겠습니다. Doris의 기본 쿼리 포트는 9030입니다. 위 예에서는 포트 9030이 로컬 포트 31545에 매핑되어 있습니다. Doris 클러스터에 접근하려면 클러스터 노드의 IP 주소를 알아야 합니다. 다음 명령을 실행하여 확인합니다:

```shell
kubectl get nodes -owide
```

결과는 다음과 같습니다:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

NodePort 모드에서는 임의의 노드 IP 주소와 매핑된 호스트 포트를 통해 Kubernetes 클러스터 내부의 서비스에 접근할 수 있습니다. 이 예에서 사용 가능한 노드 IP는 192.168.88.61, 192.168.88.62, 192.168.88.63입니다. 다음 예는 노드 192.168.88.62와 호스트 포트 31545(`query port`에서 매핑)를 사용하여 Doris에 연결하는 방법을 보여 줍니다:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer {#loadbalancer}

[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)는 클라우드 서비스 제공업체가 제공하는 로드 밸런서입니다. 이 구성은 클라우드 플랫폼에서 제공하는 Kubernetes 환경에만 적용됩니다.

#### 1단계: LoadBalancer 모드 구성 {#step-1-configure-loadbalancer-mode}

**FE LoadBalancer 구성**

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
```

**BE LoadBalancer 구성**

  ```yaml
  spec:
    beSpec:
      service:
        type: LoadBalancer
  ```

#### 2단계: Service 확인 {#step-2-get-the-service-1}

클러스터를 배포한 후 다음 명령을 실행하면 `Service` 중 `Doris`에 접근할 수 있는 서비스를 확인할 수 있습니다:

```shell
kubectl get service
```

결과는 다음과 같습니다:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### 3단계: LoadBalancer 모드로 접근 {#step-3-access-in-loadbalancer-mode}

MySQL 연결을 예로 들면 다음과 같습니다:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## 관리자 사용자 이름 및 비밀번호 구성 {#configure-admin-username-and-password}

Doris 노드를 관리하려면 사용자 이름과 비밀번호를 사용하여 MySQL 프로토콜로 실행 중인 FE 노드에 연결해야 합니다. Doris는 [RBAC와 유사한 권한 관리 메커니즘](../../../admin-manual/auth/authentication-and-authorization)을 구현합니다. 노드를 관리하려면 사용자에게 [Node_priv](../../../admin-manual/auth/authentication-and-authorization#permission-types) 권한이 있어야 합니다. 기본적으로 Doris Operator는 모든 권한이 있고 비밀번호가 없는 root 사용자를 사용하여 DorisCluster 리소스에 구성된 클러스터를 배포하고 관리합니다. root 사용자에 비밀번호를 설정한 후에는 Doris Operator가 클러스터를 자동으로 관리할 수 있도록 DorisCluster 리소스에 Node_Priv 권한이 있는 사용자 이름과 비밀번호를 명시적으로 구성해야 합니다.

DorisCluster 리소스는 클러스터 노드를 관리하는 데 사용할 사용자 이름과 비밀번호를 구성하는 두 가지 방법을 제공합니다. 환경 변수로 구성하거나 [Secret](https://kubernetes.io/docs/concepts/configuration/secret/)으로 구성할 수 있습니다. 클러스터 관리자 사용자 이름과 비밀번호를 구성하는 시나리오는 다음 3가지입니다:

- 클러스터 배포 중 root 사용자 비밀번호를 초기화합니다.

- 비밀번호 없는 root 사용자로 배포할 때 관리자 권한이 있는 root 이외의 사용자를 자동으로 설정합니다.

- 비밀번호 없는 root 사용자로 클러스터를 배포한 후 root 사용자 비밀번호를 설정합니다.

### 클러스터 배포 중 root 사용자 비밀번호 구성 {#configure-the-root-user-password-during-cluster-deployment}

Doris는 `fe.conf`에 root 사용자 비밀번호를 암호화된 형태로 구성하는 기능을 지원합니다. Doris를 처음 배포할 때 root 사용자 비밀번호를 구성하면 Doris Operator가 클러스터 노드를 자동으로 관리할 수 있습니다. 다음 단계를 따릅니다:

#### 1단계: 암호화된 root 비밀번호 생성 {#step-1-build-the-encrypted-root-password}

Doris는 [FE 구성 파일](../../../admin-manual/config/fe-config#initial_root_password)에 root 사용자 비밀번호를 암호화된 형태로 설정하는 기능을 지원합니다. 비밀번호는 두 단계 SHA-1 암호화로 암호화됩니다. 코드 예는 다음과 같습니다:

Java 코드 구현:

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

Golang 코드 구현:

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

`fe.conf`에 구성 파일의 요구 사항에 따라 암호화된 비밀번호를 넣습니다. [클러스터 매개변수 구성 절](#fe-customized-startup-configuration)을 참고하여 구성 파일을 Kubernetes 클러스터에 `ConfigMap`으로 배포합니다.

#### 2단계: DorisCluster 리소스 작성 {#step-2-build-the-doriscluster-resource}

구성 파일에 root 초기 비밀번호를 설정하면 첫 번째 Doris FE 노드가 시작될 때 root 비밀번호가 즉시 적용됩니다. 이후 노드가 클러스터에 합류할 때 Doris Operator는 root 사용자 이름과 비밀번호를 사용하여 노드를 추가합니다. 따라서 Doris Operator가 클러스터 노드를 관리할 수 있도록 배포된 DorisCluster 리소스에 사용자 이름과 비밀번호를 지정해야 합니다.

- 환경 변수 방식

  DorisCluster 리소스의 ".spec.adminUser.name" 및 ".spec.adminUser.password" 필드에 root 사용자 이름과 비밀번호를 구성합니다. Doris Operator는 이를 컨테이너 환경 변수로 자동 변환하며, 컨테이너 내부의 보조 서비스는 이 환경 변수를 사용하여 클러스터에 노드를 추가합니다. 구성 형식은 다음과 같습니다:

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```

  여기서 `${password}`는 암호화하지 않은 root 비밀번호입니다.

- Secret 방식

  Doris Operator는 [기본 인증 Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret)을 사용하여 관리용 사용자 이름과 비밀번호를 지정하는 기능을 지원합니다. Doris Operator는 Secret을 컨테이너의 특정 위치에 파일로 자동 마운트합니다. 컨테이너의 보조 서비스는 파일에서 사용자 이름과 비밀번호를 읽고 이를 사용하여 클러스터에 노드를 자동으로 추가합니다. basic-authentication-secret의 stringData에는 username과 password의 2개 필드만 포함됩니다. Secret을 사용하여 관리용 사용자 이름과 비밀번호를 구성하는 절차는 다음과 같습니다:

  a. 사용할 Secret 구성

  사용할 기본 인증 Secret을 다음 형식으로 구성합니다:

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```

  여기서 `${password}`는 root에 설정한 암호화되지 않은 비밀번호입니다.
  다음 명령을 사용하여 업데이트한 Secret을 Kubernetes 클러스터에 배포합니다.
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  여기서 `${namespace}`는 DorisCluster 리소스를 배포할 네임스페이스이고, ${secretFileName}은 배포할 Secret의 파일 이름입니다.

  b. DorisCluster 리소스 구성

  배포할 DorisCluster 리소스에 사용할 Secret을 지정합니다. 구성은 다음과 같습니다:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  여기서 `${secretName}`은 root 사용자 이름과 비밀번호가 들어 있는 Secret의 이름입니다.

### 배포 중 root 이외의 관리자 사용자 및 비밀번호 자동 생성(권장) {#automatically-create-a-non-root-admin-user-and-password-during-deployment-recommended}

처음 배포할 때 root 초기 비밀번호를 설정하지 않는 경우, 환경 변수나 Secret으로 root 이외의 사용자와 로그인 비밀번호를 구성합니다. Doris 컨테이너의 보조 서비스는 Doris에 해당 사용자를 자동으로 생성하고 비밀번호를 설정한 후 Node_priv 권한을 부여합니다. 그러면 Doris Operator는 자동으로 생성된 사용자 이름과 비밀번호를 사용하여 클러스터 노드를 관리합니다.

- 환경 변수 방식

  배포할 DorisCluster 리소스를 다음 형식으로 구성합니다:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  여기서 `${DB_ADMIN_USER}`는 관리자 권한으로 새로 생성할 사용자 이름이고, `${DB_ADMIN_PASSWD}`는 새 사용자의 비밀번호입니다.

- Secret 방식

  a. 사용할 Secret 구성

  사용할 기본 인증 Secret을 다음 형식으로 구성합니다:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  여기서 `${DB_ADMIN_USER}`는 새로 생성할 사용자 이름이고, `${DB_ADMIN_PASSWD}`는 새 사용자 이름에 설정할 비밀번호입니다.

  다음 명령을 사용하여 Secret을 Kubernetes 클러스터에 배포합니다:

  ```
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  여기서 `${namespace}`는 DorisCluster 리소스가 배포된 네임스페이스이고, `${secretFileName}`은 배포할 Secret의 파일 이름입니다.

  b. DorisCluster 리소스 업데이트

  DorisCluster 리소스에 사용할 Secret을 다음과 같이 지정합니다:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  여기서 `${secretName}`은 배포된 기본 인증 Secret의 이름입니다.

:::tip 팁
- 배포 후 root 비밀번호를 설정합니다. Doris Operator는 새 사용자와 비밀번호를 사용하여 클러스터 노드를 관리하도록 전환합니다. 새로 생성된 사용자를 삭제하지 마세요.
:::

### 클러스터 배포 후 root 사용자 비밀번호 설정 {#set-the-root-user-password-after-cluster-deployment}

Doris 클러스터를 배포한 후 root 사용자에 비밀번호가 설정되어 있지 않다면, Doris Operator가 클러스터 노드를 자동으로 관리할 수 있도록 [Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#permission-types) 권한이 있는 사용자를 구성해야 합니다. root 사용자를 사용하지 않는 것이 좋습니다. [사용자 생성 및 권한 부여 절](../../../sql-manual/sql-statements/account-management/CREATE-USER)을 참고하여 새 사용자를 생성하고 Node_priv 권한을 부여합니다. 사용자를 생성한 후 환경 변수나 Secret으로 새 관리자 사용자와 비밀번호를 구성하고 DorisCluster 리소스에 설정합니다.

#### 1단계: Node_priv 권한이 있는 사용자 생성 {#step-1-create-a-user-with-node_priv-privilege}

MySQL 프로토콜로 데이터베이스에 연결한 후 다음 명령을 실행하여 Node_priv 권한만 가진 사용자를 생성하고 비밀번호를 설정합니다.

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

여기서 ${DB_ADMIN_USER}는 생성할 사용자 이름이고, ${DB_ADMIN_PASSWD}는 설정할 비밀번호입니다.

#### 2단계: 새 사용자에게 Node_priv 권한 부여 {#step-2-grant-node_priv-privilege-to-the-new-user}

MySQL 프로토콜로 데이터베이스에 연결한 후 다음 명령을 실행하여 새 사용자에게 Node_priv 권한을 부여합니다.

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

여기서 ${DB_ADMIN_USER}는 새로 생성한 사용자 이름입니다.

사용자 생성, 비밀번호 설정 및 권한 부여에 대한 자세한 내용은 공식 [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) 문서를 참고하세요.

#### 3단계: DorisCluster 리소스 구성 {#step-3-configure-the-doriscluster-resource}

- 환경 변수 방식

  DorisCluster 리소스에 새로 생성한 사용자와 비밀번호를 다음과 같이 구성합니다:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  여기서 ${DB_ADMIN_USER}는 새로 생성한 사용자 이름이고, ${DB_ADMIN_PASSWD}는 새 사용자에 설정한 비밀번호입니다.

- Secret 방식

  a. Secret 구성

  기본 인증 Secret을 다음 형식으로 생성합니다:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  여기서 ${DB_ADMIN_USER}는 새로 생성한 사용자 이름이고, ${DB_ADMIN_PASSWD}는 새 사용자 이름에 설정한 비밀번호입니다.

  다음 명령을 사용하여 Secret을 Kubernetes 클러스터에 배포합니다:

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  여기서 `${namespace}`는 DorisCluster 리소스가 배포된 네임스페이스이고, `${secretFileName}`은 배포할 Secret의 파일 이름입니다.

  b. Secret을 사용하는 DorisCluster 리소스 업데이트

  DorisCluster 리소스에 사용할 Secret을 다음과 같이 지정합니다:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  여기서 `${secretName}`은 배포된 기본 인증 Secret의 이름입니다.

:::tip 팁
- 배포 후 root 비밀번호를 설정하고 새 관리자 사용자 이름과 비밀번호를 구성하면 기존 서비스의 롤링 재시작이 한 번 실행됩니다.
:::

## 시작 구성 변경 사항을 적용하기 위한 서비스 자동 재시작 {#automatically-restart-service-to-apply-startup-configuration-changes}
Doris는 구성 파일로 시작 매개변수를 지정합니다. 대부분의 매개변수는 해당 웹 인터페이스에서 수정할 수 있으며 실시간으로 적용됩니다. 웹 인터페이스에서 수정할 수 없는 일부 매개변수는 서비스를 재시작해야 적용됩니다. Doris Operator는 25.1.0 버전부터 서비스를 자동으로 재시작하여 서비스 시작 매개변수의 변경 사항을 적용하는 기능을 제공합니다.
`DorisCluster` 리소스에서 다음과 같이 이 기능을 활성화합니다:
```yaml
spec:
  enableRestartWhenConfigChange: true
```
DorisCluster 리소스에 위 구성이 포함되어 있으면 Doris Operator는 다음과 같이 처리합니다:
1. `DorisCluster` 리소스로 배포한 클러스터가 사용하는 시작 구성(ConfigMap으로 마운트하며, 자세한 내용은 [사용자 지정 시작 구성 절](#customized-startup-configuration) 참고)이 변경되었는지 모니터링합니다.
2. 시작 구성이 변경되면 해당 서비스를 자동으로 재시작하여 구성을 적용합니다.

### 사용 예 {#usage-example}
ConfigMap 모니터링 및 재시작은 FE와 BE 노드 유형에서 지원됩니다. 다음은 FE를 예로 설명합니다.
1. DorisCluster 배포 사양은 다음과 같습니다:
    ```yaml
    spec:
      enableRestartWhenConfigChange: true
      feSpec:
        image: apache/doris:fe-2.1.8
        replicas: 1
        configMapInfo:
          configMapName: fe-configmap
    ```
2. `fe-configmap`에 지정된 FE 서비스 시작 구성을 업데이트합니다.
키가 `fe.conf`인 `fe-configmap`의 값(FE 서비스 시작 구성)을 업데이트하면 Doris Operator가 FE 서비스의 롤링 재시작을 자동으로 수행하여 구성을 적용합니다.

## Kerberos 인증 사용 {#use-kerberos-authentication}
Doris Operator는 25.2.0 버전부터 Kubernetes에서 Doris(2.1.9 및 3.0.4 이상 버전)의 Kerberos 인증을 지원합니다. Doris Kerberos 인증에는 [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html)와 [keytab 파일](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html)이 필요합니다.
Doris Operator는 `ConfigMap` 리소스를 사용하여 krb5.conf 파일을 마운트하고, `Secret` 리소스를 사용하여 keytab 파일을 마운트합니다. Kerberos 인증을 사용하는 절차는 다음과 같습니다:
1. krb5.conf 파일이 포함된 ConfigMap을 생성합니다:
    ```shell
    kubectl create -n ${namespace} create configmap ${name} --from-file=krb5.conf
    ```
   ${namespace}는 `DorisCluster`가 배포된 네임스페이스이고, ${name}은 ConfigMap에 지정할 이름입니다.
2. keytab이 포함된 Secret을 생성합니다:
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file= ${xxx.keytab}
    ```
   ${namespace}는 `DorisCluster`가 배포된 네임스페이스이고, ${name}은 Secret에 지정할 이름입니다. 여러 `keytab` 파일을 마운트하려면 [kubectl create Secret 문서](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)를 참고하여 여러 `keytab` 파일을 하나의 Secret에 넣습니다.
3. DorisCluster 리소스를 구성하고 `krb5.conf`가 포함된 ConfigMap과 `keytab` 파일이 포함된 Secret을 지정합니다.
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName}은 사용할 `krb5.conf` 파일이 포함된 ConfigMap의 이름입니다. ${keytabSecretName}은 keytab 파일이 포함된 Secret의 이름입니다. ${keytabPath}는 Secret이 컨테이너에 마운트되는 경로입니다. 이 경로는 Catalog를 생성할 때 `hadoop.kerberos.keytab`으로 지정하는 keytab 파일이 있는 디렉터리입니다. Catalog를 생성하는 방법은 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog.mdx#configure-catalog) 문서를 참고하세요.

## 공유 스토리지 구성 {#configure-shared-storage}
Doris Operator는 25.4.0 버전부터 `ReadWriteMany` 공유 스토리지를 여러 구성 요소의 모든 Pod에 마운트하는 기능을 지원합니다. 사용하기 전에 공유 스토리지의 `PersistentVolume` 및 `PersistentVolumeClaim` 리소스를 미리 생성합니다. Doris 클러스터를 배포하기 전에 `DorisCluster` 리소스를 다음과 같이 구성합니다:
```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- ${mountPath}는 컨테이너에 마운트할 절대 경로를 지정합니다.
- ${sharedPVCName}은 마운트할 `PersistentVolumeClaim`의 이름입니다.
- `supportComponents`는 이 공유 스토리지를 마운트해야 하는 구성 요소의 이름을 지정합니다. 위 예에서는 FE와 BE가 공유 스토리지를 마운트하도록 지정되어 있습니다. `supportComponents` 배열이 비어 있으면 배포된 모든 구성 요소가 공유 스토리지를 마운트합니다.

:::tip 팁
`mountPath`는 `${DORIS_HOME}`을 경로 접두사로 사용할 수 있습니다. `mountPath`가 `${DORIS_HOME}`을 접두사로 사용하면 FE 컨테이너에서 `${DORIS_HOME}`은 `/opt/apache-doris/fe`를 가리키고, BE 컨테이너에서 `${DORIS_HOME}`은 `/opt/apache-doris/be`를 가리킵니다.
:::

## 프로브 타임아웃 구성 {#configure-probe-timeouts}
`DorisCluster`는 각 서비스에 대해 시작 프로브 타임아웃과 활성 상태 프로브 타임아웃이라는 두 가지 프로브 타임아웃 구성을 제공합니다. 서비스 시작 시간이 구성된 시작 프로브 타임아웃을 초과하면 서비스 시작이 실패한 것으로 간주하고 서비스를 재시작합니다. 서비스가 활성 상태 프로브 타임아웃 내에 응답하지 않으면 Pod를 자동으로 재시작합니다.
### 시작 프로브 타임아웃 구성 {#startup-probe-timeout-configuration}
- FE 서비스 시작 프로브 타임아웃 구성
    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
  위 구성은 FE 시작 타임아웃을 3600초로 설정합니다.
- BE 서비스 시작 프로브 타임아웃 구성
    ```
    spec:
      beSpec:
        startTimeout: 3600
    ```
  위 구성은 BE 시작 타임아웃을 3600초로 설정합니다.
### 활성 상태 프로브 타임아웃 구성 {#liveness-probe-timeout-configuration}
- FE 서비스 활성 상태 프로브 타임아웃 구성
    ```
    spec:
      feSpec:
        liveTimeout: 60
    ```
  위 구성은 FE 활성 상태 타임아웃을 60초로 설정합니다.
- BE 서비스 활성 상태 프로브 타임아웃 구성
    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
  위 구성은 BE 활성 상태 타임아웃을 60초로 설정합니다.
