---
{
    "title": "Настройка MetaService",
    "language": "ru",
    "description": "Подробное руководство по настройке компонента управления метаданными MetaService: доступа к FoundationDB, образа, ресурсов, параметров запуска и времени ожидания проверок сервиса.",
    "keywords": ["Doris", "Storage-Compute Decoupled", "Kubernetes", "MetaService", "FoundationDB", "Metadata", "Configuration"]
}
---

Перед настройкой доступа к FDB убедитесь, что сборка MetaService содержит клиент, совместимый с используемой линейкой версий сервера FDB; установка клиента Operator не обновляет MetaService. Варианты установки закреплённой версии и обеспечения совместимости описаны в разделе [Развёртывание FoundationDB](install-fdb.md). При удалении отдельного кластера Doris сохраняйте общую FDB.

## Что вы узнаете из этой главы {#what-you-will-learn-in-this-chapter}

- Как настроить параметры подключения MetaService к FoundationDB
- Как выбрать версию образа MetaService
- Как выделить MetaService необходимые вычислительные ресурсы
- Как настроить параметры запуска MetaService через ConfigMap
- Как настроить время ожидания проверки работоспособности и запуска MetaService

## Обзор {#overview}

MetaService — компонент управления метаданными кластера Doris с разделением хранения и вычислений. Он используется только внутри кластера и не доступен извне. Это сервис без состояния, который обычно развёртывают по схеме с основным и резервным экземплярами. В этой главе описана настройка MetaService в ресурсе `DorisDisaggregatedCluster`.

Все параметры настройки приведены ниже:

| Сценарий настройки | Поле конфигурации | Обязательно | Условия применения |
|----------|----------|----------|----------|
| Подключение к FoundationDB | `fdb.configMapNamespaceName` или `fdb.address` | Да | Во всех сценариях |
| Выбор образа | `image` | Нет | Если версия образа в примере развёртывания не подходит |
| Выделение вычислительных ресурсов | `requests` / `limits` | Нет | Если требуется ограничить использование CPU и памяти |
| Настройка параметров запуска | `configMaps` | Нет | Если требуется изменить параметры запуска по умолчанию |
| Время ожидания проверки работоспособности | `liveTimeout` | Нет | Если значение по умолчанию 180 секунд не подходит |
| Время ожидания запуска | `startTimeout` | Нет | Если значение по умолчанию 300 секунд не подходит |

## 1. Подключение к FoundationDB {#1-connect-to-foundationdb}

MetaService хранит метаданные в FoundationDB, поэтому необходимо настроить доступ к FoundationDB. Способ настройки зависит от того, как развёрнута FoundationDB:

| Способ развёртывания FoundationDB | Рекомендуемый способ настройки | Поле конфигурации |
|----------------------|--------------|----------|
| В Kubernetes через `fdb-kubernetes-operator` | Сослаться на ConfigMap, автоматически созданную Operator | `fdb.configMapNamespaceName` |
| Непосредственно на физических серверах | Указать адрес доступа | `fdb.address` |

### Способ 1. Настройка доступа через ConfigMap {#method-1-configure-access-information-through-a-configmap}

Если кластер FoundationDB развёрнут с помощью `fdb-kubernetes-operator`, можно использовать автоматически созданную Operator ConfigMap, которая содержит адрес доступа к FoundationDB:

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
- `${namespace}`: пространство имён, в котором развёрнута FoundationDB

Как найти ConfigMap, созданную `fdb-kubernetes-operator`, описано в разделе [Получение ConfigMap с данными для доступа к FoundationDB](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information) главы о развёртывании FoundationDB.

### Способ 2. Указание адреса доступа напрямую {#method-2-configure-the-access-address-directly}

Если FoundationDB развёрнута на физических серверах, адрес доступа можно указать непосредственно в конфигурации MetaService:

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

Описание параметра:

- `${fdbEndpoint}`: адрес для доступа к FoundationDB

Как найти этот адрес при развёртывании на физических серверах, описано в разделе [Получение `fdb_cluster` для развёртывания MetaService](../../deploy-manually/separating-storage-compute-deploy-manually) главы о разделении хранения и вычислений.

## 2. Выбор образа {#2-customize-the-image}

Образ MetaService в примере развёртывания может быть не самой новой версии. Чтобы указать нужную версию образа, используйте следующий формат:

```yaml
spec:
  metaService:
    image: ${msImage}
```

Описание параметра:

- `${msImage}`: образ MetaService для развёртывания. Используйте официальный [образ MetaService](https://hub.docker.com/r/apache/doris) от Doris (тег образа содержит префикс `ms`).

## 3. Выделение вычислительных ресурсов {#3-allocate-compute-resources}

Используйте ограничения ресурсов Kubernetes, чтобы выделить MetaService необходимое количество CPU и памяти. Например, следующая конфигурация выделяет MetaService 4 ядра CPU и 4Gi памяти и устанавливает такие же лимиты:

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

Примените эту конфигурацию к [ресурсу DorisDisaggregatedCluster, который планируете развернуть](./install-doris-cluster.md#2-modify-key-configurations).

## 4. Настройка параметров запуска {#4-customize-startup-configuration}

Если параметры запуска по умолчанию не подходят, можно подключить собственный конфигурационный файл через ConfigMap. Doris-Operator настраивает параметры запуска каждого компонента, подключая его конфигурационный файл через ConfigMap.

Общий порядок действий:

| Этап | Описание |
|------|------|
| Входные данные | Собственный конфигурационный файл `doris_cloud.conf` |
| Действие | Создать ConfigMap и подключить её к каталогу `/etc/doris` |
| Результат | MetaService запускается с заданной конфигурацией |

:::tip Совет
Doris-Operator автоматически добавляет параметры FoundationDB в конфигурацию запуска MetaService. Поэтому при настройке параметров запуска указывать `fdb_cluster` не нужно и не следует.
:::

### Шаг 1. Создание собственной ConfigMap {#step-1-create-a-custom-configmap}

Файл конфигурации запуска должен называться `doris_cloud.conf`. Ниже приведён пример:

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

### Шаг 2. Подключение собственной конфигурации запуска {#step-2-mount-the-custom-startup-configuration}

В ресурсе `DorisDisaggregatedCluster` подключите созданную ConfigMap через `metaService.configMaps`:

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

Описание параметров:

- `${msConfigMapName}`: имя ConfigMap с конфигурацией запуска MetaService
- `mountPath`: точкой подключения должен быть каталог `/etc/doris`

Примените эту конфигурацию к [ресурсу DorisDisaggregatedCluster](./install-doris-cluster.md#2-modify-key-configurations), который планируете развернуть.

### Настройка HTTP-токена управления {#ms-http-token}

`http_token` используется для проверки запросов к HTTP API управления MetaService. Его значение по умолчанию — `greedisgood9999`. Замените `<custom-http-token>` в примере собственным значением и сохраните остальные параметры файла `doris_cloud.conf`. Поместите файл в ConfigMap под ключом `doris_cloud.conf` и укажите эту ConfigMap в `spec.metaService.configMaps`, как показано выше.

Используйте один и тот же токен во всех экземплярах MetaService и перезапустите их, чтобы они загрузили конфигурацию запуска. Клиенты API должны передавать это значение в параметре запроса `token`. Doris Operator также считывает `http_token` из указанной ConfigMap для MS и использует его в HTTP-запросах управления. Если изменить только файл внутри Pod, конфигурации Operator и MetaService перестанут совпадать.

Для RPC-вызовов метаданных между FE и BE этот HTTP-токен управления указывать в их конфигурации не требуется. Учётные данные для управления через SQL в `spec.authSecret` не связаны с `http_token`.

## 5. Настройка времени ожидания проверок сервиса {#5-configure-service-probe-timeouts}

Doris Operator предоставляет два параметра времени ожидания для сервисов кластера с разделением хранения и вычислений:

| Тип проверки | Поле конфигурации | Значение по умолчанию | Этап | Условие срабатывания |
|----------|----------|--------|----------|----------|
| Проверка работоспособности (LivenessProbe) | `liveTimeout` | 180 секунд | Во время работы сервиса | Если проверка не проходит дольше заданного порога, сервис принудительно перезапускается |
| Время ожидания запуска | `startTimeout` | 300 секунд | Во время запуска сервиса | Если время запуска превышает заданный порог, сервис принудительно перезапускается |

### Настройка времени ожидания проверки работоспособности {#liveness-probe-timeout-configuration}

Проверка работоспособности отслеживает состояние работающего сервиса. Например, чтобы задать время ожидания 30 секунд:

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### Настройка времени ожидания запуска {#startup-timeout-configuration}

Время ожидания запуска позволяет обрабатывать случаи, когда сервис запускается слишком долго. Например, чтобы задать время ожидания запуска 120 секунд:

```yaml
spec:
  metaService:
    startTimeout: 120
```
