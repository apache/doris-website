---
{
    "title": "Настройка вычислительных групп",
    "language": "ru",
    "description": "Настройка вычислительных групп Doris в Kubernetes: количество реплик BE, CPU и память, доступ к сервисам, параметры запуска, постоянное хранилище и масштабирование.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Вычислительная группа — это набор узлов BE, выполняющих одну и ту же задачу. В этом документе описана настройка вычислительных групп в ресурсе `DorisDisaggregatedCluster` для разных сценариев:

- **Базовое развертывание**: быстрая настройка одной или нескольких вычислительных групп
- **Управление ресурсами**: ограничение вычислительных ресурсов, таких как CPU и память
- **Управление доступом**: доступ к сервисам BE изнутри кластера и извне разными способами
- **Настройка запуска**: изменение параметров запуска BE с помощью ConfigMap
- **Сохранение данных**: постоянное хранилище для кеша, журналов и промежуточных данных StreamLoad
- **Масштабирование**: добавление и удаление узлов BE и вычислительных групп с проверкой результатов уменьшения числа узлов

## Сценарий 1: Быстрая настройка одной вычислительной группы {#scenario-1-quickly-set-up-a-single-compute-group}

### Минимальная конфигурация {#minimal-configuration}

Простейшая конфигурация вычислительной группы содержит только 3 поля:

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
| `uniqueId` | Уникальный идентификатор вычислительной группы, который также служит ее именем. После задания изменить его нельзя. Имя должно соответствовать шаблону `[a-zA-Z][0-9a-zA-Z_]+` |
| `image` | Адрес образа для развертывания сервиса BE. Используйте образы из [официального реестра образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `replicas` | Количество узлов сервиса BE в вычислительной группе |

### Инициализация системы узла {#be-system-initialization}

По умолчанию значение `skipDefaultSystemInit` равно `false`. Doris Operator добавляет привилегированный init-контейнер BE, который выполняет:

```shell
sysctl -w vm.max_map_count=2000000 && swapoff -a
```

Эти команды меняют настройки базового узла Linux, в том числе настройки, общие для других рабочих нагрузок. При использовании kind на настольном компьютере изменения могут затронуть ядро Linux виртуальной машины среды выполнения контейнеров. Действие этой инициализации не ограничивается процессом BE.

Если администраторы узлов уже задали необходимые настройки, установите `skipDefaultSystemInit: true` в существующей записи вычислительной группы. Сохраните в манифесте остальные поля и вычислительные группы:

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      skipDefaultSystemInit: true
```

В Doris 3.0.4 и более поздних версиях этот переключатель также добавляет `SKIP_CHECK_ULIMIT=true`, из-за чего при запуске пропускается проверка некоторых системных параметров. Перед включением переключателя самостоятельно проверьте настройки узла.

## Сценарий 2: Развертывание нескольких вычислительных групп для изоляции рабочих нагрузок {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

Ресурс `DorisDisaggregatedCluster` поддерживает развертывание нескольких вычислительных групп, независимых друг от друга. В следующем примере показана конфигурация двух групп с именами `cg1` и `cg2`:

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

Количество реплик в каждой вычислительной группе:

| Имя вычислительной группы | Количество реплик |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

Здесь `${beImage}` обозначает образ развертываемого сервиса BE.

:::tip Совет
Хотя вычислительные группы независимы друг от друга, рекомендуется использовать одинаковые образы сервиса BE во всех группах одного кластера с разделенными хранением и вычислениями.
:::

## Сценарий 3: Ограничение вычислительных ресурсов группы {#scenario-3-limit-the-compute-resources-of-a-compute-group}

В [примере развертывания по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) с разделенными хранением и вычислениями ресурсы, используемые сервисом BE, не ограничены. Для задания ресурсов CPU и памяти в `DorisDisaggregatedCluster` используются механизмы Kubernetes [resources.requests и resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits).

Например, чтобы выделить BE в вычислительной группе `cg1` ресурсы 8c и 8Gi:

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

Чтобы настройки вступили в силу, добавьте их в развертываемый [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations).

## Сценарий 4: Настройка способа доступа к вычислительной группе {#scenario-4-configure-the-access-method-of-a-compute-group}

По умолчанию вычислительная группа не открывает свои сервисы напрямую для внешнего доступа. Doris Operator предоставляет в ресурсе `DorisDisaggregatedCluster` объект Service, который служит точкой доступа к вычислительной группе. Service поддерживает три режима внешнего доступа. Выберите режим с учетом того, откуда будут поступать запросы:

| Режим доступа | Подходящий сценарий | Особенности |
|------|------|------|
| `ClusterIP` | Доступ изнутри кластера Kubernetes | Режим по умолчанию; предоставляет внутренний адрес кластера |
| `NodePort` | Доступ извне самостоятельно управляемого кластера Kubernetes | Открывает сервисы через порты хостов |
| `LoadBalancer` | Доступ извне кластера Kubernetes на облачной платформе | Использует балансировщик нагрузки облачного провайдера |

### 4.1 ClusterIP (доступ внутри кластера) {#41-clusterip-access-within-the-cluster}

[Режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) предоставляет внутренний адрес в кластере Kubernetes. Этот адрес служит точкой входа для обращения к сервису изнутри Kubernetes.

#### Шаг 1: Настройте ClusterIP как тип Service {#step-1-configure-clusterip-as-the-service-type}

Doris по умолчанию включает режим доступа ClusterIP в Kubernetes. Дополнительная настройка не требуется.

#### Шаг 2: Получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развертывания кластера просмотрите Service вычислительной группы следующей командой:

```shell
kubectl -n doris get svc
```

Пример результата:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

В этом результате показан Service, через который можно обратиться к вычислительной группе с `uniqueId` `cg1` в пространстве имен `doris`.

### 4.2 NodePort (внешний доступ к самостоятельно управляемому кластеру) {#42-nodeport-external-access-for-self-managed-clusters}

Для доступа к Doris извне кластера Kubernetes выберите [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). В этом режиме порты можно назначить двумя способами:

| Способ назначения | Описание |
|------|------|
| Динамическое назначение порта хоста | Если сопоставление портов явно не задано, Kubernetes при создании Pod автоматически назначает свободный порт хоста (по умолчанию из диапазона 30000-32767) |
| Статическое назначение порта хоста | Если сопоставление портов задано явно, Kubernetes назначает указанный порт при условии, что он свободен и не возникает конфликтов |

Для статического назначения нужно заранее спланировать сопоставление портов. Doris предоставляет следующие порты для взаимодействия с внешними системами:

**Таблица 1: Описание портов сервиса BE**

| Имя порта | Порт по умолчанию | Описание порта |
|------|------|------|
| Web Server Port | 8040 | Порт HTTP-сервера на BE, используемый для просмотра информации о BE |

#### Конфигурация статического назначения {#static-allocation-configuration}

Следующий пример сопоставляет порт 8040 на BE вычислительной группы `cg1` с портом 31012 на хосте:

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

#### Конфигурация динамического назначения {#dynamic-allocation-configuration}

Чтобы использовать для вычислительной группы `cg1` режим NodePort с динамическим назначением порта, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer (внешний доступ в облачной среде) {#43-loadbalancer-external-access-in-cloud-environments}

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для кластеров Kubernetes на облачных платформах и использует балансировщик нагрузки облачного провайдера. Установите тип `LoadBalancer` в `computeGroup.service`, как показано ниже:

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

При развертывании по умолчанию сервис BE каждой вычислительной группы запускается с файлом конфигурации из образа. Doris Operator использует ConfigMap Kubernetes для монтирования пользовательских файлов конфигурации запуска. Общая последовательность действий:

| Этап | Описание |
|------|------|
| Входные данные | Пользовательский файл конфигурации `be.conf` |
| Действие | Создание ConfigMap и монтирование в каталог `/etc/doris` |
| Результат | Сервис BE вычислительной группы запускается с пользовательской конфигурацией |

### Шаг 1: Создайте ConfigMap с параметрами запуска {#step-1-create-a-configmap-that-contains-the-startup-information}

Ниже приведен пример ConfigMap для сервиса BE:

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
В конфигурации запуска сервиса BE в кластере с разделенными хранением и вычислениями необходимо задать `file_cache_path`. Формат описан в разделе [«Конфигурация `be.conf` для разделенных хранения и вычислений»](../../deploy-manually/separating-storage-compute-deploy-manually).
:::

### Шаг 2: Разверните ConfigMap {#step-2-deploy-the-configmap}

Разверните ConfigMap с пользовательской конфигурацией запуска в кластере Kubernetes следующей командой:

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

Описание параметров:

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имен, в котором развернут `DorisDisaggregatedCluster` |
| `${beConfigMapFileName}` | Имя файла с пользовательским ConfigMap |

### Шаг 3: Обновите ресурс DorisDisaggregatedCluster {#step-3-update-the-dorisdisaggregatedcluster-resource}

Обновите [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations), чтобы смонтировать ConfigMap. Конфигурация выглядит так:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip Совет
Конфигурацию запуска необходимо монтировать в каталог `/etc/doris`.
:::

## Сценарий 6: Настройка постоянного хранилища для вычислительной группы {#scenario-6-configure-persistent-storage-for-a-compute-group}

При развертывании по умолчанию сервис BE использует том Kubernetes [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) для кеша. `EmptyDir` не обеспечивает постоянного хранения: после перезапуска сервиса кешированные данные теряются, что снижает эффективность запросов.

Чтобы после перезапуска сервиса BE кешированные данные сохранялись и эффективность запросов не снижалась, настройте для них постоянное хранилище. Основные пути хранения, используемые сервисом BE:

| Путь хранения | Назначение |
|------|------|
| Каталог журналов BE | Журналы сервиса BE выводятся в стандартный вывод, а также записываются в каталог, заданный параметром `LOG_DIR` в конфигурации запуска |
| `/opt/apache-doris/be/storage` | Место временного хранения данных при загрузке в режиме StreamLoad; помогает предотвратить потерю промежуточных данных после аварийного перезапуска сервиса |
| Каталог кеша BE | Кеш запросов. Потеря данных после перезапуска снижает эффективность запросов |

### 6.1 Пример постоянного хранилища {#61-persistent-storage-example}

Ниже приведен пример конфигурации для монтирования постоянного хранилища данных, которые необходимо сохранять:

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

Описание этой конфигурации:

- Для каталога журналов используется пользовательская конфигурация хранилища с томом емкостью 300Gi
- Для каталога, используемого WAL и загрузками StreamLoad, монтируется том емкостью 300Gi
- Для каталога кеша используется шаблон хранилища с томом емкостью 500Gi

:::tip Совет
Если массив `mountPaths` пуст, текущая конфигурация хранилища считается шаблонной.
:::

### 6.2 Хранение журналов без сохранения между перезапусками {#62-do-not-persist-logs}

Если журналы не нужно сохранять, а достаточно выводить их в стандартный вывод, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## Сценарий 7: Масштабирование вычислительных ресурсов {#scaling-compute-groups}

Чтобы изменить размер вычислительной группы, обновите ресурс `DorisDisaggregatedCluster`. Поле `replicas` задает количество узлов BE, а не копий данных в объектном хранилище. Увеличение значения добавляет вычислительные ресурсы; уменьшение удаляет узлы BE и их локальный кеш.

Описанные ниже процедуры соответствуют [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1). Используйте CRD и образ Operator из одного выпуска. Поведение при уменьшении числа узлов также зависит от образа BE: нельзя предполагать, что каждый образ поддерживает корректное завершение работы.

### 7.1 Подготовка и проверка кластера {#71-prepare-and-inspect-the-cluster}

Перед изменением емкости:

- Убедитесь, что FE, MetaService, FoundationDB и текущие узлы BE исправны. Operator должен иметь возможность подключаться к FE с учетными данными администратора, заданными в разделе [«Настройка аутентификации»](config-cluster.md).
- Проверьте доступные ресурсы CPU, памяти и хранилища Kubernetes, в том числе возможность привязки новых PVC. Оставьте достаточно готовых узлов BE для обслуживания оставшейся нагрузки.
- Перед уменьшением числа узлов снизьте или перенаправьте трафик и дождитесь завершения выполняющихся запросов и заданий загрузки. После операции проверьте повторные попытки клиентов и состояние заданий загрузки.

В следующих примерах используются пространство имен `doris`, кластер `test-disaggregated-cluster` и вычислительная группа `cg1`. Замените эти имена на свои:

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

Подключитесь к SQL-интерфейсу FE с правами администратора и зафиксируйте текущие вычислительные группы и узлы BE:

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

Отредактируйте полный манифест, использованный для развертывания кластера, затем примените его:

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

Приведенные ниже фрагменты YAML показывают только поля, которые нужно изменить. Сохраните остальные поля и все остальные записи в `spec.computeGroups`. Если исключить существующую группу, будет запрошено ее удаление. Изменяйте пользовательский ресурс Doris, а не масштабируйте StatefulSet напрямую: тогда Operator сможет согласовать метаданные Doris и ресурсы Kubernetes.

### 7.2 Увеличение существующей вычислительной группы {#72-scale-out-an-existing-compute-group}

Например, в полном манифесте увеличьте количество узлов BE в `cg1` с 2 до 3:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

Сохраните существующие `uniqueId`, образ, настройки ресурсов, ConfigMap и конфигурацию постоянных томов. Примените манифест. Operator увеличит количество реплик StatefulSet, а новый BE при запуске зарегистрируется в кластере.

Убедитесь, что в группе стало 3 готовых Pod и что команда `SHOW BACKENDS` показывает новый BE со значением `Alive = true`. Кеш нового узла изначально пуст: добавленный узел не получает сразу такой же кеш, как существующие узлы.

### 7.3 Уменьшение существующей вычислительной группы {#73-scale-in-an-existing-compute-group}

Логическое поле уровня кластера `spec.enableDecommission` определяет способ удаления BE. По умолчанию его значение — `false`:

| Значение | Поведение при уменьшении `replicas` вычислительной группы |
| --- | --- |
| `true` | Запустить вывод BE из эксплуатации в Doris и сохранить исходное количество реплик StatefulSet на время этого процесса. После завершения вывода выбранных узлов удалить их из Doris и уменьшить StatefulSet. |
| `false` | Удалить выбранные BE из Doris без этапа вывода из эксплуатации. Operator 26.0.1 сначала использует процедуру корректного уменьшения числа узлов, если образ BE ее поддерживает; иначе переходит к прямому удалению. |

Например, чтобы уменьшить `cg1` с 3 узлов до 2 с выводом из эксплуатации, обновите полный манифест следующим образом и примените его:

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator выбирает узлы, порядковые номера Pod которых больше или равны целевому количеству реплик. Не удаляйте эти Pod вручную во время вывода из эксплуатации. Проверяйте ход операции командами:

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

В Doris выполните `SHOW BACKENDS;`. При проверке вывода из эксплуатации Operator ожидает, пока для выбранных BE не станут истинными условия `SystemDecommissioned = true` и `TabletNum = 0` либо пока эти BE не будут удалены. Во время операции группа может оставаться в состоянии `Decommissioning`. Для завершения необходимо, чтобы целевому значению соответствовали и количество готовых Pod, и состав узлов BE в Doris.

:::caution Локальное хранилище при уменьшении числа узлов
Operator 26.0.1 после уменьшения StatefulSet удаляет PVC, принадлежащие удаленным Pod. Дальнейшая судьба хранилища определяется политикой возврата базового PV. Постоянное хранение кеша, журналов или промежуточных данных Stream Load не гарантирует сохранения этих томов после уменьшения числа узлов. Перед удалением BE завершите зависящие от него задания загрузки и сохраните нужные журналы. Последующее увеличение числа узлов не гарантирует восстановления прежних локальных данных.
:::

### 7.4 Добавление или удаление целой вычислительной группы {#74-add-or-remove-an-entire-compute-group}

Чтобы добавить группу, сохраните все существующие группы и добавьте запись с новым `uniqueId`. Например:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

Примените полный манифест и дождитесь, пока `cg2` станет готовой и появится в результатах `SHOW COMPUTE GROUPS`. Перед направлением в нее трафика настройте доступ пользователей и маршрутизацию рабочих нагрузок согласно разделу [«Управление вычислительными группами»](../../../compute-storage-decoupled/managing-compute-cluster.md). Добавление группы не переносит в нее существующие сеансы автоматически.

Чтобы удалить группу, сначала перенаправьте ее запросы и загрузки в другую доступную группу и обновите настройки пользователей по умолчанию и параметры приложений, которые ссылаются на удаляемую группу. Удалите из полного манифеста только запись этой группы и примените его. Operator удалит ее BE из метаданных Doris, а затем удалит управляемые им Service и StatefulSet.

:::caution Удаление группы отличается от уменьшения числа ее узлов
В Operator 26.0.1 удаление целой записи `computeGroups` приводит к прямому удалению BE, даже если для `enableDecommission` задано `true`. Не удаляйте запись, если требуется постепенный вывод из эксплуатации. После удаления проверьте, остались ли PVC, и обработайте их в соответствии со своей политикой хранения. Не считайте, что очистка происходит так же, как при уменьшении числа узлов существующей группы.
:::

### 7.5 Изменение ресурсов и других компонентов {#75-resource-changes-and-other-components}

| Изменение | Действие и ограничение |
| --- | --- |
| Увеличение или уменьшение CPU и памяти для одного BE | Измените `requests` и `limits` группы, как описано в сценарии 3, затем примените полный манифест. Это изменит шаблон Pod и может привести к перезапуску BE. Перед применением проверьте доступные ресурсы для планирования. |
| Масштабирование FE | Измените `spec.feSpec.replicas`. Значение должно быть не меньше `electionNumber`; дополнительные узлы FE становятся Observers. Перед уменьшением StatefulSet Operator удаляет выбранные Observers из Doris. Не меняйте `electionNumber` в существующем кластере. См. раздел [«Настройка FE»](config-fe.md). |
| Изменение емкости MetaService, FoundationDB или Storage Vault | Управляйте ими независимо от количества реплик вычислительных групп. Сохраняйте их метаданные и хранилища. Уменьшение числа BE не требует удаления ресурсов этих компонентов или данных в объектном хранилище. См. разделы [«Настройка MetaService»](config-ms.md) и [«Развертывание FoundationDB»](install-fdb.md). |

### 7.6 Проверка и устранение неполадок {#76-verify-and-troubleshoot}

После каждого изменения проверяйте вместе состояние вычислительной группы в пользовательском ресурсе, готовность Pod и результаты `SHOW BACKENDS`. Убедитесь, что количество узлов соответствует целевому, для оставшихся узлов указано `Alive = true`, выведенные узлы удалены, а запросы и загрузки успешно выполняются через нужную вычислительную группу.

Если операция остановилась, проверьте `kubectl describe ddc`, события Pod, привязку PVC и журналы Operator. Для Pod в состоянии `Pending` обычно требуется проверить планирование или хранилище; при `Decommissioning` — ход вывода из эксплуатации в Doris; при `ScaleDownFailed` — ошибку SQL в журналах Operator, подключение к FE и права доступа. Устраните обнаруженную причину, прежде чем повторять операцию или принудительно удалять ресурсы. См. раздел [«Состояние и устранение неполадок»](../doris-operator/status-and-troubleshooting.md).

## Плановые перезапуски BE {#planned-be-restarts}

Для временного перезапуска сохраните регистрацию BE и используйте корректное завершение работы. В режиме разделенных вычислений и хранения Doris 4.1.5 команда `DECOMMISSION BACKEND` выполняет постоянное уменьшение числа узлов: перезапуск Pod не отменяет его, а команда `CANCEL DECOMMISSION BACKEND` не поддерживается. Для окончательного удаления BE используйте описанную выше процедуру уменьшения числа узлов.

Отклонение обычной команды `DROP BACKEND` — предусмотренная мера защиты; явный синтаксис `DROPP BACKEND` описан в разделе [DROP BACKEND](../../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND.md). Для окончательного удаления предпочтительно использовать процедуру уменьшения числа узлов через Operator, чтобы метаданные Doris и ресурсы Kubernetes оставались согласованными.

Doris Operator устанавливает для BE хук `preStop`. В стандартном образе Doris 4.1.5 этот хук вызывает `stop_be.sh --grace`; BE сообщает о состоянии завершения работы через сигналы heartbeat и ожидает завершения выполняющихся запросов. Перед перезапуском:

1. Убедитесь, что другие BE в вычислительной группе исправны и имеют достаточную емкость.
2. Проверьте `terminationGracePeriodSeconds` созданного Pod. Этого времени должно хватать на ожидание запросов, задержку после завершения работы и выполнение необходимых действий. В Doris 4.1.5 значения по умолчанию составляют `grace_shutdown_wait_seconds=120` и `grace_shutdown_post_delay_seconds=30`. Operator 26.0.1 по умолчанию задает для Pod BE период завершения работы в 200 секунд, но явно заданное в `be.conf` значение `grace_shutdown_wait_seconds` также меняет сгенерированное значение для Pod. Проверяйте оба параметра вместе.
3. Удалите Pod обычным способом, чтобы выполнился `preStop`, без принудительного удаления:

   ```shell
   kubectl delete pod ${be_pod} -n ${namespace}
   ```

4. Дождитесь, пока заменяющий Pod станет Ready, а команда `SHOW BACKENDS` покажет, что BE работает и его состояние завершения работы сброшено. Проверьте запросы и загрузки, прежде чем перезапускать следующий BE.

В Operator 26.0.1 также предусмотрено двухэтапное корректное обновление, для которого нужен совместимый образ BE. Стандартный образ Doris 4.1.5 не проходит проверку совместимости для этой процедуры, поэтому одного обновления Operator недостаточно, чтобы включить ее для данного образа. Существующий хук `preStop` по-прежнему обеспечивает корректное завершение работы. Оно снижает влияние перезапуска, но не может защитить выполняющиеся запросы при внезапной потере узла или принудительном завершении работы.
