---
{
    "title": "Настройка вычислительных групп",
    "language": "ru",
    "description": "Настройка вычислительных групп Doris в Kubernetes: количество узлов BE, CPU и память, доступ к сервисам, параметры запуска, постоянное хранилище и масштабирование.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Вычислительная группа — это набор узлов BE, выполняющих одну и ту же задачу. В этом документе описана настройка вычислительных групп в ресурсе `DorisDisaggregatedCluster` для разных сценариев:

- **Базовое развертывание**: быстрая настройка одной или нескольких вычислительных групп
- **Управление ресурсами**: ограничение вычислительных ресурсов, таких как CPU и память
- **Управление доступом**: доступ к сервисам BE изнутри и извне кластера разными способами
- **Настройка запуска**: изменение параметров запуска BE через ConfigMap
- **Постоянное хранение данных**: хранение кеша, журналов и временных данных StreamLoad
- **Масштабирование**: добавление и удаление узлов BE и вычислительных групп с проверкой результатов уменьшения масштаба

## Сценарий 1: Быстрая настройка одной вычислительной группы {#scenario-1-quickly-set-up-a-single-compute-group}

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
| `uniqueId` | Уникальный идентификатор вычислительной группы, который также служит ее именем. После задания его нельзя изменить. Имя должно соответствовать шаблону `[a-zA-Z][0-9a-zA-Z_]+` |
| `image` | Адрес образа для развертывания сервиса BE. Используйте образы из [официального реестра образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `replicas` | Количество узлов BE в вычислительной группе |

## Сценарий 2: Развертывание нескольких вычислительных групп для разделения рабочих нагрузок {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

Ресурс `DorisDisaggregatedCluster` поддерживает развертывание нескольких независимых вычислительных групп. В следующем примере показана конфигурация двух групп с именами `cg1` и `cg2`:

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

Количество узлов в каждой группе указано ниже:

| Имя вычислительной группы | Количество узлов |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

Здесь `${beImage}` обозначает образ сервиса BE, который нужно развернуть.

:::tip Совет
Хотя вычислительные группы независимы друг от друга, рекомендуется использовать одинаковые образы сервиса BE во всех группах одного кластера с разделением хранения и вычислений.
:::

## Сценарий 3: Ограничение вычислительных ресурсов группы {#scenario-3-limit-the-compute-resources-of-a-compute-group}

В [примере развертывания по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) для кластера с разделением хранения и вычислений ресурсы сервиса BE не ограничены. Для задания CPU и памяти ресурс `DorisDisaggregatedCluster` использует параметры Kubernetes [resources.requests и resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits).

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

Добавьте приведенную конфигурацию в развертываемый [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations), чтобы она вступила в силу.

## Сценарий 4: Настройка способа доступа к вычислительной группе {#scenario-4-configure-the-access-method-of-a-compute-group}

По умолчанию вычислительная группа не предоставляет сервисы напрямую за пределами кластера. Doris Operator создает для вычислительной группы Service в ресурсе `DorisDisaggregatedCluster`, через который осуществляется доступ. Service поддерживает три способа предоставления доступа извне. Выберите подходящий с учетом расположения клиентов:

| Способ доступа | Сценарий применения | Особенности |
|------|------|------|
| `ClusterIP` | Доступ изнутри кластера Kubernetes | Способ по умолчанию: предоставляет внутренний адрес кластера |
| `NodePort` | Доступ извне самостоятельно управляемого кластера Kubernetes | Открывает сервисы через порты узлов кластера |
| `LoadBalancer` | Доступ извне кластера Kubernetes в облачной среде | Использует балансировщик нагрузки облачного провайдера |

### 4.1 ClusterIP (доступ внутри кластера) {#41-clusterip-access-within-the-cluster}

[Режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) предоставляет внутренний адрес кластера Kubernetes, через который можно обращаться к сервису изнутри Kubernetes.

#### Шаг 1: Выберите ClusterIP в качестве типа Service {#step-1-configure-clusterip-as-the-service-type}

Doris по умолчанию включает режим доступа ClusterIP в Kubernetes. Дополнительная настройка не требуется.

#### Шаг 2: Получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развертывания кластера просмотрите Service вычислительной группы с помощью следующей команды:

```shell
kubectl -n doris get svc
```

Пример результата:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

В этом результате показан Service, доступный для вычислительной группы с `uniqueId` `cg1` в пространстве имен `doris`.

### 4.2 NodePort (внешний доступ для самостоятельно управляемых кластеров) {#42-nodeport-external-access-for-self-managed-clusters}

Для доступа к Doris извне кластера Kubernetes выберите [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). В режиме NodePort доступны два способа назначения портов:

| Способ назначения | Описание |
|------|------|
| Динамическое назначение порта узла | Если сопоставление портов не задано явно, при создании Pod Kubernetes автоматически назначает свободный порт узла из диапазона по умолчанию 30000-32767 |
| Статическое назначение порта узла | Если сопоставление портов задано явно, Kubernetes назначает указанный фиксированный порт при условии, что он свободен и не вызывает конфликтов |

Для статического назначения необходимо спланировать сопоставление портов. Для взаимодействия с внешними системами Doris предоставляет следующие порты:

**Таблица 1: Описание портов сервиса BE**

| Имя порта | Порт по умолчанию | Описание порта |
|------|------|------|
| Порт веб-сервера | 8040 | Порт HTTP-сервера на BE, используемый для просмотра информации о BE |

#### Настройка статического назначения {#static-allocation-configuration}

В следующем примере порт 8040 узла BE в вычислительной группе `cg1` сопоставляется с портом 31012 узла кластера:

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

Чтобы использовать динамическое назначение портов в режиме NodePort для вычислительной группы `cg1`, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer (внешний доступ в облачной среде) {#43-loadbalancer-external-access-in-cloud-environments}

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для кластеров Kubernetes на облачных платформах и использует балансировщик нагрузки облачного провайдера. Укажите тип `LoadBalancer` в `computeGroup.service`, как показано ниже:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## Сценарий 5: Настройка параметров запуска BE {#scenario-5-customize-the-be-startup-configuration}

При развертывании по умолчанию сервис BE каждой вычислительной группы запускается с конфигурационным файлом из образа. Doris Operator использует ConfigMap Kubernetes для монтирования пользовательских файлов конфигурации запуска. Общий порядок действий:

| Этап | Описание |
|------|------|
| Входные данные | Пользовательский файл конфигурации `be.conf` |
| Действие | Создать ConfigMap и смонтировать его в каталог `/etc/doris` |
| Результат | Сервис BE вычислительной группы запускается с пользовательской конфигурацией |

### Шаг 1: Создайте ConfigMap с параметрами запуска {#step-1-create-a-configmap-that-contains-the-startup-information}

Ниже приведен пример ConfigMap, который может использовать сервис BE:

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
В конфигурации запуска сервиса BE кластера с разделением хранения и вычислений необходимо задать `file_cache_path`. Формат описан в разделе [«Настройка `be.conf` при разделении хранения и вычислений»](../../deploy-manually/separating-storage-compute-deploy-manually).
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

При развертывании по умолчанию сервис BE использует [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) Kubernetes для кеша. Режим `EmptyDir` не обеспечивает постоянного хранения: после перезапуска сервиса кешированные данные теряются, из-за чего снижается эффективность запросов.

Чтобы сохранить кеш после перезапуска BE и избежать снижения эффективности запросов, настройте для него постоянное хранилище. Основные пути хранения, используемые сервисом BE:

| Путь хранения | Назначение |
|------|------|
| Каталог журналов BE | Журналы сервиса BE выводятся в стандартный поток вывода и записываются в каталог, указанный параметром `LOG_DIR` в конфигурации запуска |
| `/opt/apache-doris/be/storage` | Временное размещение данных при загрузке в режиме StreamLoad; помогает избежать потери временных данных при аварийном перезапуске сервиса |
| Каталог кеша BE | Кеш запросов; потеря его данных после перезапуска снижает эффективность запросов |

### 6.1 Пример постоянного хранилища {#61-persistent-storage-example}

Ниже приведен пример конфигурации монтирования постоянного хранилища для данных, которые необходимо сохранять:

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

Эта конфигурация задает следующее:

- Для каталога журналов используется отдельная конфигурация хранилища с томом емкостью 300Gi
- Для каталога WAL и загрузки StreamLoad монтируется том емкостью 300Gi
- Для каталога кеша используется шаблон хранилища с томом емкостью 500Gi

:::tip Совет
Если массив `mountPaths` пуст, текущая конфигурация хранилища считается шаблонной.
:::

### 6.2 Отключение постоянного хранения журналов {#62-do-not-persist-logs}

Если журналы нужно выводить только в стандартный поток вывода без постоянного хранения, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## Сценарий 7: Масштабирование вычислительных ресурсов {#scaling-compute-groups}

Для изменения размера вычислительной группы измените ресурс `DorisDisaggregatedCluster`. Его поле `replicas` задает количество узлов BE, а не число копий данных в объектном хранилище. Увеличение значения добавляет вычислительные ресурсы; уменьшение удаляет узлы BE вместе с их локальным кешем.

Приведенные ниже процедуры соответствуют [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1). Используйте CRD и образ Operator одного выпуска. Поведение при уменьшении масштаба также зависит от образа BE: поддержка корректного завершения работы есть не у всех образов.

### 7.1 Подготовка и проверка кластера {#71-prepare-and-inspect-the-cluster}

Перед изменением размера кластера:

- Убедитесь, что FE, MetaService, FoundationDB и действующие узлы BE работают исправно. Operator должен иметь возможность подключиться к FE с учетными данными администратора, указанными в разделе [«Настройка аутентификации»](config-cluster.md).
- Проверьте доступные CPU, память и хранилище Kubernetes, в том числе возможность привязки новых PVC. Оставьте достаточно готовых узлов BE для обработки оставшейся нагрузки.
- Перед уменьшением масштаба снизьте или перенаправьте нагрузку и дождитесь завершения выполняющихся запросов и заданий загрузки. После операции проверьте повторные попытки клиентов и состояние заданий загрузки.

В следующих примерах используются пространство имен `doris`, кластер `test-disaggregated-cluster` и вычислительная группа `cg1`. Замените эти имена своими:

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

Подключитесь к SQL-интерфейсу FE от имени администратора и запишите текущие вычислительные группы и узлы BE:

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

Измените полный манифест, использованный для развертывания кластера, затем примените его:

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

Следующие фрагменты YAML показывают только поля, которые нужно изменить. Сохраните остальные поля и все другие записи в `spec.computeGroups`. Если пропустить существующую группу, будет запрошено ее удаление. Изменяйте пользовательский ресурс Doris, а не масштабируйте StatefulSet напрямую, чтобы Operator мог согласовать метаданные Doris и ресурсы Kubernetes.

### 7.2 Увеличение существующей вычислительной группы {#72-scale-out-an-existing-compute-group}

Например, измените в полном манифесте количество узлов BE группы `cg1` с 2 до 3:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

Сохраните существующие `uniqueId`, образ, настройки ресурсов, ConfigMap и конфигурацию постоянных томов. Примените манифест. Operator увеличит количество реплик StatefulSet, а новый BE зарегистрируется в кластере при запуске.

Убедитесь, что в группе есть 3 готовых Pod и что новый BE присутствует в выводе `SHOW BACKENDS` со значением `Alive = true`. Кеш нового узла изначально пуст: добавление узла не создает на нем сразу такой же кеш, как на существующих узлах.

### 7.3 Уменьшение существующей вычислительной группы {#73-scale-in-an-existing-compute-group}

Булево поле уровня кластера `spec.enableDecommission` определяет способ удаления BE. По умолчанию оно равно `false`:

| Значение | Поведение при уменьшении `replicas` вычислительной группы |
| --- | --- |
| `true` | Запускается вывод BE из эксплуатации в Doris, а исходное количество реплик StatefulSet сохраняется до завершения процедуры. После вывода выбранные узлы удаляются из Doris, а количество реплик StatefulSet уменьшается. |
| `false` | Выбранные BE удаляются из Doris без этапа вывода из эксплуатации. Operator 26.0.1 сначала использует процедуру корректного уменьшения масштаба, если ее поддерживает образ BE; иначе переходит к прямому удалению. |

Например, чтобы уменьшить группу `cg1` с 3 до 2 узлов с выводом из эксплуатации, измените полный манифест следующим образом и примените его:

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator выбирает узлы, порядковые номера Pod которых больше или равны целевому количеству реплик. Не удаляйте эти Pod вручную во время вывода из эксплуатации. Для проверки хода операции выполните:

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

В Doris выполните `SHOW BACKENDS;`. При проверке вывода из эксплуатации Operator ожидает, пока у выбранных BE не будут установлены `SystemDecommissioned = true` и `TabletNum = 0` либо пока эти узлы не будут удалены. В ходе операции группа может оставаться в состоянии `Decommissioning`. Для завершения необходимо, чтобы целевому значению соответствовали и количество готовых Pod, и состав узлов BE в Doris.

:::caution Локальное хранилище при уменьшении масштаба
После уменьшения количества реплик StatefulSet Operator 26.0.1 удаляет PVC, принадлежавшие удаленным Pod. Дальнейшая судьба хранилища зависит от политики возврата базового PV. Постоянное хранение кеша, журналов или временных данных Stream Load не гарантирует сохранения этих томов после уменьшения масштаба. Перед удалением BE завершите зависящие от него задания загрузки и сохраните нужные журналы. Последующее увеличение масштаба не гарантирует восстановления прежних локальных данных.
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

Примените полный манифест и дождитесь, когда `cg2` станет готовой и появится в выводе `SHOW COMPUTE GROUPS`. Прежде чем направлять в нее трафик, настройте доступ пользователей и маршрутизацию нагрузки, как описано в разделе [«Управление вычислительными группами»](../../../compute-storage-decoupled/managing-compute-cluster.md). Добавление группы не переносит в нее существующие сеансы автоматически.

Чтобы удалить группу, сначала перенаправьте ее запросы и загрузки в другую доступную группу и обновите пользовательские настройки по умолчанию и параметры приложений, которые на нее ссылаются. Удалите из полного манифеста только запись этой группы и примените его. Operator удалит ее узлы BE из метаданных Doris, а затем удалит управляемые им Service и StatefulSet.

:::caution Удаление группы отличается от уменьшения количества ее узлов
В Operator 26.0.1 при удалении целой записи `computeGroups` используется прямое удаление BE, даже если `enableDecommission` равно `true`. Удаление записи не запускает постепенный вывод из эксплуатации. После удаления проверьте, остались ли PVC, и обработайте их согласно своей политике хранения. Не рассчитывайте, что очистка пройдет так же, как при уменьшении существующей группы.
:::

### 7.5 Изменение ресурсов и других компонентов {#75-resource-changes-and-other-components}

| Изменение | Действие и ограничение |
| --- | --- |
| Увеличение или уменьшение CPU и памяти на один BE | Измените `requests` и `limits` группы, как описано в сценарии 3, затем примените полный манифест. Это изменит шаблон Pod и может привести к перезапуску BE. Перед применением проверьте, достаточно ли ресурсов для размещения. |
| Масштабирование FE | Измените `spec.feSpec.replicas`. Значение должно быть не меньше `electionNumber`; дополнительные узлы FE будут Observers. Перед уменьшением количества реплик StatefulSet Operator удаляет выбранные Observers из Doris. Не меняйте `electionNumber` в существующем кластере. См. [«Настройка FE»](config-fe.md). |
| Изменение ресурсов MetaService, FoundationDB или Storage Vault | Управляйте ими независимо от количества узлов вычислительных групп. Сохраняйте их метаданные и хранилище. Уменьшение числа BE не требует удаления ресурсов этих компонентов или данных в объектном хранилище. См. [«Настройка MetaService»](config-ms.md) и [«Развертывание FoundationDB»](install-fdb.md). |

### 7.6 Проверка и устранение неполадок {#76-verify-and-troubleshoot}

После каждого изменения проверяйте состояние вычислительной группы в пользовательском ресурсе, готовность Pod и вывод `SHOW BACKENDS`. Убедитесь, что количество узлов достигло целевого значения, у оставшихся узлов указано `Alive = true`, выведенные узлы удалены, а запросы и загрузки успешно выполняются через нужную вычислительную группу.

Если операция не продвигается, проверьте вывод `kubectl describe ddc`, события Pod, привязку PVC и журналы Operator. Для Pod в состоянии `Pending` обычно нужно проверить размещение или хранилище; при `Decommissioning` — ход вывода из эксплуатации в Doris; при `ScaleDownFailed` — ошибку SQL в журнале Operator, доступность FE и права доступа. Устраните указанную причину, прежде чем повторять операцию или принудительно удалять ресурсы. См. [«Состояние и устранение неполадок»](../doris-operator/status-and-troubleshooting.md).
