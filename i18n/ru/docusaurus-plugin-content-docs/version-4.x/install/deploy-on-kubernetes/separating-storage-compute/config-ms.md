---
{
    "title": "Настройка MetaService",
    "language": "ru",
    "description": "Подробное руководство по настройке компонента управления метаданными MetaService: доступ к FoundationDB, образ, ресурсы, параметры запуска и тайм-ауты проверок состояния службы.",
    "keywords": ["Doris", "Разделение хранения и вычислений", "Kubernetes", "MetaService", "FoundationDB", "Метаданные", "Настройка"]
}
---

Перед настройкой доступа к FDB убедитесь, что сборка MetaService содержит клиент, совместимый с серией версий сервера FDB. Установка клиента Operator не обновляет MetaService. Зафиксированная версия для установки и варианты обеспечения совместимости описаны в разделе [Развертывание FoundationDB](install-fdb.md). При удалении отдельного кластера Doris сохраняйте общую FDB.

## Что вы узнаете из этой главы {#what-you-will-learn-in-this-chapter}

- Как настроить подключение MetaService к FoundationDB
- Как выбрать версию образа MetaService
- Как выделить MetaService необходимые вычислительные ресурсы
- Как настроить параметры запуска MetaService через ConfigMap
- Как настроить тайм-аут проверки работоспособности и тайм-аут запуска MetaService

## Обзор {#overview}

MetaService — компонент управления метаданными кластера Doris с разделением хранения и вычислений. Он используется только внутри кластера и не доступен извне. Это служба без состояния, которую обычно развертывают по схеме «основной — резервный». В этой главе описана настройка MetaService в ресурсе `DorisDisaggregatedCluster`.

Ниже приведен полный перечень параметров настройки:

| Сценарий настройки | Поле настройки | Обязательность | Когда применяется |
|----------|----------|----------|----------|
| Подключение к FoundationDB | `fdb.configMapNamespaceName` или `fdb.address` | Обязательно | Во всех сценариях |
| Выбор образа | `image` | Необязательно | Если версия образа из примера развертывания вам не подходит |
| Выделение вычислительных ресурсов | `requests` / `limits` | Необязательно | Если нужно ограничить использование CPU и памяти |
| Настройка параметров запуска | `configMaps` | Необязательно | Если нужно изменить параметры запуска по умолчанию |
| Тайм-аут проверки работоспособности | `liveTimeout` | Необязательно | Если тайм-аут по умолчанию в 180 секунд вам не подходит |
| Тайм-аут запуска | `startTimeout` | Необязательно | Если тайм-аут по умолчанию в 300 секунд вам не подходит |

## 1. Подключение к FoundationDB {#1-connect-to-foundationdb}

MetaService хранит метаданные в FoundationDB, поэтому необходимо настроить доступ к FoundationDB. Способ настройки зависит от того, как развернута FoundationDB:

| Способ развертывания FoundationDB | Рекомендуемый способ настройки | Поле настройки |
|----------------------|--------------|----------|
| В Kubernetes через `fdb-kubernetes-operator` | Указать ConfigMap, автоматически созданный Operator | `fdb.configMapNamespaceName` |
| Непосредственно на физических серверах | Указать адрес доступа напрямую | `fdb.address` |

### Способ 1. Настройка доступа через ConfigMap {#method-1-configure-access-information-through-a-configmap}

Если кластер FoundationDB развернут через `fdb-kubernetes-operator`, можно использовать ConfigMap, который Operator создает автоматически. Этот ConfigMap содержит адрес доступа к FoundationDB:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}
        namespace: ${namespace}
```

Описание параметров:

- `${foundationdbConfigMapName}`: имя ConfigMap
- `${namespace}`: пространство имен, в котором развернута FoundationDB

Как найти ConfigMap, созданный `fdb-kubernetes-operator`, описано в разделе [Получение ConfigMap с данными для доступа к FoundationDB](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information) главы о развертывании FoundationDB.

### Способ 2. Указание адреса доступа напрямую {#method-2-configure-the-access-address-directly}

Если FoundationDB развернута на физических серверах, адрес доступа можно указать непосредственно в конфигурации MetaService:

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

Описание параметра:

- `${fdbEndpoint}`: адрес для доступа к FoundationDB

Как найти этот адрес при развертывании на физических серверах, описано в разделе [Получение `fdb_cluster` для развертывания MetaService](../../deploy-manually/separating-storage-compute-deploy-manually) главы о разделении хранения и вычислений.

## 2. Выбор образа {#2-customize-the-image}

Образ MetaService, указанный в примере развертывания, может быть не самой новой версии. Чтобы указать нужную версию образа, используйте следующий формат:

```yaml
spec:
  metaService:
    image: ${msImage}
```

Описание параметра:

- `${msImage}`: образ MetaService для развертывания. Используйте официальный [образ MetaService](https://hub.docker.com/r/apache/doris) от Doris: его тег содержит префикс `ms`.

## 3. Выделение вычислительных ресурсов {#3-allocate-compute-resources}

Используйте ограничения ресурсов Kubernetes, чтобы выделить MetaService необходимое количество CPU и памяти. Например, следующая конфигурация задает для MetaService 4 ядра CPU и 4Gi памяти:

```yaml
spec:
  metaService:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

Примените эту конфигурацию к [ресурсу DorisDisaggregatedCluster, который хотите развернуть](./install-doris-cluster.md#2-modify-key-configurations).

## 4. Настройка конфигурации запуска {#4-customize-startup-configuration}

Если параметры запуска по умолчанию вам не подходят, можно подключить собственный файл конфигурации запуска через ConfigMap. Doris-Operator позволяет настраивать запуск каждого компонента, подключая его файл конфигурации через ConfigMap.

Общая последовательность действий:

| Этап | Описание |
|------|------|
| Входные данные | Собственный файл конфигурации `doris_cloud.conf` |
| Действие | Создать ConfigMap и подключить его к каталогу `/etc/doris` |
| Результат | MetaService запускается с заданной конфигурацией |

:::tip Совет
Doris-Operator автоматически заполняет параметры FoundationDB в конфигурации запуска MetaService. Поэтому при настройке запуска указывать `fdb_cluster` не нужно и не следует.
:::

### Шаг 1. Создайте ConfigMap с собственной конфигурацией {#step-1-create-a-custom-configmap}

Файл конфигурации запуска должен называться `doris_cloud.conf`. Пример:

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    # // meta_service
    brpc_listen_port = 5000
    brpc_num_threads = -1
    brpc_idle_timeout_sec = 30
    http_token = <custom-http-token>

    # // doris txn config
    label_keep_max_second = 259200
    expired_txn_scan_key_nums = 1000

    # // logging
    log_dir = ./log/
    # info warn error
    log_level = info
    log_size_mb = 1024
    log_filenum_quota = 10
    log_immediate_flush = false
    # log_verbose_modules = *

    # //max stage num
    max_num_stages = 40
kind: ConfigMap
metadata:
  name: doris-metaservice
  namespace: default
```

### Шаг 2. Подключите собственную конфигурацию запуска {#step-2-mount-the-custom-startup-configuration}

В ресурсе `DorisDisaggregatedCluster` подключите созданный ConfigMap через `metaService.configMaps`:

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

Описание параметров:

- `${msConfigMapName}`: имя ConfigMap с конфигурацией запуска MetaService
- `mountPath`: точка подключения должна быть `/etc/doris`

Примените эту конфигурацию к [ресурсу DorisDisaggregatedCluster](./install-doris-cluster.md#2-modify-key-configurations), который хотите развернуть.

### Настройка HTTP-токена для управления {#ms-http-token}

`http_token` используется для аутентификации запросов к HTTP API управления MetaService. Его значение по умолчанию — `greedisgood9999`. Замените `<custom-http-token>` в примере собственной случайной строкой. Поместите `doris_cloud.conf` в одноименный ключ ConfigMap и укажите этот ConfigMap через `spec.metaService.configMaps`, как показано выше.

Клиенты API передают токен в параметре запроса `token`. Doris Operator считывает `http_token` из указанного ConfigMap для HTTP-запросов управления, поэтому обновляйте ConfigMap, чтобы конфигурации Operator и MetaService совпадали. RPC-вызовы FE и BE для работы с метаданными не используют этот токен. Для образов, в которых узлы регистрируются через FE SQL, например Doris 4.1.5, изменение токена не требует изменений или перезапуска FE либо BE. [Учетные данные администратора Doris в `spec.authSecret`](config-cluster.md) не зависят от `http_token`.

Чтобы сменить токен после развертывания:

1. Обновите `http_token` в файле `doris_cloud.conf` в указанном ConfigMap, сохранив остальные параметры. Задайте один и тот же новый токен для всех реплик MetaService.
2. Перезапускайте Pod MetaService по одному. Прежде чем переходить к следующему Pod, дождитесь, пока текущий перейдет в состояние Ready. Если развернута только одна реплика, MetaService будет временно недоступен во время перезапуска.
3. Проверьте новый токен на каждой реплике MetaService с помощью HTTP API управления, который доступен только для чтения и требует аутентификации по токену. Одно лишь состояние Ready у Pod не подтверждает смену токена.
4. Обновите инструменты администрирования, которые обращаются к этим API.

MetaService загружает `http_token` при запуске. Одно лишь обновление ConfigMap не меняет токен в работающем процессе и не гарантирует автоматического перезапуска. Во время смены токена реплики могут временно использовать разные токены, из-за чего аутентификация HTTP-запросов управления может завершаться ошибкой. В этот период не выполняйте операции управления узлами, зависящие от этих API.

## 5. Настройка тайм-аутов проверок службы {#5-configure-service-probe-timeouts}

Doris Operator предоставляет два параметра тайм-аута для служб кластера с разделением хранения и вычислений:

| Тип проверки | Поле настройки | Значение по умолчанию | Этап | Условие срабатывания |
|----------|----------|--------|----------|----------|
| Проверка работоспособности (LivenessProbe) | `liveTimeout` | 180 секунд | Во время работы службы | Если проверка не проходит дольше заданного времени, служба принудительно перезапускается |
| Тайм-аут запуска | `startTimeout` | 300 секунд | Во время запуска службы | Если время запуска превышает заданное значение, служба принудительно перезапускается |

### Настройка тайм-аута проверки работоспособности {#liveness-probe-timeout-configuration}

Проверка работоспособности отслеживает состояние работающей службы. Например, чтобы установить тайм-аут проверки работоспособности в 30 секунд:

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### Настройка тайм-аута запуска {#startup-timeout-configuration}

Тайм-аут запуска помогает в случаях, когда запуск службы занимает слишком много времени. Например, чтобы установить тайм-аут запуска в 120 секунд:

```yaml
spec:
  metaService:
    startTimeout: 120
```
