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
- **Постоянное хранение данных**: хранение кеша, журналов и промежуточных данных StreamLoad
- **Масштабирование**: добавление и удаление узлов BE и вычислительных групп с проверкой результатов уменьшения кластера

## Сценарий 1: быстрое создание одной вычислительной группы {#scenario-1-quickly-set-up-a-single-compute-group}

### Минимальная конфигурация {#minimal-configuration}

Простейшая конфигурация вычислительной группы содержит всего три поля:

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
| `replicas` | Количество узлов сервиса BE в вычислительной группе |

### Инициализация системы узла {#be-system-initialization}

По умолчанию значение `skipDefaultSystemInit` равно `false`. Doris Operator добавляет привилегированный init-контейнер BE, который выполняет:

```shell
sysctl -w vm.max_map_count=2000000 && swapoff -a
```

Эти команды изменяют настройки базового узла Linux, в том числе настройки, общие для других рабочих нагрузок. При использовании kind на настольном компьютере затронутое ядро Linux может принадлежать виртуальной машине среды выполнения контейнеров. Действие такой инициализации не ограничивается процессом BE.

Если администраторы узлов уже задали необходимые настройки, установите `skipDefaultSystemInit: true` в существующей записи вычислительной группы. Сохраните в манифесте остальные поля и вычислительные группы:

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      skipDefaultSystemInit: true
```

В Doris 3.0.4 и более поздних версиях этот переключатель также добавляет `SKIP_CHECK_ULIMIT=true`, чтобы пропустить проверки некоторых системных параметров при запуске. Перед включением самостоятельно проверьте настройки узла.

## Сценарий 2: развертывание нескольких вычислительных групп для изоляции рабочих нагрузок {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

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

Количество реплик в каждой группе:

| Имя вычислительной группы | Реплики |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

Здесь `${beImage}` обозначает образ развертываемого сервиса BE.

:::tip Совет
Хотя вычислительные группы независимы друг от друга, рекомендуется использовать одинаковые образы сервиса BE во всех группах одного кластера с разделенными хранением и вычислениями.
:::

## Сценарий 3: ограничение вычислительных ресурсов группы {#scenario-3-limit-the-compute-resources-of-a-compute-group}

В [примере развертывания по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) для кластера с разделенными хранением и вычислениями ресурсы, используемые сервисом BE, не ограничены. Для задания ресурсов CPU и памяти `DorisDisaggregatedCluster` использует механизмы Kubernetes [resources.requests и resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits).

Например, чтобы выделить BE в группе `cg1` ресурсы 8c и 8Gi:

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

Чтобы настройки вступили в силу, внесите их в развертываемый [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations).

## Сценарий 4: настройка способа доступа к вычислительной группе {#scenario-4-configure-the-access-method-of-a-compute-group}

По умолчанию вычислительная группа не открывает прямой доступ к своим сервисам извне. Doris Operator предоставляет в ресурсе `DorisDisaggregatedCluster` Service, который служит посредником для доступа к группе. Service поддерживает три режима внешнего доступа. Выберите подходящий для своего источника запросов:

| Режим доступа | Сценарий применения | Особенности |
|------|------|------|
| `ClusterIP` | Доступ из кластера Kubernetes | Режим по умолчанию; предоставляет внутренний адрес кластера |
| `NodePort` | Доступ извне самостоятельно управляемого кластера Kubernetes | Открывает сервисы через порты хостов |
| `LoadBalancer` | Доступ извне кластера Kubernetes в облачной среде | Использует балансировщик нагрузки облачного провайдера |

### 4.1 ClusterIP (доступ внутри кластера) {#41-clusterip-access-within-the-cluster}

[Режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) предоставляет внутренний адрес кластера Kubernetes, через который можно обращаться к сервису изнутри кластера.

#### Шаг 1: выберите ClusterIP в качестве типа Service {#step-1-configure-clusterip-as-the-service-type}

Doris по умолчанию включает режим ClusterIP в Kubernetes. Дополнительная настройка не требуется.

#### Шаг 2: получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развертывания кластера просмотрите Service вычислительной группы следующей командой:

```shell
kubectl -n doris get svc
```

Результат выглядит так:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

В этом результате показан Service, через который можно обращаться к вычислительной группе с `uniqueId` `cg1` в пространстве имен `doris`.

### 4.2 NodePort (внешний доступ для самостоятельно управляемых кластеров) {#42-nodeport-external-access-for-self-managed-clusters}

Для доступа к Doris извне кластера Kubernetes выберите [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). NodePort поддерживает два способа выделения портов:

| Способ выделения | Описание |
|------|------|
| Динамическое выделение порта хоста | Если сопоставление портов явно не задано, Kubernetes при создании Pod автоматически выделяет свободный порт хоста (диапазон по умолчанию: 30000–32767) |
| Статическое выделение порта хоста | Если сопоставление портов задано явно, Kubernetes назначает указанный фиксированный порт при условии, что он свободен и не вызывает конфликтов |

Для статического выделения необходимо спланировать сопоставление портов. Doris предоставляет следующий порт для взаимодействия с внешними клиентами:

**Таблица 1: описание порта сервиса BE**

| Имя порта | Порт по умолчанию | Описание порта |
|------|------|------|
| Web Server Port | 8040 | Порт HTTP-сервера на BE, используемый для просмотра сведений о BE |

#### Настройка статического выделения {#static-allocation-configuration}

Следующий пример сопоставляет порт 8040 узла BE в группе `cg1` с портом 31012 хоста:

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

#### Настройка динамического выделения {#dynamic-allocation-configuration}

Чтобы использовать динамическое выделение порта NodePort для группы `cg1`, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer (внешний доступ в облачной среде) {#43-loadbalancer-external-access-in-cloud-environments}

[Режим LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) подходит для кластеров Kubernetes в облачных средах и использует балансировщик нагрузки облачного провайдера. Установите тип `LoadBalancer` в `computeGroup.service`, как показано ниже:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## Сценарий 5: настройка параметров запуска BE {#scenario-5-customize-the-be-startup-configuration}

При развертывании по умолчанию сервис BE каждой вычислительной группы запускается с файлом конфигурации из образа. Doris Operator использует Kubernetes ConfigMap для монтирования пользовательских файлов конфигурации запуска. Общая последовательность действий:

| Этап | Описание |
|------|------|
| Входные данные | Пользовательский файл конфигурации `be.conf` |
| Действие | Создать ConfigMap и смонтировать его в каталог `/etc/doris` |
| Результат | Сервис BE вычислительной группы запускается с пользовательской конфигурацией |

### Шаг 1: создайте ConfigMap с параметрами запуска {#step-1-create-a-configmap-that-contains-the-startup-information}

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
В конфигурации запуска сервиса BE кластера с разделенными хранением и вычислениями необходимо задать `file_cache_path`. Формат описан в разделе [«Конфигурация `be.conf` для кластера с разделенными хранением и вычислениями»](../../deploy-manually/separating-storage-compute-deploy-manually).
:::

### Шаг 2: разверните ConfigMap {#step-2-deploy-the-configmap}

Разверните ConfigMap с пользовательской конфигурацией запуска в кластере Kubernetes следующей командой:

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

Описание параметров:

| Параметр | Описание |
|------|------|
| `${namespace}` | Пространство имен, в котором развернут `DorisDisaggregatedCluster` |
| `${beConfigMapFileName}` | Имя файла с пользовательским ConfigMap |

### Шаг 3: обновите ресурс DorisDisaggregatedCluster {#step-3-update-the-dorisdisaggregatedcluster-resource}

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

## Сценарий 6: настройка постоянного хранилища для вычислительной группы {#scenario-6-configure-persistent-storage-for-a-compute-group}

При развертывании по умолчанию сервис BE использует Kubernetes [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) для кеша. `EmptyDir` не обеспечивает постоянного хранения: после перезапуска сервиса кешированные данные теряются, а эффективность запросов снижается.

Чтобы после перезапуска BE сохранить кешированные данные и эффективность запросов, настройте для кеша постоянное хранилище. Основные пути хранения, используемые сервисом BE:

| Путь хранения | Назначение |
|------|------|
| Каталог журналов BE | Журналы сервиса BE выводятся в стандартный вывод и записываются в каталог, указанный переменной `LOG_DIR` в конфигурации запуска |
| `/opt/apache-doris/be/storage` | Место временного хранения данных при загрузке в режиме StreamLoad; позволяет избежать потери этих данных после аварийного перезапуска сервиса |
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

Эта конфигурация задает следующее:

- Для каталога журналов используется пользовательская конфигурация хранилища и монтируется диск объемом 300Gi
- Для каталога, используемого WAL и загрузкой StreamLoad, монтируется диск объемом 300Gi
- Для каталога кеша используется шаблон хранилища и монтируется диск объемом 500Gi

:::tip Совет
Если массив `mountPaths` пуст, текущая конфигурация хранилища считается шаблонной.
:::

### 6.2 Отключение постоянного хранения журналов {#62-do-not-persist-logs}

Если журналы нужно выводить только в стандартный вывод без постоянного хранения, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## Сценарий 7: изменение вычислительной мощности {#scaling-compute-groups}

Масштабируйте вычислительную группу, изменяя ресурс `DorisDisaggregatedCluster`. Поле `replicas` обозначает количество узлов BE, а не количество копий данных в объектном хранилище. Увеличение значения добавляет вычислительные мощности; уменьшение удаляет узлы BE и их локальный кеш.

Описанные ниже процедуры относятся к [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1). Используйте CRD и образ Operator из одного выпуска. Поведение при уменьшении группы также зависит от образа BE: не следует считать, что каждый образ поддерживает плавное завершение работы.

### 7.1 Подготовка и проверка кластера {#71-prepare-and-inspect-the-cluster}

Перед изменением мощности:

- Убедитесь, что FE, MetaService, FoundationDB и действующие узлы BE работают нормально. Operator должен иметь возможность подключаться к FE с учетными данными администратора, заданными в разделе [«Настройка аутентификации»](config-cluster.md).
- Проверьте доступные в Kubernetes ресурсы CPU, памяти и хранилища, включая возможность привязки новых PVC. Оставьте достаточно готовых узлов BE для обслуживания оставшейся нагрузки.
- Перед уменьшением группы снизьте или перенаправьте трафик и дождитесь завершения выполняющихся запросов и заданий загрузки. После операции проверьте повторные попытки клиентов и состояние заданий загрузки.

В следующих примерах используются пространство имен `doris`, кластер `test-disaggregated-cluster` и вычислительная группа `cg1`. Замените эти имена своими:

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

Подключитесь к SQL-адресу FE от имени администратора и зафиксируйте текущие вычислительные группы и узлы BE:

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

Отредактируйте полный манифест, использованный для развертывания кластера, затем примените его:

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

Фрагменты YAML ниже показывают только изменяемые поля. Сохраните остальные поля и все другие записи в `spec.computeGroups`. Отсутствие существующей группы в манифесте означает запрос на ее удаление. Изменяйте пользовательский ресурс Doris, а не число реплик его StatefulSet напрямую, чтобы Operator мог согласовать метаданные Doris и ресурсы Kubernetes.

### 7.2 Увеличение существующей вычислительной группы {#72-scale-out-an-existing-compute-group}

Например, измените в полном манифесте количество узлов BE группы `cg1` с 2 до 3:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

Сохраните существующие `uniqueId`, образ, настройки ресурсов, ConfigMap и конфигурацию постоянных томов. Примените манифест. Operator увеличит число реплик StatefulSet, а новый BE зарегистрируется в кластере при запуске.

Убедитесь, что в группе готовы 3 Pod и что `SHOW BACKENDS` показывает новый BE со значением `Alive = true`. Новый узел начинает работу с пустым кешем: добавление узла не создает на нем сразу такой же кеш, как на существующих узлах.

### 7.3 Уменьшение существующей вычислительной группы {#73-scale-in-an-existing-compute-group}

Логическое поле уровня кластера `spec.enableDecommission` определяет способ удаления BE. По умолчанию его значение равно `false`:

| Значение | Поведение при уменьшении `replicas` вычислительной группы |
| --- | --- |
| `true` | Operator запускает вывод узлов Doris BE из эксплуатации и сохраняет прежнее число реплик StatefulSet на время этой операции. После вывода выбранных узлов из эксплуатации он удаляет их из Doris и уменьшает StatefulSet. |
| `false` | Выбранные BE удаляются из Doris без этапа вывода из эксплуатации. Operator 26.0.1 сначала использует процедуру плавного уменьшения группы, если образ BE ее поддерживает; иначе переходит к прямому удалению. |

Например, чтобы уменьшить `cg1` с 3 до 2 узлов через процедуру вывода из эксплуатации, измените полный манифест следующим образом и примените его:

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator выбирает узлы, порядковые номера Pod которых больше либо равны целевому числу реплик. Не удаляйте эти Pod вручную во время вывода из эксплуатации. Проверяйте ход операции командами:

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

В Doris выполните `SHOW BACKENDS;`. Проверка Operator ожидает, пока для выбранных BE не будут выполнены условия `SystemDecommissioned = true` и `TabletNum = 0` либо пока узлы не будут удалены. В ходе операции группа может оставаться в состоянии `Decommissioning`. Для завершения должны совпасть и целевое количество готовых Pod, и состав узлов BE в Doris.

:::caution Локальное хранилище при уменьшении группы
После уменьшения StatefulSet Operator 26.0.1 удаляет PVC, принадлежащие удаленным Pod. Дальнейшая судьба хранилища определяется политикой освобождения базового PV. Постоянное хранение кеша, журналов или промежуточных данных Stream Load не гарантирует сохранение этих томов после уменьшения группы. Прежде чем удалять BE, завершите зависящие от него задания загрузки и сохраните нужные журналы. Последующее увеличение группы не гарантирует восстановления прежних локальных данных.
:::

### 7.4 Добавление или удаление вычислительной группы целиком {#74-add-or-remove-an-entire-compute-group}

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

Примените полный манифест и дождитесь, пока `cg2` станет готовой и появится в `SHOW COMPUTE GROUPS`. Прежде чем направлять в нее трафик, настройте доступ пользователей и маршрутизацию нагрузки, как описано в разделе [«Управление вычислительными группами»](../../../compute-storage-decoupled/managing-compute-cluster.md). Добавление группы не переносит в нее существующие сеансы автоматически.

Перед удалением группы перенесите ее запросы и загрузки в другую доступную группу и обновите пользовательские настройки по умолчанию или настройки приложений, которые ссылаются на нее. Удалите из полного манифеста только запись этой группы и примените манифест. Operator удалит ее BE из метаданных Doris, затем удалит управляемые им Service и StatefulSet.

:::caution Удаление группы целиком отличается от уменьшения числа ее реплик
В Operator 26.0.1 удаление всей записи `computeGroups` приводит к прямому удалению BE, даже если `enableDecommission` имеет значение `true`. Не используйте удаление записи для постепенного вывода узлов из эксплуатации. После удаления проверьте, остались ли PVC, и обработайте их согласно своей политике хранения; не предполагайте, что очистка выполняется так же, как при уменьшении существующей группы.
:::

### 7.5 Изменение ресурсов и других компонентов {#75-resource-changes-and-other-components}

| Изменение | Действие и ограничения |
| --- | --- |
| Увеличение или уменьшение CPU и памяти на один BE | Измените `requests` и `limits` группы, как описано в сценарии 3, затем примените полный манифест. Это изменит шаблон Pod и может перезапустить BE. Перед применением проверьте доступные ресурсы для планирования Pod. |
| Масштабирование FE | Измените `spec.feSpec.replicas`. Значение должно быть не меньше `electionNumber`; дополнительные узлы FE становятся Observer. Перед уменьшением StatefulSet Operator удаляет выбранные Observer из Doris. Не меняйте `electionNumber` в существующем кластере. См. [«Настройка FE»](config-fe.md). |
| Изменение мощности MetaService, FoundationDB или Storage Vault | Управляйте ими независимо от количества реплик вычислительной группы. Сохраняйте их метаданные и хранилище. Уменьшение числа BE не требует удаления ресурсов этих компонентов или данных из объектного хранилища. См. [«Настройка MetaService»](config-ms.md) и [«Развертывание FoundationDB»](install-fdb.md). |

### 7.6 Проверка и устранение неполадок {#76-verify-and-troubleshoot}

После каждого изменения проверяйте одновременно состояние вычислительной группы в пользовательском ресурсе, готовность Pod и результат `SHOW BACKENDS`. Убедитесь, что достигнуто целевое количество узлов, сохраненные узлы имеют `Alive = true`, выведенные узлы удалены, а запросы и загрузки успешно выполняются через нужную вычислительную группу.

Если операция остановилась, проверьте результат `kubectl describe ddc`, события Pod, привязку PVC и журналы Operator. Для Pod в состоянии `Pending` обычно нужно проверить планирование или хранилище; при `Decommissioning` — ход вывода узлов из эксплуатации в Doris; при `ScaleDownFailed` — ошибку SQL, зафиксированную Operator, а также подключение к FE и права доступа. Устраните указанную причину, прежде чем повторять операцию или принудительно удалять ресурсы. См. [«Состояние и устранение неполадок»](../doris-operator/status-and-troubleshooting.md).

## Плановые перезапуски BE {#planned-be-restarts}

При временном перезапуске сохраняйте регистрацию BE и используйте плавное завершение работы. В режиме разделения вычислений и хранения Doris 4.1.5 команда `DECOMMISSION BACKEND` запускает постоянную операцию уменьшения группы: перезапуск Pod ее не отменяет, а команда `CANCEL DECOMMISSION BACKEND` не поддерживается. Для окончательного удаления BE используйте описанную выше процедуру уменьшения группы.

Отклонение обычной команды `DROP BACKEND` — предусмотренная защитная мера; явный синтаксис `DROPP BACKEND` описан в разделе [DROP BACKEND](../../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND.md). Для окончательного удаления предпочтительна процедура уменьшения группы через Operator, чтобы метаданные Doris и ресурсы Kubernetes оставались согласованными.

Doris Operator устанавливает для BE хук `preStop`. В стандартном образе Doris 4.1.5 этот хук вызывает `stop_be.sh --grace`; BE сообщает о состоянии завершения работы через heartbeat-сообщения и ожидает завершения выполняющихся запросов. Перед перезапуском:

1. Убедитесь, что остальные BE в вычислительной группе исправны и обладают достаточной мощностью.
2. Проверьте значение `terminationGracePeriodSeconds` созданного Pod. Оно должно покрывать ожидание запросов, задержку после завершения работы и накладные расходы выполнения. В Doris 4.1.5 значения по умолчанию: `grace_shutdown_wait_seconds=120` и `grace_shutdown_post_delay_seconds=30`. Operator 26.0.1 по умолчанию задает для Pod BE период завершения в 200 секунд, но явное значение `grace_shutdown_wait_seconds` в `be.conf` также изменяет значение в создаваемом Pod; проверяйте обе настройки вместе.
3. Удалите Pod обычным способом, чтобы выполнился `preStop`, без принудительного удаления:

   ```shell
   kubectl delete pod ${be_pod} -n ${namespace}
   ```

4. Дождитесь, пока новый Pod станет Ready, а `SHOW BACKENDS` покажет, что BE работает и состояние завершения работы сброшено. Проверьте запросы и загрузки, прежде чем перезапускать следующий BE.

В Operator 26.0.1 также есть двухэтапная процедура плавного последовательного обновления, для которой нужен совместимый образ BE. Стандартный образ Doris 4.1.5 не проходит проверку совместимости с этой процедурой, поэтому одного обновления Operator недостаточно, чтобы включить ее для данного образа. Механизмом плавной остановки остается существующий хук `preStop`. Плавное завершение снижает нарушения работы, но не может защитить выполняющиеся запросы при внезапной потере узла или принудительном завершении.
