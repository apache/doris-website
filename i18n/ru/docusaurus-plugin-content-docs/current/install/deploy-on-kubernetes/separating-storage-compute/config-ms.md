---
{
    "title": "Настройка MetaService",
    "language": "ru",
    "description": "Подробное руководство по настройке компонента управления метаданными MetaService, включая настройку доступа к FoundationDB, образа, ресурсов, параметров запуска и тайм-аутов проверок сервиса.",
    "keywords": ["Doris", "Storage-Compute Decoupled", "Kubernetes", "MetaService", "FoundationDB", "Metadata", "Configuration"]
}
---

## Что вы узнаете в этой главе {#what-you-will-learn-in-this-chapter}

- Как настроить параметры подключения MetaService к FoundationDB
- Как выбрать версию образа MetaService
- Как выделить MetaService подходящие вычислительные ресурсы
- Как настроить параметры запуска MetaService с помощью ConfigMap
- Как настроить тайм-аут проверки работоспособности и тайм-аут запуска MetaService

## Обзор {#overview}

MetaService — компонент управления метаданными кластера Doris с разделением хранения и вычислений. Он используется только внутри кластера и недоступен извне. Это сервис без состояния, который обычно развёртывают в режиме active-standby. В этой главе описана настройка MetaService в ресурсе `DorisDisaggregatedCluster`.

В таблице ниже приведён полный набор параметров конфигурации:

| Задача настройки | Поле конфигурации | Обязательность | Когда применяется |
|----------|----------|----------|----------|
| Подключение к FoundationDB | `fdb.configMapNamespaceName` или `fdb.address` | Обязательно | Во всех сценариях |
| Выбор образа | `image` | Необязательно | Если версия образа из примера развёртывания вам не подходит |
| Выделение вычислительных ресурсов | `requests` / `limits` | Необязательно | Если нужно ограничить использование CPU и памяти |
| Настройка параметров запуска | `configMaps` | Необязательно | Если нужно изменить параметры запуска по умолчанию |
| Тайм-аут проверки работоспособности | `liveTimeout` | Необязательно | Если значение по умолчанию 180 секунд вам не подходит |
| Тайм-аут запуска | `startTimeout` | Необязательно | Если значение по умолчанию 300 секунд вам не подходит |

## 1. Подключение к FoundationDB {#1-connect-to-foundationdb}

MetaService использует FoundationDB для хранения метаданных, поэтому необходимо настроить параметры доступа к FoundationDB. Есть два способа настройки в зависимости от того, как развёрнут FoundationDB:

| Способ развёртывания FoundationDB | Рекомендуемый способ настройки | Поле конфигурации |
|----------------------|--------------|----------|
| В Kubernetes с помощью `fdb-kubernetes-operator` | Указать ссылку на ConfigMap, автоматически созданный Operator | `fdb.configMapNamespaceName` |
| Непосредственно на физических машинах | Указать адрес доступа напрямую | `fdb.address` |

### Способ 1: Настройка параметров доступа через ConfigMap {#method-1-configure-access-information-through-a-configmap}

Если кластер FoundationDB развёрнут с помощью `fdb-kubernetes-operator`, можно напрямую использовать ConfigMap, который автоматически создаёт Operator. Этот ConfigMap содержит адрес доступа к FoundationDB:

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
- `${namespace}`: пространство имён, в котором развёрнут FoundationDB

Чтобы найти ConfigMap, созданный `fdb-kubernetes-operator`, см. раздел [Получение ConfigMap с параметрами доступа к FoundationDB](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information) в главе о развёртывании FoundationDB.

### Способ 2: Прямое указание адреса доступа {#method-2-configure-the-access-address-directly}

Если FoundationDB развёрнут на физических машинах, адрес доступа можно указать непосредственно в конфигурации MetaService:

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

Описание параметров:

- `${fdbEndpoint}`: адрес для доступа к FoundationDB

Чтобы найти этот адрес при развёртывании на физических машинах, см. раздел [Получение `fdb_cluster` для развёртывания MetaService](../../deploy-manually/separating-storage-compute-deploy-manually) в главе о разделении хранения и вычислений.

## 2. Выбор образа {#2-customize-the-image}

Образ MetaService, указанный в примере развёртывания, может быть не самой последней версии. Чтобы задать версию образа, используйте следующий формат:

```yaml
spec:
  metaService:
    image: ${msImage}
```

Описание параметров:

- `${msImage}`: образ MetaService для развёртывания. Используйте официальный [образ MetaService](https://hub.docker.com/r/apache/doris) от Doris (тег образа содержит префикс `ms`).

## 3. Выделение вычислительных ресурсов {#3-allocate-compute-resources}

Используйте ограничения ресурсов Kubernetes, чтобы выделить MetaService подходящее количество CPU и памяти. Например, следующая конфигурация ограничивает ресурсы MetaService до 4 ядер CPU и 4Gi памяти:

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

Примените приведённую выше конфигурацию к [ресурсу DorisDisaggregatedCluster, который вы хотите развернуть](./install-doris-cluster.md#2-modify-key-configurations).

## 4. Настройка конфигурации запуска {#4-customize-startup-configuration}

Если параметры запуска по умолчанию вам не подходят, можно смонтировать собственный файл конфигурации запуска с помощью ConfigMap. Doris-Operator позволяет настраивать каждый компонент, монтируя его файл конфигурации запуска через ConfigMap.

Общий порядок действий:

| Этап | Описание |
|------|------|
| Входные данные | Пользовательский файл конфигурации `doris_cloud.conf` |
| Действие | Создать ConfigMap и смонтировать его в каталог `/etc/doris` |
| Результат | MetaService запускается с пользовательской конфигурацией |

:::tip Подсказка
Doris-Operator автоматически заполняет параметры FoundationDB в конфигурации запуска MetaService, поэтому при настройке конфигурации запуска задавать `fdb_cluster` не нужно и не следует.
:::

### Шаг 1: Создание пользовательского ConfigMap {#step-1-create-a-custom-configmap}

Файл конфигурации запуска должен называться `doris_cloud.conf`. Ниже приведён пример:

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    # // meta_service
    brpc_listen_port = 5000
    brpc_num_threads = -1
    brpc_idle_timeout_sec = 30
    http_token = greedisgood9999

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

### Шаг 2: Монтирование пользовательской конфигурации запуска {#step-2-mount-the-custom-startup-configuration}

В ресурсе `DorisDisaggregatedCluster` смонтируйте созданный выше ConfigMap с помощью `metaService.configMaps`:

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

Описание параметров:

- `${msConfigMapName}`: имя ConfigMap, содержащего конфигурацию запуска MetaService
- `mountPath`: точка монтирования должна быть `/etc/doris`

Примените приведённую выше конфигурацию к [ресурсу DorisDisaggregatedCluster](./install-doris-cluster.md#2-modify-key-configurations), который вы хотите развернуть.

## 5. Настройка тайм-аутов проверок сервиса {#5-configure-service-probe-timeouts}

Doris Operator предоставляет два параметра тайм-аута для сервисов кластера с разделением хранения и вычислений:

| Тип проверки | Поле конфигурации | Значение по умолчанию | Этап | Условие срабатывания |
|----------|----------|--------|----------|----------|
| Проверка работоспособности (LivenessProbe) | `liveTimeout` | 180 секунд | Во время работы сервиса | Если проверка не проходит в течение времени, превышающего заданный порог, сервис принудительно перезапускается |
| Тайм-аут запуска | `startTimeout` | 300 секунд | Во время запуска сервиса | Если время запуска превышает заданный порог, сервис принудительно перезапускается |

### Настройка тайм-аута проверки работоспособности {#liveness-probe-timeout-configuration}

Проверка работоспособности отслеживает состояние работающего сервиса. Например, чтобы задать тайм-аут проверки работоспособности в 30 секунд:

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### Настройка тайм-аута запуска {#startup-timeout-configuration}

Тайм-аут запуска позволяет обрабатывать ситуации, когда сервис запускается слишком долго. Например, чтобы задать тайм-аут запуска в 120 секунд:

```yaml
spec:
  metaService:
    startTimeout: 120
```
