---
{
    "title": "Настройка FE",
    "language": "ru",
    "description": "Подробное руководство по настройке FE (FrontEnd) в кластере с разделением хранения и вычислений: вычислительные ресурсы, число узлов Follower, параметры запуска, режимы доступа (ClusterIP/NodePort/LoadBalancer) и постоянное хранилище.",
    "keywords": ["Doris", "storage-compute separation", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "persistent storage"]
}
---

## Что вы узнаете из этой главы {#what-you-will-learn-in-this-chapter}

- Как настроить вычислительные ресурсы (CPU и память) для компонента FE
- Как настроить число узлов FE Follower и разобраться в их ролях
- Как изменить параметры запуска FE с помощью ConfigMap
- Как выбрать режим доступа к сервису FE (ClusterIP/NodePort/LoadBalancer) в зависимости от сценария
- Как настроить постоянное хранилище для FE, чтобы избежать потери метаданных

## Обзор настроек {#configuration-overview}

В режиме разделения хранения и вычислений FE (Frontend) в основном отвечает за разбор и планирование запросов. В этой главе настройки FE рассматриваются в следующем порядке:

| Параметр настройки | Какую задачу решает |
| --- | --- |
| Настройка вычислительных ресурсов | Явное выделение CPU и памяти для FE |
| Настройка числа узлов Follower | Планирование узлов управления метаданными при распределённом развёртывании |
| Пользовательская конфигурация запуска | Переопределение параметров запуска по умолчанию через ConfigMap |
| Настройка режима доступа | Предоставление доступа к сервису FE в зависимости от сценария: изнутри кластера, извне или через облачную платформу |
| Настройка постоянного хранилища | Предотвращение потери метаданных после перезапуска FE |

## Настройка вычислительных ресурсов {#configure-compute-resources}

В [примере развёртывания](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) из репозитория Doris-Operator ресурсы FE по умолчанию не ограничены. Для рабочей среды рекомендуется явно задавать вычислительные ресурсы FE с помощью Kubernetes [requests и limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

Следующий пример выделяет FE вычислительные ресурсы 8c8Gi:

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

Примените эту конфигурацию к [ресурсу `DorisDisaggregatedCluster`, который собираетесь развернуть](./install-doris-cluster.md#2-modify-key-configurations).

### Куча JVM и память Pod {#fe-jvm-memory}

Параметр Kubernetes `requests.memory` влияет на размещение Pod, а `limits.memory` ограничивает общий объём памяти контейнера. Doris Operator не вычисляет размер кучи JVM для FE на основе этих значений. Куча, Metaspace, стеки потоков, прямая память и другие выделения нативной памяти должны укладываться в лимит контейнера.

Прежде чем уменьшать лимит памяти, скопируйте `fe.conf` из образа, который собираетесь развернуть, и измените оба параметра JVM: `-Xms` и `-Xmx`. Для образов с JDK 17 измените `JAVA_OPTS_FOR_JDK_17`, сохранив остальные параметры. Например, в ConfigMap ниже для кучи отведено 4 GiB при указанном выше лимите контейнера 8 GiB; для рабочей среды выбирайте размер кучи с учётом объёма метаданных и нагрузки. Подключите файл через `feSpec.configMaps`, как описано в разделе о пользовательской конфигурации запуска, затем перезапустите FE, чтобы применить изменения.

Если Kubernetes сообщает `OOMKilled`, сравните фактические параметры JVM с лимитом памяти Pod. При увеличении лимита оставляйте запас для памяти вне кучи; при уменьшении кучи не снижайте только `-Xmx`, сохраняя более высокое значение `-Xms`.

## Настройка числа узлов Follower {#configure-the-number-of-follower-nodes}

Сервис FE поддерживает две роли со следующими обязанностями:

| Роль | Обязанности |
| --- | --- |
| Follower | Обрабатывает разбор SQL, управляет метаданными и хранит их |
| Observer | Обрабатывает разбор SQL и разделяет с узлами Follower нагрузку по запросам и записи |

Doris использует систему хранения bdbje для управления метаданными. Внутренняя реализация bdbje похожа на алгоритм протокола Paxos. При распределённом развёртывании необходимо настроить несколько узлов Follower, которые будут совместно участвовать в управлении метаданными.

При развёртывании кластера Doris с разделением хранения и вычислений через ресурс `DorisDisaggregatedCluster` число узлов Follower по умолчанию равно 1. Его можно изменить с помощью поля `electionNumber`. В следующем примере число узлов Follower задано равным 3:

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip Подсказка

После развёртывания кластера с разделением хранения и вычислений значение `electionNumber` изменить нельзя. Спланируйте число узлов Follower до развёртывания.

:::

## Пользовательская конфигурация запуска {#custom-startup-configuration}

Doris Operator подключает конфигурацию запуска FE через Kubernetes ConfigMap. Настройка выполняется следующим образом:

### Шаг 1: Создайте ConfigMap с параметрами запуска FE {#step-1-write-the-fe-startup-configmap}

Определите ConfigMap с конфигурацией запуска FE, как показано ниже:

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
        JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx4096m -Xms4096m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
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

### Шаг 2: Разверните ConfigMap в целевом пространстве имён {#step-2-deploy-the-configmap-to-the-target-namespace}

Разверните ConfigMap в пространстве имён, где находится `DorisDisaggregatedCluster`, с помощью следующей команды:

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

Описание параметров:

- `${namespace}`: пространство имён, где находится `DorisDisaggregatedCluster`
- `${feConfigMapName}`: имя файла с приведённой выше конфигурацией

### Шаг 3: Укажите ConfigMap в DorisDisaggregatedCluster {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

Обновите [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations) и подключите ConfigMap через массив `feSpec.configMaps`, как показано ниже:

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip Подсказка

При настройке параметров запуска в Kubernetes учитывайте два требования:

1. **Не добавляйте** параметры `meta_service_endpoint` и `cluster_id`. Doris-Operator задаёт их автоматически.
2. **Обязательно** задайте `enable_fqdn_mode=true`.

:::

## Настройка доступа {#access-configuration}

Doris-Operator использует Kubernetes Service для предоставления виртуального IP-адреса (VIP) и балансировки нагрузки. В зависимости от сценария доступа можно выбрать один из трёх режимов предоставления сервиса:

| Режим доступа | Подходящий сценарий | Описание |
| --- | --- | --- |
| ClusterIP | Доступ только изнутри кластера Kubernetes | Режим по умолчанию; дополнительная настройка не требуется |
| NodePort | Доступ извне кластера Kubernetes (часто используется в самостоятельно развёрнутых кластерах) | Предоставляет доступ к сервису через порт узла |
| LoadBalancer | Доступ через облачный балансировщик нагрузки в среде облачной платформы | Балансировщик нагрузки предоставляет облачный провайдер |

Ниже описана настройка каждого режима.

### Режим ClusterIP {#clusterip-mode}

По умолчанию Kubernetes использует [режим ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). Он предоставляет внутренний адрес в кластере Kubernetes, доступный только изнутри кластера.

#### Шаг 1: Настройте ClusterIP {#step-1-configure-clusterip}

ClusterIP — режим доступа по умолчанию, поэтому **дополнительные изменения не требуются**.

#### Шаг 2: Получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развёртывания кластера просмотрите Services, предоставляемые FE, с помощью следующей команды:

```shell
kubectl -n doris get svc
```

Пример результата:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

В результате показаны два типа Service:

- С суффиксом `internal`: используется только для внутреннего взаимодействия компонентов Doris, например для проверки доступности и обмена данными; не предоставляется для внешнего доступа
- Без суффикса `internal`: используется для доступа к сервису FE

#### Шаг 3: Подключитесь к Doris из контейнера {#step-3-access-doris-from-inside-a-container}

Создайте Pod с клиентом MySQL в текущем кластере Kubernetes с помощью следующей команды:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Внутри контейнера подключитесь к кластеру Doris по имени Service без суффикса `internal`:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### Режим NodePort {#nodeport-mode}

Для доступа к Doris извне кластера Kubernetes используйте [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). Режим NodePort поддерживает два способа выделения портов:

| Способ выделения | Описание |
| --- | --- |
| Динамическое выделение порта узла | Если сопоставление портов явно не задано, Kubernetes автоматически назначает свободный порт узла (диапазон по умолчанию: 30000-32767) |
| Статическое выделение порта узла | Сопоставление портов задаётся явно. Указанный порт закрепляется, если он свободен и конфликтов нет |

Для статического выделения нужно спланировать сопоставление портов. По умолчанию Doris предоставляет следующие порты для внешнего взаимодействия:

**Таблица 1: Описание портов сервиса FE**

| Имя порта | Порт по умолчанию | Описание порта |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | Используется для доступа к кластеру Doris по протоколу MySQL |
| HTTP Port  | 8030    | Порт HTTP Server на FE, используемый для просмотра информации о FE |

#### Шаг 1: Настройте FE NodePort {#step-1-configure-fe-nodeport}

Выберите один из следующих вариантов в зависимости от потребностей:

- **Динамическое выделение портов**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **Статическое выделение портов**:

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

#### Шаг 2: Получите Service {#step-2-get-the-service}

После развёртывания кластера просмотрите `Service` с помощью следующей команды:

```shell
kubectl get service
```

Результат показан ниже:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Шаг 3: Подключитесь к Doris через NodePort {#step-3-access-doris-through-nodeport}

Рассмотрим подключение по MySQL. Предположим, что Query Port Doris сопоставлен с портом узла 31545. Выполните следующие действия:

1. Получите IP-адрес любого узла кластера Kubernetes:

    ```shell
    kubectl get nodes -owide
    ```

    Пример результата:

    ```shell
    NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
    r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    ```

2. Используйте IP-адрес любого узла (например, 192.168.88.62) и сопоставленный порт для подключения к кластеру Doris:

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### Режим LoadBalancer {#loadbalancer-mode}

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для сред Kubernetes на облачных платформах, где балансировщик нагрузки предоставляет облачный провайдер.

#### Шаг 1: Настройте режим LoadBalancer {#step-1-configure-loadbalancer-mode}

Установите тип `LoadBalancer` в `feSpec.service`:

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### Шаг 2: Получите Service {#step-2-get-the-service-1}

После развёртывания кластера просмотрите `Service` с помощью следующей команды:

```shell
kubectl get service
```

Пример результата:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Шаг 3: Подключитесь через LoadBalancer {#step-3-access-through-the-loadbalancer}

Рассмотрим подключение по MySQL. Предположим, что Query Port прослушивает порт 9030. Подключитесь к кластеру Doris с помощью следующей команды:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## Постоянное хранилище {#persistent-storage}

При [развёртывании по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) сервис FE использует Kubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) для хранения метаданных. Поскольку `EmptyDir` не обеспечивает постоянное хранение, **после перезапуска сервиса метаданные теряются**.

Чтобы метаданные FE не терялись после перезапуска, настройте для FE постоянное хранилище. Doris Operator предлагает три варианта; выберите подходящий:

| Вариант | Подходящий сценарий |
| --- | --- |
| Автоматическое создание по шаблону хранилища | Для журналов и метаданных используется одна конфигурация хранилища, что упрощает настройку |
| Пользовательская настройка точек монтирования | Для разных каталогов нужны разные параметры хранилища |
| Без постоянного хранения журналов | Журналы записываются только в стандартный вывод и не требуют постоянного хранения |

### Автоматическое создание по шаблону хранилища {#auto-generate-using-a-storage-template}

Настройте постоянное хранение журналов и метаданных по общему шаблону, как показано ниже:

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

После развёртывания кластера с этой конфигурацией:

- Doris Operator автоматически монтирует постоянное хранилище для каталога журналов (по умолчанию `/opt/apache-doris/fe/log`) и каталога метаданных (по умолчанию `/opt/apache-doris/fe/doris-meta`)
- Если каталог журналов или метаданных явно указан в [пользовательской конфигурации запуска](#custom-startup-configuration), Doris Operator автоматически определяет его и монтирует соответствующее хранилище
- Постоянное хранилище использует [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/). Нужный StorageClass можно указать через `storageClassName`

### Пользовательская настройка точек монтирования {#custom-mount-point-configuration}

Doris Operator позволяет настроить хранилище отдельно для каждого каталога. Например, с помощью пользовательской конфигурации хранилища можно подключить диск 300Gi для каталога журналов, а с помощью шаблона хранилища — диск 200Gi для каталога метаданных:

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

:::tip Подсказка

Если массив `mountPaths` пуст, конфигурация хранилища рассматривается как шаблонная: она применяется ко всем каталогам, для которых не задана отдельная конфигурация.

:::

### Без постоянного хранения журналов {#do-not-persist-logs}

Если журналы не нужно сохранять в постоянном хранилище, а достаточно выводить их в стандартный вывод, используйте следующую конфигурацию:

```yaml
spec:
    feSpec:
        logNotStore: true
```
