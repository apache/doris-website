---
{
    "title": "02 Настройка кластера Doris",
    "language": "ru",
    "description": "Руководство по настройке ресурса DorisCluster: образы, планирование реплик, выделение вычислительных ресурсов, постоянное хранение, настройка ConfigMap, режимы доступа через Service, управление именами пользователей и паролями.",
    "keywords": ["DorisCluster", "настройка ресурсов", "реплики", "ConfigMap", "постоянное хранение", "NodePort", "LoadBalancer", "ClusterIP", "настройка доступа", "совмещённое хранение и вычисления"]
}
---

## Планирование кластера {#cluster-planning}

В ресурсе `DorisCluster` по умолчанию могут использоваться не самые последние версии образов FE и BE. Для обоих компонентов по умолчанию задано 3 реплики. По умолчанию FE использует вычислительные ресурсы 6c 12Gi, а BE — 8c 16Gi. В следующих разделах описано, как изменить эти параметры в соответствии с вашими потребностями.

### Настройка образов {#image-settings}

Версия Doris Operator не привязана к версии Doris. Doris Operator поддерживает развёртывание Doris версии 2.0 и выше.

**Настройка образа FE**

Чтобы указать образ FE, задайте следующую конфигурацию:

```yaml
spec:
  feSpec:
    image: ${image}
```

Замените `${image}` именем образа для развёртывания, затем обновите конфигурацию в [ресурсе DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут. Можно использовать официальный [образ FE](https://hub.docker.com/r/apache/doris/tags?name=fe), предоставляемый Doris.

**Настройка образа BE**

Чтобы указать образ BE, задайте следующую конфигурацию:

```yaml
spec:
  beSpec:
    image: ${image}
```

Замените `${image}` именем образа для развёртывания, затем обновите конфигурацию в [ресурсе DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут. Можно использовать официальный [образ BE](https://hub.docker.com/r/apache/doris/tags?name=be), предоставляемый Doris.

### Настройка реплик {#replica-settings}

**Изменение числа реплик FE**

Чтобы изменить число реплик FE с 3 по умолчанию на 5, задайте следующую конфигурацию:

```yaml
spec:
  feSpec:
    replicas: 5
```

Обновите конфигурацию в [ресурсе DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут.

**Изменение числа реплик BE**

Чтобы изменить число реплик BE с 3 по умолчанию на 5, задайте следующую конфигурацию:

```yaml
spec:
  beSpec:
    replicas: 5
```

Обновите конфигурацию в [ресурсе DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут.

### Настройка вычислительных ресурсов {#compute-resource-settings}

**Настройка вычислительных ресурсов FE**

По умолчанию FE выделяются вычислительные ресурсы 6c 12Gi. Чтобы изменить их на 8c 16Gi, задайте следующую конфигурацию:

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

Обновите конфигурацию в [ресурсе DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут.

**Настройка вычислительных ресурсов BE**

По умолчанию BE выделяются вычислительные ресурсы 8c 16Gi. Чтобы изменить их на 16c 32Gi, задайте следующую конфигурацию:

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

Обновите конфигурацию в [ресурсе DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут.

:::tip Совет
Минимальные ресурсы, необходимые для запуска FE и BE, составляют 4c 8Gi. Для обычного тестирования возможностей рекомендуется 8c 8Gi.
:::

## Пользовательская конфигурация запуска {#customized-startup-configuration}

В Kubernetes Doris использует `ConfigMap`, чтобы отделить файлы конфигурации от сервисов. По умолчанию сервисы используют стандартную конфигурацию из образа в качестве параметров запуска. На основе [документации по конфигурации FE](../../../admin-manual/config/fe-config) и [документации по конфигурации BE](../../../admin-manual/config/be-config) заранее подготовьте пользовательские параметры запуска в отдельном `ConfigMap`. После настройки разверните его в пространстве имён, где находится целевой [ресурс `DorisCluster`](install-doris-cluster.md#step-2-install-the-customized-deployment-template).

### Пользовательская конфигурация запуска FE {#fe-customized-startup-configuration}

#### Шаг 1: Настройка и развёртывание ConfigMap {#step-1-configure-and-deploy-the-configmap}

В следующем примере определяется ConfigMap с именем `fe-conf`, который можно использовать для Doris FE:

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

При использовании ConfigMap для монтирования конфигурации запуска FE ключ конфигурации должен быть `fe.conf`. Подготовив файл конфигурации, разверните его в пространстве имён, в котором будет развёрнут ресурс `DorisCluster`, с помощью следующей команды.

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```

Здесь `${namespace}` — пространство имён, в котором будет развёрнут целевой ресурс `DorisCluster`, а ${feConfigMapFile} — имя файла, содержащего приведённую выше конфигурацию.

#### Шаг 2: Настройка ресурса DorisCluster {#step-2-configure-the-doriscluster-resource}

Для ConfigMap с именем fe-conf добавьте следующие сведения в [развёрнутый ресурс `DorisCluster`](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```

:::tip Совет
Для развёртывания в Kubernetes рекомендуется режим FQDN. Добавьте enable_fqdn_mode=true в конфигурацию запуска. Если вы хотите использовать режим IP и кластер Kubernetes может гарантировать, что IP-адрес pod не изменится после перезапуска, настройте запуск в режиме IP, следуя рекомендациям в обсуждении [#138](https://github.com/apache/doris-operator/issues/138).
:::

### Пользовательская конфигурация запуска BE {#be-customized-startup-configuration}

#### Шаг 1: Настройка и развёртывание ConfigMap {#step-1-configure-and-deploy-the-configmap-1}

Ниже определяется ConfigMap с именем `be-conf`, который можно использовать для Doris BE:

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

При использовании ConfigMap для монтирования конфигурации запуска BE ключ конфигурации должен быть `be.conf`. Подготовив файл конфигурации, разверните его в пространстве имён, в котором будет развёрнут целевой ресурс `DorisCluster`.

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```

Здесь `${namespace}` — пространство имён, в котором будет развёрнут ресурс `DorisCluster`, а ${beConfigMapFile} — имя файла, содержащего приведённую выше конфигурацию.

#### Шаг 2: Настройка ресурса DorisCluster {#step-2-configure-the-doriscluster-resource-1}

Для ConfigMap с именем be-conf добавьте следующие сведения в [развёрнутый ресурс `DorisCluster`](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

```yaml
spec:
  beSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```

:::tip Совет
Чтобы смонтировать файл в тот же каталог, что и конфигурацию запуска, поместите его конфигурацию в тот же ConfigMap, который содержит конфигурацию запуска. Ключ в ConfigMap задаёт имя файла, а значение — содержимое конфигурации.
:::

### Монтирование нескольких ConfigMap {#mounting-multiple-configmaps}

Помимо монтирования файлов конфигурации через ConfigMap, Doris Operator позволяет монтировать несколько ConfigMap в разные каталоги контейнера.

**Монтирование нескольких ConfigMap для FE**

В следующем примере показано, как смонтировать ConfigMap `test-fe1` и `test-fe2` в каталоги `/etc/fe/config1/` и `/etc/fe/config2` контейнера FE соответственно:

```yaml
spec:
  feSpec:
    configMaps:
    - configMapName: test-fe1
      mountPath: /etc/fe/config1
    - configMapName: test-fe2
      mountPath: /etc/fe/config2
```

В приведённой выше конфигурации ${your_storageclass} — имя [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), который вы хотите использовать, а ${storageSize} — требуемый размер хранилища. Формат ${storageSize} соответствует [выражению количества](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) в K8s, например: 100Gi. Замените эти значения по необходимости.

**Монтирование нескольких ConfigMap для BE**

В следующем примере показано, как смонтировать ConfigMap test-be1 и test-be2 в каталоги `/etc/be/config1/` и `/etc/be/config2` контейнера BE соответственно:

```yaml
spec:
  beSpec:
    configMaps:
    - configMapName: test-be1
      mountPath: /etc/be/config1
    - configMapName: test-be2
      mountPath: /etc/be/config2
```

В приведённой выше конфигурации ${your_storageclass} — имя [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), который вы хотите использовать, а ${storageSize} — требуемый размер хранилища. Формат ${storageSize} соответствует [выражению количества](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) в K8s, например: 100Gi. Замените эти значения по необходимости.

## Настройка постоянного хранения {#configure-persistent-storage}

В кластере Doris компонентам FE и BE необходимо постоянно хранить данные. Kubernetes предоставляет механизм [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) для сохранения данных в физическом хранилище. В среде Kubernetes Doris Operator использует [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) для автоматического создания PersistentVolumeClaim, который привязывается к подходящему PersistentVolume.

### Настройка постоянного хранения для FE {#fe-persistent-storage-configuration}

При развёртывании кластера Doris в Kubernetes рекомендуется настроить постоянное хранение для точки монтирования `/opt/apache-doris/fe/doris-meta`, поскольку этот путь по умолчанию используется для хранения метаданных FE. По умолчанию Doris выводит всю информацию журналов в стандартный вывод (консоль). Если в кластере нет средств сбора журналов, рекомендуется настроить постоянное хранение для точки монтирования /opt/apache-doris/fe/log, чтобы сохранять журналы.

#### Постоянное хранение метаданных FE {#fe-metadata-persistence}

При использовании файла конфигурации по умолчанию добавьте следующее содержимое в [развёрнутый ресурс DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

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

В приведённой выше конфигурации ${your_storageclass} — имя выбранного [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), а ${storageSize} — заданный размер хранилища. Формат соответствует [выражению количества](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) в Kubernetes, например: 100Gi.

#### Постоянное хранение журналов FE {#fe-log-persistence}

При использовании файла конфигурации по умолчанию добавьте следующее содержимое в [ресурс DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут:

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

В приведённой выше конфигурации ${your_storageclass} — имя [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), который вы хотите использовать, а ${storageSize} — требуемый размер хранилища. Формат ${storageSize} соответствует [выражению количества](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) в Kubernetes, например: 100Gi.

:::tip Совет
Если для `meta_dir` или `LOG_DIR` заданы другие значения в [пользовательском файле конфигурации](#fe-customized-startup-configuration), измените `mountPath` соответствующим образом.
:::

### Настройка постоянного хранения для BE {#be-persistent-storage-configuration}

При развёртывании кластера Doris в Kubernetes рекомендуется настроить постоянное хранение для точки монтирования `/opt/apache-doris/be/storage`, поскольку этот путь по умолчанию используется для хранения данных узлов BE. При развёртывании в Kubernetes Doris по умолчанию выводит всю информацию журналов в стандартный вывод (консоль). Если в кластере нет средств сбора журналов, рекомендуется настроить постоянное хранение для точки монтирования `/opt/apache-doris/be/log`.

#### Постоянное хранение данных BE {#be-data-persistence}

- Путь постоянного хранения по умолчанию

  Если BE использует конфигурацию по умолчанию, добавьте следующее содержимое в [развёрнутый ресурс DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template):
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

  В приведённой выше конфигурации ${your_storageclass} — имя [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), который вы хотите использовать, а ${storageSize} — требуемый размер хранилища. Формат соответствует [выражению количества](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) в Kubernetes, например: 100Gi.

- Постоянное хранение с несколькими путями

  Если в пользовательской конфигурации через `storage_root_path` указано несколько каталогов хранения (например, `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD`), добавьте следующую конфигурацию в развёрнутый [ресурс DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

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
  
#### Постоянное хранение журналов BE {#be-log-persistence}

При использовании файла конфигурации по умолчанию добавьте следующее содержимое в [ресурс DorisCluster](install-doris-cluster.md#step-2-install-the-customized-deployment-template), который будет развёрнут:

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

В приведённой выше конфигурации ${your_storageclass} — имя [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), который вы хотите использовать, а ${storageSize} — требуемый размер хранилища. Формат соответствует [выражению количества](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) в Kubernetes, например: 100Gi.

## Настройка доступа {#access-configuration}

Kubernetes использует Service для предоставления vip и балансировки нагрузки. Service поддерживает три режима предоставления доступа: `ClusterIP`, `NodePort` и `LoadBalancer`.

### ClusterIP {#clusterip}

По умолчанию Doris в Kubernetes использует [режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). Этот режим предоставляет внутренний адрес в кластере Kubernetes, который используется для доступа к сервису внутри Kubernetes.

#### Шаг 1: Настройка ClusterIP в качестве типа Service {#step-1-configure-clusterip-as-the-service-type}

  Doris по умолчанию включает режим доступа ClusterIP в Kubernetes. Этот режим можно использовать без дополнительных изменений.

#### Шаг 2: Получение адреса доступа к сервису {#step-2-get-the-service-access-address}

После развёртывания кластера выполните следующую команду, чтобы просмотреть сервисы, предоставляемые Doris Operator:

```shell
kubectl -n doris get svc
```

Результат будет следующим:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

В приведённом выше результате у FE и BE есть по два типа Service с суффиксами internal и service соответственно:

Service с суффиксом internal используются только для внутреннего взаимодействия в Doris, например для сигналов heartbeat и обмена данными, и не предоставляют внешний доступ.

Service с суффиксом service используются для доступа к сервисам кластера.

#### Шаг 3: Доступ к Doris из контейнера {#step-3-access-doris-inside-a-container}

Используйте следующую команду, чтобы создать Pod с клиентом MySQL в текущем кластере Kubernetes:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Внутри контейнера можно подключиться к кластеру Doris, обратившись к имени Service с суффиксом `service`:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort {#nodeport}

Для доступа к Doris извне кластера Kubernetes можно выбрать [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). Режим NodePort предоставляет два способа настройки: статическое сопоставление портов хоста и динамическое выделение портов хоста.

- **Динамическое выделение портов хоста**: если сопоставление портов не задано явно, при создании pod Kubernetes автоматически выделяет неиспользуемый порт на хосте (диапазон по умолчанию: 30000-32767).

- **Статическое выделение портов хоста**: если сопоставление портов задано явно, Kubernetes выделяет указанный фиксированный порт, если он не занят на хосте и конфликтов нет.

При статическом выделении необходимо заранее спланировать сопоставление портов. Doris предоставляет следующие порты для внешнего взаимодействия:

| Название порта | Порт по умолчанию | Описание порта                     |
|------| ---- |--------------------------|
| Порт запросов | 9030 | Используется для доступа к кластеру Doris по протоколу MySQL |
| Порт HTTP | 8030 | Порт HTTP-сервера на FE, используемый для просмотра информации о FE |
| Порт веб-сервера | 8040 | Порт HTTP-сервера на BE, используемый для просмотра информации о BE |


#### Шаг 1: Настройка NodePort для FE и BE {#step-1-configure-nodeport-for-fe-and-be}

**NodePort для FE**

- Конфигурация динамического выделения:

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```

- Пример конфигурации статического выделения:

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

**NodePort для BE**

- Конфигурация динамического выделения:

  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```

- Пример конфигурации статического выделения:

  ```yaml
  beSpec:
    service:
      type: NodePort
      servicePorts:
      - nodePort: 31006
        targetPort: 8040
  ```

#### Шаг 2: Получение Service {#step-2-get-the-service}

После развёртывания кластера выполните следующую команду для просмотра `Service`:

```shell
kubectl get service
```

Результат будет следующим:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### Шаг 3: Доступ к сервису через NodePort {#step-3-access-the-service-using-nodeport}

Рассмотрим подключение MySQL в качестве примера. По умолчанию Doris использует порт запросов 9030. В приведённом выше примере порт 9030 сопоставлен с локальным портом 31545. Для доступа к кластеру Doris необходимо получить IP-адрес узла кластера. Выполните следующую команду для его просмотра:

```shell
kubectl get nodes -owide
```

Результат будет следующим:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

В режиме NodePort можно обращаться к сервисам внутри кластера Kubernetes через IP-адрес любого узла и сопоставленный порт хоста. В этом примере доступны IP-адреса узлов 192.168.88.61, 192.168.88.62 и 192.168.88.63. Следующий пример показывает, как подключиться к Doris через узел 192.168.88.62 и порт хоста 31545, сопоставленный с `query port`:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer {#loadbalancer}

[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) — балансировщик нагрузки, предоставляемый поставщиком облачных услуг. Эта конфигурация применима только к средам Kubernetes, предоставляемым облачными платформами.

#### Шаг 1: Настройка режима LoadBalancer {#step-1-configure-loadbalancer-mode}

**Настройка LoadBalancer для FE**

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
```

**Настройка LoadBalancer для BE**

  ```yaml
  spec:
    beSpec:
      service:
        type: LoadBalancer
  ```

#### Шаг 2: Получение Service {#step-2-get-the-service-1}

После развёртывания кластера выполните следующую команду для просмотра `Service`, предоставляющего доступ к `Doris`:

```shell
kubectl get service
```

Результат будет следующим:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### Шаг 3: Доступ в режиме LoadBalancer {#step-3-access-in-loadbalancer-mode}

Рассмотрим подключение MySQL в качестве примера:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## Настройка имени пользователя и пароля администратора {#configure-admin-username-and-password}

Для управления узлами Doris необходимо подключиться к работающему узлу FE по протоколу MySQL с именем пользователя и паролем. В Doris реализован [механизм управления правами, подобный RBAC](../../../admin-manual/auth/authentication-and-authorization). Для управления узлами пользователь должен иметь право [Node_priv](../../../admin-manual/auth/authentication-and-authorization#permission-types). По умолчанию Doris Operator развёртывает кластер, заданный ресурсом DorisCluster, и управляет им с помощью пользователя root, у которого есть все права и не задан пароль. После установки пароля для пользователя root необходимо явно указать в ресурсе DorisCluster имя пользователя и пароль учётной записи с правом Node_Priv, чтобы Doris Operator мог автоматически управлять кластером.

Ресурс DorisCluster предоставляет два способа настройки имени пользователя и пароля для управления узлами кластера: через переменные окружения и через [Secret](https://kubernetes.io/docs/concepts/configuration/secret/). Есть 3 сценария настройки имени пользователя и пароля администратора кластера:

- Задать начальный пароль пользователя root при развёртывании кластера.

- При развёртывании с пользователем root без пароля автоматически создать пользователя с правами администратора, отличного от root.

- Установить пароль для пользователя root после развёртывания кластера с root без пароля.

### Настройка пароля пользователя root при развёртывании кластера {#configure-the-root-user-password-during-cluster-deployment}

Doris поддерживает настройку пароля пользователя root в зашифрованном виде в `fe.conf`. Задайте пароль пользователя root при первом развёртывании Doris, чтобы Doris Operator мог автоматически управлять узлами кластера. Выполните следующие шаги:

#### Шаг 1: Получение зашифрованного пароля root {#step-1-build-the-encrypted-root-password}

Doris поддерживает установку пароля пользователя root в зашифрованном виде в [файле конфигурации FE](../../../admin-manual/config/fe-config#initial_root_password). Пароль шифруется с помощью двухэтапного SHA-1. Ниже приведены примеры кода:

Реализация на Java:

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

Реализация на Golang:

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

Поместите зашифрованный пароль в `fe.conf` в соответствии с требованиями файла конфигурации. Следуя [разделу о настройке параметров кластера](#fe-customized-startup-configuration), передайте файл конфигурации в кластер Kubernetes в виде `ConfigMap`.

#### Шаг 2: Подготовка ресурса DorisCluster {#step-2-build-the-doriscluster-resource}

После того как начальный пароль root задан в файле конфигурации, он вступает в силу сразу при запуске первого узла Doris FE. При присоединении последующих узлов к кластеру Doris Operator использует имя пользователя root и его пароль для добавления узлов. Поэтому необходимо указать имя пользователя и пароль в развёртываемом ресурсе DorisCluster, чтобы Doris Operator мог управлять узлами кластера.

- Через переменные окружения

  Укажите имя пользователя root и пароль в полях ".spec.adminUser.name" и ".spec.adminUser.password" ресурса DorisCluster. Doris Operator автоматически преобразует их в переменные окружения контейнера, а вспомогательные сервисы внутри контейнера используют эти переменные для добавления узлов в кластер. Формат конфигурации:

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```

  Здесь `${password}` — незашифрованный пароль root.

- Через Secret

  Doris Operator поддерживает указание имени пользователя и пароля для управления с помощью [Secret для базовой аутентификации](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret). Doris Operator автоматически монтирует Secret как файл в определённое место в контейнере. Вспомогательные сервисы контейнера извлекают имя пользователя и пароль из файла и используют их для автоматического добавления узлов в кластер. В stringData объекта basic-authentication-secret содержится только 2 поля: username и password. Чтобы настроить имя пользователя и пароль для управления через Secret, выполните следующие действия:

  a. Настройте используемый Secret

  Настройте Secret для базовой аутентификации в следующем формате:

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```

  Здесь `${password}` — незашифрованный пароль, заданный для root.
  Разверните обновлённый Secret в кластере Kubernetes с помощью следующей команды.
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  Здесь `${namespace}` — пространство имён, в котором будет развёрнут ресурс DorisCluster, а ${secretFileName} — имя файла Secret для развёртывания.

  b. Настройте ресурс DorisCluster

  Укажите используемый Secret в ресурсе DorisCluster, который будет развёрнут. Конфигурация:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Здесь `${secretName}` — имя Secret, содержащего имя пользователя root и его пароль.

### Автоматическое создание пользователя администратора, отличного от root, и пароля при развёртывании (рекомендуется) {#automatically-create-a-non-root-admin-user-and-password-during-deployment-recommended}

При первом развёртывании, если вы не задаёте начальный пароль root, укажите пользователя, отличного от root, и пароль для входа через переменные окружения или Secret. Вспомогательный сервис в контейнере Doris автоматически создаст этого пользователя в Doris, установит пароль и предоставит право Node_priv. Затем Doris Operator будет использовать автоматически созданное имя пользователя и пароль для управления узлами кластера.

- Через переменные окружения

  Настройте ресурс DorisCluster для развёртывания в следующем формате:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  Здесь `${DB_ADMIN_USER}` — имя нового пользователя с правами администратора, а `${DB_ADMIN_PASSWD}` — пароль нового пользователя.

- Через Secret

  a. Настройте используемый Secret

  Настройте Secret для базовой аутентификации в следующем формате:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Здесь `${DB_ADMIN_USER}` — имя нового пользователя, а `${DB_ADMIN_PASSWD}` — пароль, заданный для нового пользователя.

  Используйте следующую команду для развёртывания Secret в кластере Kubernetes:

  ```
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  Здесь `${namespace}` — пространство имён, в котором развёрнут ресурс DorisCluster, а `${secretFileName}` — имя файла Secret для развёртывания.

  b. Обновите ресурс DorisCluster

  Укажите используемый Secret в ресурсе DorisCluster следующим образом:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Здесь `${secretName}` — имя развёрнутого Secret для базовой аутентификации.

:::tip Совет
- После развёртывания задайте пароль root. Doris Operator переключится на управление узлами кластера с помощью нового пользователя и пароля. Не удаляйте созданного пользователя.
:::

### Установка пароля пользователя root после развёртывания кластера {#set-the-root-user-password-after-cluster-deployment}

Если после развёртывания кластера Doris пароль пользователя root не задан, необходимо настроить пользователя с правом [Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#permission-types), чтобы Doris Operator мог автоматически управлять узлами кластера. Рекомендуется не использовать пользователя root. Создайте нового пользователя и предоставьте ему право Node_priv, следуя [разделу о создании пользователей и предоставлении прав](../../../sql-manual/sql-statements/account-management/CREATE-USER). После создания пользователя настройте имя нового администратора и пароль через переменные окружения или Secret и укажите их в ресурсе DorisCluster.

#### Шаг 1: Создание пользователя с правом Node_priv {#step-1-create-a-user-with-node_priv-privilege}

После подключения к базе данных по протоколу MySQL выполните следующую команду, чтобы создать пользователя только с правом Node_priv и задать пароль.

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

Здесь ${DB_ADMIN_USER} — имя создаваемого пользователя, а ${DB_ADMIN_PASSWD} — пароль, который нужно задать.

#### Шаг 2: Предоставление права Node_priv новому пользователю {#step-2-grant-node_priv-privilege-to-the-new-user}

После подключения к базе данных по протоколу MySQL выполните следующую команду, чтобы предоставить новому пользователю право Node_priv.

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

Здесь ${DB_ADMIN_USER} — имя созданного пользователя.

Подробнее о создании пользователей, установке паролей и предоставлении прав см. в официальной документации [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER).

#### Шаг 3: Настройка ресурса DorisCluster {#step-3-configure-the-doriscluster-resource}

- Через переменные окружения

  Укажите созданного пользователя и пароль в ресурсе DorisCluster следующим образом:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  Здесь ${DB_ADMIN_USER} — имя созданного пользователя, а ${DB_ADMIN_PASSWD} — пароль, заданный для нового пользователя.

- Через Secret

  a. Настройте Secret

  Создайте Secret для базовой аутентификации в следующем формате:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Здесь ${DB_ADMIN_USER} — имя созданного пользователя, а ${DB_ADMIN_PASSWD} — пароль, заданный для нового пользователя.

  Используйте следующую команду для развёртывания Secret в кластере Kubernetes:

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  Здесь `${namespace}` — пространство имён, в котором развёрнут ресурс DorisCluster, а `${secretFileName}` — имя файла Secret для развёртывания.

  b. Обновите ресурс DorisCluster, использующий Secret

  Укажите используемый Secret в ресурсе DorisCluster следующим образом:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Здесь `${secretName}` — имя развёрнутого Secret для базовой аутентификации.

:::tip Совет
- После развёртывания установка пароля root и настройка имени нового администратора и пароля вызовут один последовательный перезапуск существующих сервисов.
:::

## Автоматический перезапуск сервиса для применения изменений конфигурации запуска {#automatically-restart-service-to-apply-startup-configuration-changes}
Doris задаёт параметры запуска через файлы конфигурации. Большинство параметров можно изменить через соответствующий веб-интерфейс, и изменения вступят в силу в реальном времени. Для применения некоторых параметров, которые нельзя изменить через веб-интерфейс, требуется перезапуск сервиса. Начиная с версии 25.1.0, Doris Operator поддерживает автоматический перезапуск для применения изменений параметров запуска сервисов.
Включите эту возможность в ресурсе `DorisCluster` следующим образом:
```yaml
spec:
  enableRestartWhenConfigChange: true
```
Если ресурс DorisCluster содержит приведённую выше конфигурацию, Doris Operator действует следующим образом:
1. Отслеживает изменения конфигурации запуска, от которой зависит кластер, развёрнутый с помощью ресурса `DorisCluster` (конфигурация монтируется через ConfigMap; подробнее см. в [разделе «Пользовательская конфигурация запуска»](#customized-startup-configuration)).
2. После изменения конфигурации запуска автоматически перезапускает соответствующий сервис, чтобы конфигурация вступила в силу.

### Пример использования {#usage-example}
Отслеживание ConfigMap и перезапуск поддерживаются для узлов FE и BE. Ниже приведён пример для FE.
1. Спецификация развёртывания DorisCluster выглядит следующим образом:
    ```yaml
    spec:
      enableRestartWhenConfigChange: true
      feSpec:
        image: apache/doris:fe-2.1.8
        replicas: 1
        configMapInfo:
          configMapName: fe-configmap
    ```
2. Обновите конфигурацию запуска сервиса FE, указанную в `fe-configmap`.
После обновления значения с ключом `fe.conf` в `fe-configmap` (конфигурации запуска сервиса FE) Doris Operator автоматически выполнит последовательный перезапуск сервиса FE, чтобы конфигурация вступила в силу.

## Использование аутентификации Kerberos {#use-kerberos-authentication}
Начиная с версии 25.2.0, Doris Operator поддерживает аутентификацию Kerberos для Doris (версий 2.1.9 и 3.0.4 и выше) в Kubernetes. Для аутентификации Kerberos в Doris требуются [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) и [файл keytab](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html).
Doris Operator использует ресурс `ConfigMap` для монтирования файла krb5.conf и ресурс `Secret` для монтирования файла keytab. Чтобы использовать аутентификацию Kerberos, выполните следующие действия:
1. Создайте ConfigMap, содержащий файл krb5.conf:
    ```shell
    kubectl create -n ${namespace} create configmap ${name} --from-file=krb5.conf
    ```
   ${namespace} — пространство имён, в котором развёрнут `DorisCluster`, а ${name} — желаемое имя ConfigMap.
2. Создайте Secret, содержащий keytab:
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file= ${xxx.keytab}
    ```
   ${namespace} — пространство имён, в котором развёрнут `DorisCluster`, а ${name} — желаемое имя Secret. Чтобы смонтировать несколько файлов `keytab`, следуйте [документации kubectl create Secret](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/) и поместите несколько файлов `keytab` в один Secret.
3. Настройте ресурс DorisCluster и укажите ConfigMap, содержащий `krb5.conf`, и Secret, содержащий файл `keytab`.
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName} — имя ConfigMap, содержащего используемый файл `krb5.conf`. ${keytabSecretName} — имя Secret, содержащего файл keytab. ${keytabPath} — путь монтирования Secret в контейнере. Это каталог, в котором находится файл keytab и который указывается в `hadoop.kerberos.keytab` при создании Catalog. О создании Catalog см. в документации [Hive Catalog](../../../lakehouse/catalogs/hive-catalog.mdx#configure-catalog).

## Настройка общего хранилища {#configure-shared-storage}
Начиная с версии 25.4.0, Doris Operator поддерживает монтирование общего хранилища `ReadWriteMany` во все Pod нескольких компонентов. Перед использованием заранее создайте ресурсы `PersistentVolume` и `PersistentVolumeClaim` для общего хранилища. Перед развёртыванием кластера Doris настройте ресурс `DorisCluster` следующим образом:
```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- ${mountPath} задаёт абсолютный путь монтирования в контейнере.
- ${sharedPVCName} — имя монтируемого `PersistentVolumeClaim`.
- `supportComponents` задаёт имена компонентов, которым необходимо смонтировать это общее хранилище. В приведённом выше примере монтирование общего хранилища задано для FE и BE. Если массив `supportComponents` пуст, общее хранилище монтируется во все развёрнутые компоненты.

:::tip Совет
`mountPath` поддерживает использование `${DORIS_HOME}` в качестве префикса пути. Когда `mountPath` использует `${DORIS_HOME}` в качестве префикса, в контейнере FE `${DORIS_HOME}` обозначает `/opt/apache-doris/fe`, а в контейнере BE `${DORIS_HOME}` обозначает `/opt/apache-doris/be`.
:::

## Настройка тайм-аутов проверок {#configure-probe-timeouts}
`DorisCluster` предоставляет два параметра тайм-аута проверок для каждого сервиса: тайм-аут проверки запуска (startup probe) и тайм-аут проверки работоспособности (liveness probe). Если время запуска сервиса превышает заданный тайм-аут проверки запуска, считается, что сервис не смог запуститься, и он перезапускается. Если сервис не отвечает в течение тайм-аута проверки работоспособности, Pod автоматически перезапускается.
### Настройка тайм-аута проверки запуска {#startup-probe-timeout-configuration}
- Настройка тайм-аута проверки запуска сервиса FE
    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
  Приведённая выше конфигурация задаёт тайм-аут запуска FE равным 3600 секундам.
- Настройка тайм-аута проверки запуска сервиса BE
    ```
    spec:
      beSpec:
        startTimeout: 3600
    ```
  Приведённая выше конфигурация задаёт тайм-аут запуска BE равным 3600 секундам.
### Настройка тайм-аута проверки работоспособности {#liveness-probe-timeout-configuration}
- Настройка тайм-аута проверки работоспособности сервиса FE
    ```
    spec:
      feSpec:
        liveTimeout: 60
    ```
  Приведённая выше конфигурация задаёт тайм-аут проверки работоспособности FE равным 60 секундам.
- Настройка тайм-аута проверки работоспособности сервиса BE
    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
  Приведённая выше конфигурация задаёт тайм-аут проверки работоспособности BE равным 60 секундам.
