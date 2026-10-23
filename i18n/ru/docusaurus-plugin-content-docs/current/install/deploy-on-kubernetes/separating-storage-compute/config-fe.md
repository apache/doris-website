---
{
    "title": "Настройка FE",
    "language": "ru",
    "description": "Подробное руководство по настройке FE (FrontEnd) в кластере с разделением хранения и вычислений: вычислительные ресурсы, количество узлов Follower, параметры запуска, режимы доступа (ClusterIP/NodePort/LoadBalancer) и настройка постоянного хранилища.",
    "keywords": ["Doris", "storage-compute separation", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "persistent storage"]
}
---

## Что вы узнаете из этой главы {#what-you-will-learn-in-this-chapter}

- Как настроить вычислительные ресурсы (CPU и память) для компонента FE
- Как настроить количество узлов FE Follower и определить их роли
- Как задать собственные параметры запуска FE с помощью ConfigMap
- Как выбрать режим доступа к сервису FE (ClusterIP/NodePort/LoadBalancer) в зависимости от сценария доступа
- Как настроить постоянное хранилище для FE, чтобы предотвратить потерю метаданных

## Обзор конфигурации {#configuration-overview}

В режиме разделения хранения и вычислений FE (Frontend) в основном отвечает за разбор и планирование запросов. В этой главе настройка FE рассматривается в следующем порядке:

| Параметр конфигурации | Какую задачу решает |
| --- | --- |
| Настройка вычислительных ресурсов | Явно выделяет CPU и память для FE |
| Настройка количества узлов Follower | Позволяет спланировать состав узлов управления метаданными в распределённом развёртывании |
| Пользовательская конфигурация запуска | Переопределяет параметры запуска по умолчанию с помощью ConfigMap |
| Настройка режима доступа | Обеспечивает доступ к сервису FE в зависимости от сценария (изнутри кластера, извне кластера или через облачную платформу) |
| Настройка постоянного хранилища | Предотвращает потерю метаданных после перезапуска FE |

## Настройка вычислительных ресурсов {#configure-compute-resources}

В [примере развёртывания](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) из репозитория Doris-Operator для FE по умолчанию не заданы ограничения ресурсов. В производственных средах рекомендуется явно настраивать вычислительные ресурсы FE с помощью Kubernetes [requests и limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

В следующем примере для FE выделяются вычислительные ресурсы в объёме 8c8Gi:

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

Примените эту конфигурацию к [ресурсу `DorisDisaggregatedCluster`, который вы хотите развернуть](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource).

## Настройка количества узлов Follower {#configure-the-number-of-follower-nodes}

В сервисе FE предусмотрены две роли со следующими обязанностями:

| Роль | Обязанности |
| --- | --- |
| Follower | Выполняет разбор SQL, управляет метаданными и хранит их |
| Observer | Выполняет разбор SQL и берёт на себя часть нагрузки узлов Follower по выполнению запросов и записи |

Doris использует систему хранения bdbje для управления метаданными. Внутренняя реализация bdbje основана на алгоритме, похожем на протокол Paxos. При распределённом развёртывании необходимо настроить несколько узлов Follower, чтобы они совместно участвовали в управлении метаданными.

При развёртывании кластера Doris с разделением хранения и вычислений с помощью ресурса `DorisDisaggregatedCluster` количество узлов Follower по умолчанию равно 1. Это количество можно изменить с помощью поля `electionNumber`. В следующем примере количество узлов Follower устанавливается равным 3:

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip Совет

После развёртывания кластера с разделением хранения и вычислений изменить `electionNumber` нельзя. Спланируйте количество узлов Follower до развёртывания.

:::

## Пользовательская конфигурация запуска {#custom-startup-configuration}

Doris Operator подключает конфигурацию запуска FE через Kubernetes ConfigMap. Настройка выполняется следующим образом:

### Шаг 1: Создайте ConfigMap с конфигурацией запуска FE {#step-1-write-the-fe-startup-configmap}

Определите ConfigMap, содержащий конфигурацию запуска FE, как показано ниже:

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
        JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
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

Разверните ConfigMap в пространстве имён, в котором находится `DorisDisaggregatedCluster`, с помощью следующей команды:

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

Описание параметров:

- `${namespace}`: пространство имён, в котором находится `DorisDisaggregatedCluster`
- `${feConfigMapName}`: имя файла, содержащего приведённую выше конфигурацию

### Шаг 3: Укажите ConfigMap в DorisDisaggregatedCluster {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

Обновите [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource) и подключите ConfigMap через массив `feSpec.configMaps`, как показано ниже:

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip Совет

При настройке пользовательской конфигурации запуска в Kubernetes учитывайте следующие два момента:

1. **Не добавляйте** параметры `meta_service_endpoint` и `cluster_id`. Doris-Operator подставляет эти значения автоматически.
2. **Обязательно** задайте `enable_fqdn_mode=true`.

:::

## Настройка доступа {#access-configuration}

Doris-Operator использует Kubernetes Service для предоставления VIP и балансировки нагрузки. В зависимости от сценария доступа можно выбрать один из следующих трёх режимов публикации сервиса:

| Режим доступа | Сценарий использования | Описание |
| --- | --- | --- |
| ClusterIP | Доступ только изнутри кластера Kubernetes | Режим по умолчанию, дополнительная настройка не требуется |
| NodePort | Доступ извне кластера Kubernetes (часто используется в самостоятельно развёрнутых кластерах) | Предоставляет доступ к сервису через порт хоста |
| LoadBalancer | Доступ через облачный балансировщик нагрузки в среде облачной платформы | Балансировщик нагрузки предоставляется поставщиком облачных услуг |

В следующих разделах описана настройка каждого режима.

### Режим ClusterIP {#clusterip-mode}

По умолчанию Kubernetes использует [режим ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). В этом режиме предоставляется внутренний адрес кластера Kubernetes, доступный только изнутри кластера.

#### Шаг 1: Настройте ClusterIP {#step-1-configure-clusterip}

ClusterIP является режимом доступа по умолчанию, и для его использования **дополнительные изменения не требуются**.

#### Шаг 2: Получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развёртывания кластера просмотрите сервисы Service, предоставляемые FE, с помощью следующей команды:

```shell
kubectl -n doris get svc
```

Пример результата приведён ниже:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

Результат содержит два вида сервисов Service:

- С суффиксом `internal`: используются только для внутреннего взаимодействия компонентов Doris (например, для проверки доступности и обмена данными) и не предоставляют внешний доступ
- Без суффикса `internal`: используются для внешнего доступа к сервису FE

#### Шаг 3: Подключитесь к Doris из контейнера {#step-3-access-doris-from-inside-a-container}

Выполните следующую команду, чтобы создать в текущем кластере Kubernetes Pod с клиентом MySQL:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Внутри контейнера подключитесь к кластеру Doris, используя имя Service без суффикса `internal`:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### Режим NodePort {#nodeport-mode}

Для доступа к Doris извне кластера Kubernetes используйте [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). Режим NodePort поддерживает два способа выделения портов:

| Способ выделения | Описание |
| --- | --- |
| Динамическое выделение порта хоста | Если сопоставление портов не задано явно, Kubernetes автоматически назначает свободный порт хоста (диапазон по умолчанию 30000-32767) |
| Статическое выделение порта хоста | Сопоставление портов задаётся явно. Порт остаётся фиксированным, если порт хоста не занят и конфликты отсутствуют |

Статическое выделение требует предварительного планирования сопоставления портов. По умолчанию Doris предоставляет следующие порты для внешнего взаимодействия:

**Таблица 1: Описание портов сервиса FE**

| Имя порта  | Порт по умолчанию | Описание порта                       |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | Используется для доступа к кластеру Doris по протоколу MySQL |
| HTTP Port  | 8030    | Порт HTTP Server на FE, используемый для просмотра информации о FE |

#### Шаг 1: Настройте NodePort для FE {#step-1-configure-fe-nodeport}

Выберите одну из следующих конфигураций в зависимости от ваших потребностей:

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

#### Шаг 2: Получите сведения о Service {#step-2-get-the-service}

После развёртывания кластера просмотрите `Service` с помощью следующей команды:

```shell
kubectl get service
```

Результат приведён ниже:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Шаг 3: Подключитесь к Doris через NodePort {#step-3-access-doris-through-nodeport}

Рассмотрим подключение MySQL в качестве примера. Предположим, что Doris Query Port сопоставлен с портом хоста 31545. Выполните следующие действия:

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

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для сред Kubernetes на облачных платформах, где балансировщик нагрузки предоставляется поставщиком облачных услуг.

#### Шаг 1: Настройте режим LoadBalancer {#step-1-configure-loadbalancer-mode}

Задайте тип `LoadBalancer` в `feSpec.service`:

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### Шаг 2: Получите сведения о Service {#step-2-get-the-service-1}

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

Рассмотрим подключение MySQL в качестве примера. Предположим, что Query Port прослушивает порт 9030. Подключитесь к кластеру Doris с помощью следующей команды:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## Постоянное хранилище {#persistent-storage}

При [развёртывании по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) сервис FE использует Kubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) для хранения метаданных. Поскольку `EmptyDir` не обеспечивает постоянное хранение, **после перезапуска сервиса метаданные теряются**.

Чтобы метаданные FE не терялись после перезапуска, настройте для FE постоянное хранилище. Doris Operator предоставляет следующие три варианта. Выберите подходящий для ваших потребностей:

| Вариант | Сценарий использования |
| --- | --- |
| Автоматическое создание по шаблону хранилища | Для журналов и метаданных используется одна конфигурация хранилища, что упрощает настройку |
| Пользовательская настройка точек монтирования | Для разных каталогов требуются разные характеристики хранилища |
| Без постоянного хранения журналов | Журналы записываются только в стандартный поток вывода и не требуют постоянного хранения |

### Автоматическое создание по шаблону хранилища {#auto-generate-using-a-storage-template}

Настройте постоянное хранение журналов и метаданных с помощью единого шаблона хранилища, как показано ниже:

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
- Если каталог журналов или метаданных явно указан в [пользовательской конфигурации запуска](#custom-startup-configuration), Doris Operator автоматически определяет его и монтирует хранилище соответствующим образом
- Постоянное хранилище использует [режим StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/). Нужный StorageClass можно указать через `storageClassName`

### Пользовательская настройка точек монтирования {#custom-mount-point-configuration}

Doris Operator поддерживает отдельную настройку хранилища для каждого каталога. Например, можно смонтировать диск объёмом 300Gi для каталога журналов с помощью пользовательской конфигурации хранилища, а для каталога метаданных смонтировать диск объёмом 200Gi с помощью шаблона хранилища:

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

:::tip Совет

Если массив `mountPaths` пуст, конфигурация хранилища рассматривается как шаблон (то есть применяется ко всем каталогам, для которых не задана отдельная конфигурация).

:::

### Без постоянного хранения журналов {#do-not-persist-logs}

Если постоянное хранение журналов не требуется и вы хотите записывать их только в стандартный поток вывода, используйте следующую конфигурацию:

```yaml
spec:
    feSpec:
        logNotStore: true
```
