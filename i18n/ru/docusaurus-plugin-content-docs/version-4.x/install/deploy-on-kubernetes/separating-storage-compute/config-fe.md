---
{
    "title": "Настройка FE",
    "language": "ru",
    "description": "Подробное руководство по настройке FE (FrontEnd) в кластере с разделением хранения и вычислений: вычислительные ресурсы, количество узлов Follower, параметры запуска, режимы доступа (ClusterIP/NodePort/LoadBalancer) и постоянное хранилище.",
    "keywords": ["Doris", "разделение хранения и вычислений", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "постоянное хранилище"]
}
---

## Что вы узнаете из этой главы {#what-you-will-learn-in-this-chapter}

- Как настроить вычислительные ресурсы (CPU и память) для компонента FE
- Как задать количество узлов FE с ролью Follower и разобраться в их назначении
- Как изменить параметры запуска FE с помощью ConfigMap
- Как выбрать режим доступа к сервису FE (ClusterIP/NodePort/LoadBalancer) в зависимости от сценария
- Как настроить постоянное хранилище для FE, чтобы предотвратить потерю метаданных

## Обзор настроек {#configuration-overview}

В режиме разделения хранения и вычислений FE (Frontend) в основном отвечает за разбор и планирование запросов. В этой главе настройки FE рассматриваются в следующем порядке:

| Настройка | Какую задачу решает |
| --- | --- |
| Настройка вычислительных ресурсов | Явное выделение CPU и памяти для FE |
| Настройка количества узлов Follower | Планирование узлов управления метаданными при распределённом развертывании |
| Изменение конфигурации запуска | Переопределение параметров запуска по умолчанию через ConfigMap |
| Настройка режима доступа | Предоставление доступа к сервису FE в зависимости от сценария: изнутри кластера, извне или через облачную платформу |
| Настройка постоянного хранилища | Предотвращение потери метаданных после перезапуска FE |

## Настройка вычислительных ресурсов {#configure-compute-resources}

В [примере развертывания](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) из репозитория Doris-Operator ограничения ресурсов для FE по умолчанию не заданы. Для рабочей среды рекомендуется явно настроить вычислительные ресурсы FE с помощью Kubernetes [requests и limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

В следующем примере для FE выделяются вычислительные ресурсы 8c8Gi:

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

Параметр Kubernetes `requests.memory` влияет на размещение Pod, а `limits.memory` ограничивает общий объём памяти контейнера. Doris Operator не вычисляет размер кучи JVM для FE на основе этих значений. Куча, Metaspace, стеки потоков, прямая память и другие области нативной памяти должны укладываться в лимит контейнера.

Перед снижением лимита памяти скопируйте `fe.conf` из образа, который будете развертывать, и скорректируйте в параметрах JVM оба значения: `-Xms` и `-Xmx`. Для образов с JDK 17 измените `JAVA_OPTS_FOR_JDK_17`, сохранив остальные параметры. Например, ConfigMap ниже задаёт кучу размером 4 GiB при указанном выше лимите контейнера 8 GiB. В рабочей среде подбирайте размер кучи с учётом объёма метаданных и нагрузки. Подключите файл через `feSpec.configMaps`, как описано в разделе «Изменение конфигурации запуска», затем перезапустите FE, чтобы применить изменения.

Если Kubernetes сообщает `OOMKilled`, сопоставьте действующие параметры JVM с лимитом памяти Pod. При увеличении лимита оставляйте место для памяти вне кучи. При уменьшении кучи не снижайте только `-Xmx`, оставляя более высокое значение `-Xms`.

## Настройка количества узлов Follower {#configure-the-number-of-follower-nodes}

У сервиса FE есть две роли со следующими обязанностями:

| Роль | Обязанности |
| --- | --- |
| Follower | Разбирает SQL, управляет метаданными и хранит их |
| Observer | Разбирает SQL и разделяет с узлами Follower нагрузку от запросов и операций записи |

Doris использует систему хранения bdbje для управления метаданными. В основе реализации bdbje лежит алгоритм, похожий на протокол Paxos. При распределённом развертывании необходимо настроить несколько узлов Follower для совместного управления метаданными.

При развертывании кластера Doris с разделением хранения и вычислений через ресурс `DorisDisaggregatedCluster` количество узлов Follower по умолчанию равно 1. Его можно изменить с помощью поля `electionNumber`. В следующем примере количество узлов Follower устанавливается равным 3:

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip Подсказка

После развертывания кластера с разделением хранения и вычислений значение `electionNumber` изменить нельзя. Запланируйте количество узлов Follower до развертывания.

:::

## Изменение конфигурации запуска {#custom-startup-configuration}

Doris Operator подключает конфигурацию запуска FE через Kubernetes ConfigMap. Выполните следующие действия:

### Шаг 1: создайте ConfigMap с конфигурацией запуска FE {#step-1-write-the-fe-startup-configmap}

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

### Шаг 2: разверните ConfigMap в нужном пространстве имён {#step-2-deploy-the-configmap-to-the-target-namespace}

Разверните ConfigMap в пространстве имён, где находится `DorisDisaggregatedCluster`, с помощью следующей команды:

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

Параметры команды:

- `${namespace}`: пространство имён, где находится `DorisDisaggregatedCluster`
- `${feConfigMapName}`: имя файла с приведённой выше конфигурацией

### Шаг 3: укажите ConfigMap в DorisDisaggregatedCluster {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

Обновите [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations) и подключите ConfigMap через массив `feSpec.configMaps`, как показано ниже:

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip Подсказка

При изменении конфигурации запуска в Kubernetes учитывайте два требования:

1. **Не добавляйте** параметры `meta_service_endpoint` и `cluster_id`. Doris-Operator задаёт их автоматически.
2. **Обязательно задайте** `enable_fqdn_mode=true`.

:::

## Настройка доступа {#access-configuration}

Doris-Operator использует Kubernetes Service для предоставления VIP и балансировки нагрузки. В зависимости от сценария доступа можно выбрать один из трёх режимов предоставления сервиса:

| Режим доступа | Сценарий применения | Описание |
| --- | --- | --- |
| ClusterIP | Доступ только изнутри кластера Kubernetes | Режим по умолчанию; дополнительная настройка не требуется |
| NodePort | Доступ извне кластера Kubernetes (часто используется в самостоятельно развёрнутых кластерах) | Сервис доступен через порт узла |
| LoadBalancer | Доступ через облачный балансировщик нагрузки | Балансировщик нагрузки предоставляет облачный провайдер |

Ниже описана настройка каждого режима.

### Режим ClusterIP {#clusterip-mode}

По умолчанию Kubernetes использует [режим ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). В этом режиме сервис получает внутренний адрес, доступный только из кластера Kubernetes.

#### Шаг 1: настройте ClusterIP {#step-1-configure-clusterip}

ClusterIP — режим доступа по умолчанию; для его использования **не требуется никаких дополнительных изменений**.

#### Шаг 2: получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развертывания кластера просмотрите Services, предоставляемые FE, с помощью следующей команды:

```shell
kubectl -n doris get svc
```

Пример результата:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

Результат содержит два вида Services:

- С суффиксом `internal`: используются только для внутреннего обмена данными Doris, например для проверки состояния и передачи данных; извне недоступны
- Без суффикса `internal`: используются для внешнего доступа к сервису FE

#### Шаг 3: подключитесь к Doris из контейнера {#step-3-access-doris-from-inside-a-container}

Создайте Pod с клиентом MySQL в текущем кластере Kubernetes с помощью следующей команды:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Внутри контейнера подключитесь к кластеру Doris по имени Service без суффикса `internal`:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### Режим NodePort {#nodeport-mode}

Для доступа к Doris извне кластера Kubernetes используйте [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). Он поддерживает два способа выделения портов:

| Способ выделения | Описание |
| --- | --- |
| Динамическое выделение порта узла | Если сопоставление портов не задано явно, Kubernetes автоматически назначает свободный порт узла (диапазон по умолчанию: 30000-32767) |
| Статическое выделение порта узла | Сопоставление портов задаётся явно. Указанный порт закрепляется, если он не занят и не возникает конфликта |

Для статического выделения необходимо спланировать сопоставление портов. По умолчанию Doris предоставляет следующие порты для внешнего взаимодействия:

**Таблица 1: описание портов сервиса FE**

| Имя порта | Порт по умолчанию | Назначение порта |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | Доступ к кластеру Doris по протоколу MySQL |
| HTTP Port  | 8030    | Порт HTTP Server на FE для просмотра сведений о FE |

#### Шаг 1: настройте FE NodePort {#step-1-configure-fe-nodeport}

Выберите подходящую конфигурацию:

- **Динамическое выделение порта**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **Статическое выделение порта**:

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

#### Шаг 2: получите Service {#step-2-get-the-service}

После развертывания кластера просмотрите `Service` с помощью следующей команды:

```shell
kubectl get service
```

Пример результата:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Шаг 3: подключитесь к Doris через NodePort {#step-3-access-doris-through-nodeport}

Рассмотрим подключение MySQL. Предположим, Query Port Doris сопоставлен с портом узла 31545. Выполните следующие действия:

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

2. Подключитесь к кластеру Doris, указав IP-адрес любого узла (например, 192.168.88.62) и сопоставленный порт:

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### Режим LoadBalancer {#loadbalancer-mode}

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для кластеров Kubernetes на облачных платформах, где балансировщик нагрузки предоставляет облачный провайдер.

#### Шаг 1: настройте режим LoadBalancer {#step-1-configure-loadbalancer-mode}

Установите тип `LoadBalancer` в `feSpec.service`:

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### Шаг 2: получите Service {#step-2-get-the-service-1}

После развертывания кластера просмотрите `Service` с помощью следующей команды:

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

#### Шаг 3: подключитесь через LoadBalancer {#step-3-access-through-the-loadbalancer}

Рассмотрим подключение MySQL. Предположим, Query Port прослушивает порт 9030. Подключитесь к кластеру Doris следующей командой:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## Постоянное хранилище {#persistent-storage}

При [развертывании по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) сервис FE использует Kubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) для хранения метаданных. Поскольку `EmptyDir` не обеспечивает постоянное хранение, **после перезапуска сервиса метаданные теряются**.

Чтобы метаданные FE сохранялись после перезапуска, настройте для FE постоянное хранилище. Doris Operator предоставляет три варианта; выберите подходящий:

| Вариант | Сценарий применения |
| --- | --- |
| Автоматическое создание по шаблону хранилища | Для журналов и метаданных используется одна конфигурация хранилища, что упрощает настройку |
| Настройка отдельных точек монтирования | Для разных каталогов требуются разные параметры хранилища |
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

После развертывания кластера с этой конфигурацией произойдёт следующее:

- Doris Operator автоматически подключит постоянное хранилище для каталога журналов (по умолчанию `/opt/apache-doris/fe/log`) и каталога метаданных (по умолчанию `/opt/apache-doris/fe/doris-meta`)
- Если каталог журналов или метаданных явно указан в [изменённой конфигурации запуска](#custom-startup-configuration), Doris Operator автоматически определит его и подключит хранилище
- Постоянное хранилище использует [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/). Нужный StorageClass можно указать через `storageClassName`

### Настройка отдельных точек монтирования {#custom-mount-point-configuration}

Doris Operator позволяет настраивать хранилище отдельно для каждого каталога. Например, можно подключить диск объёмом 300Gi для каталога журналов с отдельной конфигурацией хранилища, а диск объёмом 200Gi для каталога метаданных — по шаблону:

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

Если массив `mountPaths` пуст, конфигурация хранилища считается шаблоном и применяется ко всем каталогам, для которых не задана отдельная конфигурация.

:::

### Без постоянного хранения журналов {#do-not-persist-logs}

Если журналы нужно выводить только в стандартный вывод без постоянного хранения, используйте следующую конфигурацию:

```yaml
spec:
    feSpec:
        logNotStore: true
```
