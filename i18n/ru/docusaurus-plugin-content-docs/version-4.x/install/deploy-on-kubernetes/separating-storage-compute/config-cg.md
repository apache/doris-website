---
{
    "title": "Настройка вычислительных групп",
    "language": "ru",
    "description": "Настройка вычислительных групп Doris в Kubernetes: количество узлов BE, ресурсы CPU и памяти, доступ к сервисам, параметры запуска, постоянное хранилище и масштабирование.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Вычислительная группа — это набор узлов BE, выполняющих одну и ту же задачу. В этом документе описана настройка вычислительных групп в ресурсе `DorisDisaggregatedCluster` для разных сценариев:

- **Базовое развертывание**: быстрая настройка одной или нескольких вычислительных групп
- **Управление ресурсами**: ограничение вычислительных ресурсов, включая CPU и память
- **Управление доступом**: доступ к сервисам BE изнутри и извне кластера разными способами
- **Настройка запуска**: настройка параметров запуска BE через ConfigMap
- **Сохранение данных**: постоянное хранилище для кеша, журналов и временных данных StreamLoad
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
| `uniqueId` | Уникальный идентификатор вычислительной группы, который также служит ее именем. После задания изменить его нельзя. Имя должно соответствовать шаблону `[a-zA-Z][0-9a-zA-Z_]+` |
| `image` | Адрес образа для развертывания сервиса BE. Используйте образы из [официального реестра образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `replicas` | Количество узлов сервиса BE в вычислительной группе |

## Сценарий 2: Развертывание нескольких вычислительных групп для изоляции рабочих нагрузок {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

Ресурс `DorisDisaggregatedCluster` поддерживает развертывание нескольких независимых вычислительных групп. Ниже показана конфигурация двух групп с именами `cg1` и `cg2`:

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

Количество реплик для каждой группы:

| Имя вычислительной группы | Количество реплик |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

Здесь `${beImage}` обозначает образ развертываемого сервиса BE.

:::tip Совет
Хотя вычислительные группы независимы друг от друга, рекомендуется использовать одинаковые образы сервиса BE для всех групп в одном кластере с разделенными хранением и вычислениями.
:::

## Сценарий 3: Ограничение вычислительных ресурсов группы {#scenario-3-limit-the-compute-resources-of-a-compute-group}

В [примере развертывания по умолчанию](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) для архитектуры с разделенными хранением и вычислениями ресурсы сервиса BE не ограничены. `DorisDisaggregatedCluster` использует механизмы Kubernetes [resources.requests и resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) для задания ресурсов CPU и памяти.

Например, чтобы выделить BE в группе `cg1` ресурсы 8c 8Gi:

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

Добавьте эту конфигурацию в развертываемый [ресурс `DorisDisaggregatedCluster`](./install-doris-cluster.md#2-modify-key-configurations), чтобы она вступила в силу.

## Сценарий 4: Настройка способа доступа к вычислительной группе {#scenario-4-configure-the-access-method-of-a-compute-group}

По умолчанию вычислительная группа не предоставляет прямой доступ к сервисам извне. Doris Operator создает в ресурсе `DorisDisaggregatedCluster` Service, который служит точкой доступа к вычислительной группе. Service поддерживает три режима внешнего доступа. Выберите режим в зависимости от того, откуда требуется доступ:

| Режим доступа | Когда использовать | Особенности |
|------|------|------|
| `ClusterIP` | Доступ изнутри кластера Kubernetes | Режим по умолчанию; предоставляет внутренний адрес кластера |
| `NodePort` | Доступ извне самостоятельно управляемого кластера Kubernetes | Открывает сервисы через порты узлов кластера |
| `LoadBalancer` | Доступ извне кластера Kubernetes в облачной платформе | Использует балансировщик нагрузки облачного провайдера |

### 4.1 ClusterIP (доступ внутри кластера) {#41-clusterip-access-within-the-cluster}

[Режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) предоставляет внутренний адрес в кластере Kubernetes, через который можно обращаться к сервису изнутри Kubernetes.

#### Шаг 1: Укажите ClusterIP в качестве типа Service {#step-1-configure-clusterip-as-the-service-type}

Doris по умолчанию включает режим доступа ClusterIP в Kubernetes. Дополнительная настройка не требуется.

#### Шаг 2: Получите адрес доступа к Service {#step-2-get-the-service-access-address}

После развертывания кластера просмотрите Service вычислительной группы следующей командой:

```shell
kubectl -n doris get svc
```

Результат выглядит так:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

В этом результате показан Service, через который доступна вычислительная группа с `uniqueId` `cg1` в пространстве имен `doris`.

### 4.2 NodePort (внешний доступ к самостоятельно управляемым кластерам) {#42-nodeport-external-access-for-self-managed-clusters}

Для доступа к Doris извне кластера Kubernetes выберите [режим NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). NodePort поддерживает два способа назначения портов:

| Способ назначения | Описание |
|------|------|
| Динамическое назначение порта узла | Если сопоставление портов не задано явно, Kubernetes при создании Pod автоматически назначает свободный порт узла (диапазон по умолчанию: 30000-32767) |
| Статическое назначение порта узла | Если сопоставление портов задано явно, Kubernetes назначает указанный порт, если он свободен и не возникает конфликтов |

Для статического назначения нужно заранее спланировать сопоставление портов. Doris предоставляет следующие порты для взаимодействия с внешними системами:

**Таблица 1: Описание портов сервиса BE**

| Название порта | Порт по умолчанию | Описание порта |
|------|------|------|
| Порт веб-сервера | 8040 | Порт HTTP-сервера BE, используемый для просмотра сведений о BE |

#### Настройка статического назначения {#static-allocation-configuration}

Следующий пример сопоставляет порт 8040 на BE в вычислительной группе `cg1` с портом 31012 на узле кластера:

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

Ниже приведена конфигурация для использования динамического назначения NodePort вычислительной группой `cg1`:

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

При развертывании по умолчанию сервис BE каждой вычислительной группы запускается с файлом конфигурации из образа. Doris Operator использует Kubernetes ConfigMap для монтирования пользовательских файлов конфигурации запуска. Общая последовательность выглядит так:

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
В конфигурации запуска сервиса BE в кластере с разделенными хранением и вычислениями необходимо задать `file_cache_path`. Формат описан в разделе [«Настройка `be.conf` для архитектуры с разделенными хранением и вычислениями»](../../deploy-manually/separating-storage-compute-deploy-manually).
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

При развертывании по умолчанию сервис BE использует Kubernetes [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) для кеша. Режим `EmptyDir` не обеспечивает постоянное хранение: после перезапуска сервиса кешированные данные теряются, из-за чего снижается эффективность запросов.

Чтобы сохранить кешированные данные после перезапуска BE и избежать снижения эффективности запросов, настройте для кеша постоянное хранилище. Основные пути хранения данных сервиса BE:

| Путь хранения | Назначение |
|------|------|
| Каталог журналов BE | Журналы сервиса BE выводятся в стандартный поток вывода, а также записываются в каталог, указанный параметром `LOG_DIR` в конфигурации запуска |
| `/opt/apache-doris/be/storage` | Место временного хранения данных при загрузке через StreamLoad; помогает предотвратить потерю временных данных после аварийного перезапуска сервиса |
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

- Для каталога журналов используется отдельная конфигурация хранилища с диском объемом 300Gi
- Для каталога WAL и загрузок StreamLoad монтируется диск объемом 300Gi
- Для каталога кеша используется шаблон хранилища с диском объемом 500Gi

:::tip Совет
Если массив `mountPaths` пуст, текущая конфигурация хранилища рассматривается как шаблон.
:::

### 6.2 Отключение постоянного хранения журналов {#62-do-not-persist-logs}

Чтобы журналы выводились только в стандартный поток вывода и не сохранялись в постоянном хранилище, задайте следующую конфигурацию:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## Сценарий 7: Масштабирование вычислительных ресурсов {#scaling-compute-groups}

Для масштабирования вычислительной группы измените ресурс `DorisDisaggregatedCluster`. Поле `replicas` задает количество узлов BE, а не копий данных в объектном хранилище. Увеличение значения добавляет вычислительные ресурсы; уменьшение удаляет узлы BE и их локальный кеш.

Приведенные ниже процедуры относятся к [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1). Используйте CRD и образ Operator из одного выпуска. Поведение при уменьшении масштаба также зависит от образа BE: не следует считать, что каждый образ поддерживает корректное завершение работы.

### 7.1 Подготовка и проверка кластера {#71-prepare-and-inspect-the-cluster}

Перед изменением вычислительных ресурсов:

- Убедитесь, что FE, MetaService, FoundationDB и текущие узлы BE исправны. Operator должен иметь возможность подключиться к FE с учетными данными администратора, заданными в разделе [«Настройка аутентификации»](config-cluster.md).
- Проверьте доступные ресурсы CPU, памяти и хранилища Kubernetes, включая возможность привязки новых PVC. Оставьте достаточно готовых узлов BE для обработки оставшейся нагрузки.
- Перед уменьшением масштаба сначала снизьте или перенаправьте трафик и дождитесь завершения выполняющихся запросов и заданий загрузки. После операции проверьте повторные попытки клиентов и состояние заданий загрузки.

В следующих примерах используются пространство имен `doris`, кластер `test-disaggregated-cluster` и вычислительная группа `cg1`. Замените эти имена своими:

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

Подключитесь к SQL-интерфейсу FE с правами администратора и запишите текущие вычислительные группы и узлы BE:

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

Измените полный манифест, использованный для развертывания кластера, затем примените его:

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

В приведенных ниже фрагментах YAML показаны только изменяемые поля. Сохраните остальные поля и все другие записи в `spec.computeGroups`. Если убрать существующую группу из манифеста, это будет запросом на ее удаление. Изменяйте пользовательский ресурс Doris, а не масштабируйте его StatefulSet напрямую: так Operator сможет согласовать метаданные Doris и ресурсы Kubernetes.

### 7.2 Увеличение существующей вычислительной группы {#72-scale-out-an-existing-compute-group}

Например, в полном манифесте измените количество узлов BE группы `cg1` с 2 до 3:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

Сохраните существующие `uniqueId`, образ, настройки ресурсов, ConfigMaps и конфигурацию постоянных томов. Примените манифест. Operator увеличит число реплик StatefulSet, а новый BE зарегистрируется в кластере при запуске.

Проверьте, что в группе стало 3 готовых Pod и что новый BE указан в результате `SHOW BACKENDS` со значением `Alive = true`. Кеш нового узла сначала пуст: добавленный узел не получит кеш существующих узлов сразу.

### 7.3 Уменьшение существующей вычислительной группы {#73-scale-in-an-existing-compute-group}

Логическое поле уровня кластера `spec.enableDecommission` определяет способ удаления BE. По умолчанию его значение — `false`:

| Значение | Поведение при уменьшении `replicas` вычислительной группы |
| --- | --- |
| `true` | Запускаются операции вывода BE из эксплуатации в Doris, а исходное количество реплик StatefulSet сохраняется до их завершения. Затем выбранные узлы удаляются из Doris и StatefulSet уменьшается. |
| `false` | Выбранные BE удаляются из Doris без этапа вывода из эксплуатации. Operator 26.0.1 сначала использует процедуру корректного уменьшения масштаба, если образ BE ее поддерживает; иначе он переходит к непосредственному удалению. |

Например, чтобы уменьшить `cg1` с 3 до 2 узлов через процедуру вывода из эксплуатации, измените полный манифест следующим образом и примените его:

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator выбирает узлы, порядковые номера Pod которых больше либо равны целевому количеству реплик. Во время вывода из эксплуатации не удаляйте эти Pod вручную. Проверяйте ход операции командами:

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

В Doris выполните `SHOW BACKENDS;`. При проверке вывода из эксплуатации Operator ожидает, пока для выбранных BE не будут выполнены условия `SystemDecommissioned = true` и `TabletNum = 0` либо пока эти узлы уже не окажутся удалены. Во время этого процесса группа может оставаться в состоянии `Decommissioning`. Для завершения операции и количество готовых Pod, и состав узлов BE в Doris должны соответствовать целевому состоянию.

:::caution Локальное хранилище при уменьшении масштаба
Operator 26.0.1 удаляет PVC, принадлежащие удаленным Pod, после уменьшения StatefulSet. Дальнейшая судьба хранилища зависит от политики освобождения базового PV. Постоянное хранение кеша, журналов или временных данных Stream Load не гарантирует сохранение этих томов после уменьшения масштаба. Перед удалением BE завершите зависящие от него задания загрузки и сохраните нужные журналы. Последующее увеличение масштаба не гарантирует восстановления прежних локальных данных.
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

Примените полный манифест и дождитесь, пока `cg2` будет готова и появится в результате `SHOW COMPUTE GROUPS`. Перед направлением трафика в новую группу настройте доступ пользователей и маршрутизацию нагрузки, как описано в разделе [«Управление вычислительными группами»](../../../compute-storage-decoupled/managing-compute-cluster.md). Добавление группы не переносит существующие сеансы в нее автоматически.

Чтобы удалить группу, сначала перенесите ее запросы и загрузки в другую доступную группу и обновите настройки пользователей по умолчанию или приложений, в которых она указана. Удалите из полного манифеста только запись этой группы и примените его. Operator удалит ее BE из метаданных Doris, а затем удалит управляемые им Service и StatefulSet.

:::caution Удаление группы целиком отличается от уменьшения числа ее узлов
В Operator 26.0.1 удаление всей записи `computeGroups` использует процедуру непосредственного удаления BE, даже если значение `enableDecommission` равно `true`. Удаление записи не запускает постепенный вывод узлов из эксплуатации. После удаления проверьте, остались ли PVC, и обработайте их согласно своей политике хранения. Не предполагайте, что очистка происходит так же, как при уменьшении существующей группы.
:::

### 7.5 Изменение ресурсов и масштабирование других компонентов {#75-resource-changes-and-other-components}

| Изменение | Действие и ограничение |
| --- | --- |
| Увеличение или уменьшение CPU и памяти на один BE | Измените `requests` и `limits` группы, как описано в сценарии 3, затем примените полный манифест. Это изменит шаблон Pod и может привести к перезапуску BE. Перед применением проверьте доступные ресурсы для планирования Pod. |
| Масштабирование FE | Измените `spec.feSpec.replicas`. Значение должно быть не меньше `electionNumber`; дополнительные узлы FE становятся Observers. Перед уменьшением StatefulSet Operator удаляет выбранные Observers из Doris. Не изменяйте `electionNumber` в существующем кластере. См. [«Настройка FE»](config-fe.md). |
| Изменение ресурсов MetaService, FoundationDB или Storage Vault | Управляйте ими отдельно от количества реплик вычислительных групп. Сохраняйте их метаданные и хранилище. Уменьшение группы BE не требует удаления ресурсов этих компонентов или данных из объектного хранилища. См. [«Настройка MetaService»](config-ms.md) и [«Развертывание FoundationDB»](install-fdb.md). |

### 7.6 Проверка и устранение неполадок {#76-verify-and-troubleshoot}

После каждого изменения проверяйте одновременно состояние вычислительной группы в пользовательском ресурсе, готовность Pod и результат `SHOW BACKENDS`. Убедитесь, что количество узлов соответствует целевому, у оставшихся узлов `Alive = true`, выведенные узлы удалены, а запросы и загрузки успешно выполняются через нужную вычислительную группу.

Если операция не завершается, проверьте вывод `kubectl describe ddc`, события Pod, привязку PVC и журналы Operator. Для Pod в состоянии `Pending` обычно нужно проверить планирование или хранилище; при `Decommissioning` — ход вывода узлов из эксплуатации в Doris; при `ScaleDownFailed` — ошибку SQL в журнале Operator, подключение к FE и права доступа. Устраните указанную причину, прежде чем повторять попытку или принудительно удалять ресурсы. См. [«Состояние и устранение неполадок»](../doris-operator/status-and-troubleshooting.md).
