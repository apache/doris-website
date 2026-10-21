---
{
    "title": "Настройка вычислительных групп",
    "language": "ru",
    "description": "Подробное руководство по настройке вычислительных групп, включая настройку реплик, нескольких вычислительных групп, ресурсов, режимов доступа, параметров запуска и постоянного хранилища.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Вычислительная группа — это набор узлов BE, выполняющих одну и ту же задачу. В этом документе описана настройка вычислительных групп в ресурсе `DorisDisaggregatedCluster` для различных сценариев использования. Рассматриваются следующие основные темы:

- **Базовое развёртывание**: быстрое создание одной или нескольких вычислительных групп
- **Управление ресурсами**: ограничение вычислительных ресурсов, таких как CPU и память
- **Управление доступом**: различные способы доступа к службам BE изнутри и извне кластера
- **Настройка запуска**: настройка параметров запуска BE через ConfigMap
- **Постоянное хранение данных**: постоянное хранилище для кэша, журналов и промежуточных данных StreamLoad

## Сценарий 1: Быстрое создание одной вычислительной группы {#scenario-1-quickly-set-up-a-single-compute-group}

### Минимальная конфигурация {#minimal-configuration}

Простейшая конфигурация вычислительной группы содержит всего 3 поля:

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### Описание полей {#field-descriptions}

| Поле | Описание |
|------|------|
| `uniqueId` | Уникальный идентификатор вычислительной группы, который также служит её именем. После задания его нельзя изменить. Имя должно соответствовать шаблону `[a-zA-Z][0-9a-zA-Z_]+` |
| `image` | Адрес образа для развёртывания службы BE. Используйте образы из [официального реестра образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `replicas` | Количество узлов службы BE в вычислительной группе |

## Сценарий 2: Развёртывание нескольких вычислительных групп для изоляции бизнес-задач {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

Ресурс `DorisDisaggregatedCluster` поддерживает развёртывание нескольких вычислительных групп, каждая из которых независима от остальных. В следующем примере показана конфигурация для развёртывания двух вычислительных групп с именами `cg1` и `cg2`:

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

Количество реплик в каждой вычислительной группе указано ниже:

| Имя вычислительной группы | Количество реплик |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

Здесь `${beImage}` обозначает образ службы BE для развёртывания.

:::tip Совет
Хотя вычислительные группы независимы друг от друга, рекомендуется использовать одинаковые образы службы BE во всех вычислительных группах одного кластера с разделением хранения и вычислений.
:::

## Сценарий 3: Ограничение вычислительных ресурсов вычислительной группы {#scenario-3-limit-the-compute-resources-of-a-compute-group}

В [примере развёртывания по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) для архитектуры с разделением хранения и вычислений ресурсы, используемые службой BE, не ограничены. `DorisDisaggregatedCluster` использует [resources.requests и resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) Kubernetes для задания ресурсов CPU и памяти.

Например, чтобы выделить BE в вычислительной группе с именем `cg1` ресурсы 8c 8Gi:

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

Чтобы эта конфигурация вступила в силу, внесите её в развёртываемый [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations).

## Сценарий 4: Настройка способа доступа к вычислительной группе {#scenario-4-configure-the-access-method-of-a-compute-group}

По умолчанию вычислительная группа не предоставляет прямой доступ к службам извне. Doris Operator предоставляет Service в ресурсе `DorisDisaggregatedCluster` в качестве прокси для доступа к вычислительной группе. Service поддерживает три режима предоставления доступа. Выберите подходящий режим в зависимости от того, откуда выполняется доступ:

| Режим доступа | Сценарий использования | Особенности |
|------|------|------|
| `ClusterIP` | Доступ изнутри кластера Kubernetes | Режим по умолчанию, предоставляющий внутренний адрес кластера |
| `NodePort` | Доступ извне самостоятельно управляемого кластера Kubernetes | Предоставляет доступ к службам через порты хоста |
| `LoadBalancer` | Доступ извне кластера Kubernetes на облачной платформе | Использует балансировщик нагрузки, предоставляемый облачным провайдером |

### 4.1 ClusterIP (доступ внутри кластера) {#41-clusterip-access-within-the-cluster}

[Режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) предоставляет внутренний адрес в кластере Kubernetes, который служит точкой входа для доступа к службе внутри Kubernetes.

#### Шаг 1: Настройка ClusterIP в качестве типа Service {#step-1-configure-clusterip-as-the-service-type}

В Kubernetes Doris использует режим доступа ClusterIP по умолчанию. Он доступен без дополнительной настройки.

#### Шаг 2: Получение адреса доступа к Service {#step-2-get-the-service-access-address}

После развёртывания кластера выполните следующую команду, чтобы просмотреть Service, предоставляемый вычислительной группой:

```shell
kubectl -n doris get svc
```

Результат выглядит следующим образом:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

В приведённом выше результате показан доступный извне Service для вычислительной группы с `uniqueId` `cg1` в пространстве имён `doris`.

### 4.2 NodePort (внешний доступ для самостоятельно управляемых кластеров) {#42-nodeport-external-access-for-self-managed-clusters}

Для доступа к Doris извне кластера Kubernetes выберите [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). Режим NodePort предоставляет два способа назначения портов:

| Способ назначения | Описание |
|------|------|
| Динамическое назначение порта хоста | Если сопоставление портов не задано явно, при создании Pod Kubernetes автоматически назначает свободный порт хоста (диапазон по умолчанию: 30000-32767) |
| Статическое назначение порта хоста | Если сопоставление портов задано явно, Kubernetes назначает указанный фиксированный порт при условии, что порт хоста свободен и конфликтов нет |

Для статического назначения необходимо заранее спланировать сопоставление портов. Doris предоставляет следующие порты для взаимодействия с внешними системами:

**Таблица 1: Описание портов службы BE**

| Название порта | Порт по умолчанию | Описание порта |
|------|------|------|
| Порт веб-сервера | 8040 | Порт HTTP-сервера на BE, используемый для просмотра информации о BE |

#### Настройка статического назначения {#static-allocation-configuration}

В следующем примере порт 8040 на BE в вычислительной группе с именем `cg1` сопоставляется с портом 31012 на хосте:

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

#### Настройка динамического назначения {#dynamic-allocation-configuration}

Конфигурация вычислительной группы с именем `cg1` для использования режима доступа NodePort с динамическим назначением порта выглядит следующим образом:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer (внешний доступ в облачных средах) {#43-loadbalancer-external-access-in-cloud-environments}

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для сред Kubernetes на облачных платформах и использует балансировщик нагрузки, предоставляемый облачным провайдером. Задайте тип `LoadBalancer` в `computeGroup.service`, как показано ниже:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## Сценарий 5: Настройка конфигурации запуска BE {#scenario-5-customize-the-be-startup-configuration}

При развёртывании по умолчанию служба BE каждой вычислительной группы запускается с файлом конфигурации по умолчанию из образа. Doris Operator использует ConfigMap Kubernetes для монтирования пользовательских файлов конфигурации запуска. Общая последовательность действий выглядит следующим образом:

| Этап | Описание |
|------|------|
| Входные данные | Пользовательский файл конфигурации `be.conf` |
| Действие | Создание ConfigMap и его монтирование в каталог `/etc/doris` |
| Результат | Служба BE вычислительной группы запускается с пользовательской конфигурацией |

### Шаг 1: Создание ConfigMap с параметрами запуска {#step-1-create-a-configmap-that-contains-the-startup-information}

Ниже приведён пример ConfigMap, который можно использовать для службы BE:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
    file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
    deploy_mode = cloud
```

:::tip Совет
В конфигурации запуска службы BE в кластере с разделением хранения и вычислений необходимо задать `file_cache_path`. Описание формата см. в разделе [Настройка `be.conf` при разделении хранения и вычислений](../../deploy-manually/separating-storage-compute-deploy-manually).
:::

### Шаг 2: Развёртывание ConfigMap {#step-2-deploy-the-configmap}

Выполните следующую команду, чтобы развернуть ConfigMap с пользовательской конфигурацией запуска в кластере Kubernetes:

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

Описание параметров:

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имён, в котором развёрнут `DorisDisaggregatedCluster` |
| `${beConfigMapFileName}` | Имя файла, содержащего пользовательский ConfigMap |

### Шаг 3: Обновление ресурса DorisDisaggregatedCluster {#step-3-update-the-dorisdisaggregatedcluster-resource}

Обновите [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations), чтобы смонтировать ConfigMap. Конфигурация выглядит следующим образом:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip Совет
Конфигурацию запуска необходимо смонтировать в каталог `/etc/doris`.
:::

## Сценарий 6: Настройка постоянного хранилища для вычислительной группы {#scenario-6-configure-persistent-storage-for-a-compute-group}

При развёртывании по умолчанию служба BE использует [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) Kubernetes для хранения кэша службы. Режим `EmptyDir` не обеспечивает постоянного хранения данных. После перезапуска службы кэшированные данные теряются, что снижает эффективность выполнения запросов.

Чтобы служба BE не теряла кэшированные данные после перезапуска и эффективность выполнения запросов не снижалась, необходимо настроить постоянное хранение кэшированных данных. Основные пути хранения, используемые службой BE, перечислены ниже:

| Путь хранения | Назначение |
|------|------|
| Каталог журналов BE | Журналы службы BE выводятся в стандартный поток вывода, а также записываются в каталог, указанный в параметре `LOG_DIR` конфигурации запуска |
| `/opt/apache-doris/be/storage` | Место промежуточного хранения данных при импорте в режиме StreamLoad, позволяющее предотвратить потерю промежуточных данных после аварийного перезапуска службы |
| Каталог кэша BE | Кэш запросов. Потеря данных после перезапуска снижает эффективность выполнения запросов |

### 6.1 Пример постоянного хранилища {#61-persistent-storage-example}

Ниже приведён пример конфигурации монтирования постоянного хранилища для данных, которые необходимо сохранять:

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

Описание приведённой выше конфигурации:

- Для каталога журналов используется пользовательская конфигурация хранилища и монтируется диск объёмом 300Gi
- Для каталога, используемого для WAL и импорта StreamLoad, настроено монтирование диска объёмом 300Gi
- Для каталога кэша используется шаблон хранилища и монтируется диск объёмом 500Gi

:::tip Совет
Если массив `mountPaths` пуст, текущая конфигурация хранилища рассматривается как шаблон.
:::

### 6.2 Отключение постоянного хранения журналов {#62-do-not-persist-logs}

Если вы не хотите сохранять журналы и планируете выводить их только в стандартный поток вывода, используйте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
