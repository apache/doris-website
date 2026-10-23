---
{
    "title": "Мониторинг и оповещения",
    "language": "ru",
    "description": "Создайте систему мониторинга и оповещений Doris: используйте Prometheus для сбора метрик FE/BE, Grafana для отображения панелей мониторинга, а Alertmanager для настройки оповещений.",
    "keywords": [
        "мониторинг Doris",
        "оповещения Doris",
        "панель мониторинга Doris",
        "мониторинг Doris с помощью Prometheus",
        "панель мониторинга Doris в Grafana",
        "метрики FE BE",
        "эндпоинт /metrics",
        "архитектура мониторинга",
        "Alertmanager",
        "мониторинг кластера",
        "сбор метрик",
        "настройка мониторинга"
    ]
}
---

В этом документе описано, как создать полноценную систему мониторинга кластера Apache Doris: использовать Prometheus для сбора метрик, предоставляемых FE и BE, Grafana с официальным шаблоном панели мониторинга для визуализации и заранее предусмотреть раздел конфигурации Alertmanager для последующего подключения оповещений.

> Примечание: если вы развёртываете кластер Doris с разделением вычислений и хранения в Kubernetes, настройка мониторинга описана в разделе [Развёртывание Prometheus и Grafana](../../install/deploy-on-kubernetes/separating-storage-compute/install-prometheus-and-grafana). Описанные в этом документе архитектура мониторинга, формат метрик и панели мониторинга также применимы к такому кластеру.

<!-- Knowledge type: Procedure / Deployment guide -->
<!-- Applicable scenarios: Setting up monitoring after cluster deployment / Troubleshooting and performance observation -->

## Сценарии применения {#applicable-scenarios}

| Сценарий                       | Описание                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Подключение мониторинга после развёртывания кластера | Кластер Doris развёрнут, и вам нужно собирать метрики работы FE/BE и отображать их на графиках.    |
| Единая система наблюдаемости для нескольких кластеров | Одновременный мониторинг нескольких кластеров Doris с помощью одной системы Prometheus + Grafana.                       |
| Диагностика проблем и настройка производительности | Быстрый поиск проблемных узлов и узких мест с помощью панелей мониторинга JVM, запросов и задач Backend.               |
| Настройка оповещений (в планах)                    | Последующая настройка каналов оповещения, таких как электронная почта и SMS, на базе Prometheus + Alertmanager.                    |

## Предварительные требования {#prerequisites}

- Кластер Doris развёрнут, процессы FE и BE работают нормально.
- HTTP-порт FE (по умолчанию `8030`) и порт Web Server BE (по умолчанию `8040`) доступны по сети.
- Есть сервер для запуска Prometheus и Grafana, имеющий сетевой доступ ко всем узлам FE/BE.
- Доступна внешняя сеть для загрузки установочных пакетов и шаблонов панелей мониторинга с официальных сайтов Prometheus и Grafana.

## Загрузка шаблона панели мониторинга {#dashboard-template-download}

Doris предоставляет два шаблона панелей мониторинга Grafana. Выберите шаблон, соответствующий режиму хранения вашего кластера, и импортируйте его напрямую. Шаблоны периодически обновляются. Порядок обновления описан в разделе [Обновление панели мониторинга](#dashboard-update).

| Режим хранения | Шаблон панели мониторинга | Примечания |
| --- | --- | --- |
| Shared-nothing | [doris-grafana-dashboard.json](https://doris.apache.org/files/doris-grafana-dashboard.json) | Традиционное развёртывание FE / BE с локальным хранением; панели охватывают компоненты FE и BE. |
| С разделением вычислений и хранения | [doris-grafana-dashboard-cloud.json](https://doris.apache.org/files/doris-grafana-dashboard-cloud.json) | Панели охватывают FE, BE / Compute Group и Meta Service; **подходит для кластеров с разделением вычислений и хранения, развёрнутых как в Kubernetes, так и вне Kubernetes**. |

Мы приветствуем вклад сообщества в улучшение панелей мониторинга.

## Обзор архитектуры мониторинга {#monitoring-architecture-overview}

Doris использует [Prometheus](https://prometheus.io/) и [Grafana](https://grafana.com/) для сбора и отображения данных мониторинга.

![Компоненты](/images/dashboard_overview.png)

| Компонент        | Назначение                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Prometheus       | Комплекс средств мониторинга систем и оповещения с открытым исходным кодом. Собирает метрики по модели Pull или Push, сохраняет их в собственной базе данных временных рядов (TSDB) и предоставляет многомерный язык запросов к данным. |
| Grafana          | Платформа анализа и визуализации данных с открытым исходным кодом. Поддерживает несколько источников данных временных рядов, включая Prometheus, и отображает данные в виде графиков на настраиваемых панелях мониторинга. |
| Alertmanager     | Компонент оповещения Prometheus, который развёртывается отдельно. Позволяет настраивать правила оповещения с отправкой уведомлений по электронной почте и SMS (в этом документе не рассматривается; см. официальную документацию). |

> Примечание: в этом документе описан только один из способов сбора и отображения данных мониторинга Doris с помощью Prometheus и Grafana. Разработка и сопровождение этих компонентов не входят в задачи проекта Doris. Подробную информацию об этих компонентах см. в их официальной документации.

### Схема потока данных {#data-flow-diagram}

![Архитектура мониторинга](/images/monitor_arch.png)

1. **Prometheus (жёлтая часть)**: Prometheus Server является основным процессом Prometheus. Он обращается к эндпоинтам мониторинга узлов Doris по модели Pull и сохраняет данные временных рядов в TSDB (TSDB входит в процесс Prometheus и не требует отдельного развёртывания). Prometheus также поддерживает режим [Push Gateway](https://github.com/prometheus/pushgateway), при котором наблюдаемая система отправляет данные мониторинга в Push Gateway, а Prometheus Server затем забирает их оттуда.
2. **Alertmanager**: [Alertmanager](https://github.com/prometheus/alertmanager) является компонентом оповещения Prometheus и должен развёртываться отдельно (готовое решение здесь не приводится; порядок настройки см. в официальной документации). С помощью Alertmanager можно настраивать правила оповещения и получать уведомления по электронной почте, SMS и другим каналам.
3. **Grafana (зелёная часть)**: Grafana Server является основным процессом Grafana. После его запуска Grafana можно настроить через веб-страницу, включая источники данных, параметры пользователей и построение панелей мониторинга. Здесь же конечные пользователи просматривают данные мониторинга.

## Формат данных мониторинга {#monitoring-data-format}

<!-- Knowledge type: Interface specification -->
<!-- Applicable scenarios: Understanding how Doris exposes metrics -->

Данные мониторинга Doris предоставляются через HTTP-эндпоинты Frontend и Backend в текстовом формате Key-Value. Каждый ключ (Key) также может иметь несколько меток (Labels), позволяющих различать записи. После развёртывания кластера вы можете открыть следующие эндпоинты непосредственно в браузере, чтобы просмотреть текущие данные мониторинга узла:

| Тип узла | Эндпоинт                                |
| --------- | --------------------------------------- |
| Frontend  | `fe_host:fe_http_port/metrics`          |
| Backend   | `be_host:be_web_server_port/metrics`    |
| Broker    | Не предусмотрен                            |

При обращении к эндпоинту вы увидите результат, похожий на приведённый ниже (пример метрик FE):

```text
# HELP  jvm_heap_size_bytes jvm heap stat
# TYPE  jvm_heap_size_bytes gauge
jvm_heap_size_bytes{type="max"} 8476557312
jvm_heap_size_bytes{type="committed"} 1007550464
jvm_heap_size_bytes{type="used"} 156375280
# HELP  jvm_non_heap_size_bytes jvm non heap stat
# TYPE  jvm_non_heap_size_bytes gauge
jvm_non_heap_size_bytes{type="committed"} 194379776
jvm_non_heap_size_bytes{type="used"} 188201864
# HELP  jvm_young_size_bytes jvm young mem pool stat
# TYPE  jvm_young_size_bytes gauge
jvm_young_size_bytes{type="used"} 40652376
jvm_young_size_bytes{type="peak_used"} 277938176
jvm_young_size_bytes{type="max"} 907345920
# HELP  jvm_old_size_bytes jvm old mem pool stat
# TYPE  jvm_old_size_bytes gauge
jvm_old_size_bytes{type="used"} 114633448
jvm_old_size_bytes{type="peak_used"} 114633448
jvm_old_size_bytes{type="max"} 7455834112
# HELP  jvm_gc jvm gc stat
# TYPE  jvm_gc gauge
<GarbageCollector>{type="count"} 247
<GarbageCollector>{type="time"} 860
# HELP  jvm_thread jvm thread stat
# TYPE  jvm_thread gauge
jvm_thread{type="count"} 162
jvm_thread{type="peak_count"} 205
jvm_thread{type="new_count"} 0
jvm_thread{type="runnable_count"} 48
jvm_thread{type="blocked_count"} 1
jvm_thread{type="waiting_count"} 41
jvm_thread{type="timed_waiting_count"} 72
jvm_thread{type="terminated_count"} 0
...
```

Данные представлены в [формате Prometheus](https://prometheus.io/docs/practices/naming/). Рассмотрим одну из метрик:

```text
# HELP  jvm_heap_size_bytes jvm heap stat
# TYPE  jvm_heap_size_bytes gauge
jvm_heap_size_bytes{type="max"} 8476557312
jvm_heap_size_bytes{type="committed"} 1007550464
jvm_heap_size_bytes{type="used"} 156375280
```

Поля имеют следующие значения:

1. Строки, начинающиеся с `#`, являются комментариями. `HELP` содержит описание метрики; `TYPE` указывает тип данных метрики. В этом примере используется тип `Gauge`, скалярное значение. К другим типам данных относятся `Counter` и `Histogram`. Подробнее см. в [официальной документации Prometheus](https://prometheus.io/docs/practices/instrumentation/#counter-vs.-gauge,-summary-vs.-histogram).
2. `jvm_heap_size_bytes` является именем метрики (Key); `type="max"` является меткой (Label) с именем `type` и значением `max`. Метрика может иметь несколько меток (Labels).
3. Последнее число `8476557312` является фактическим значением метрики.

## Настройка системы мониторинга {#setting-up-the-monitoring-system}

После развёртывания Doris настройте систему мониторинга в следующем порядке:

1. Разверните Prometheus и настройте сбор данных с эндпоинтов `/metrics` процессов FE и BE.
2. Разверните Grafana и настройте Prometheus в качестве источника данных.
3. Импортируйте официальный шаблон панели мониторинга Doris в Grafana.
4. Откройте панель мониторинга на странице Grafana и при необходимости настройте её.

### Развёртывание Prometheus {#deploying-prometheus}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Setting up monitoring for the first time -->

#### 1. Загрузка и распаковка {#1-download-and-extract}

Загрузите последнюю версию Prometheus с [официального сайта Prometheus](https://prometheus.io/download/). Здесь в качестве примера используется версия `2.43.0-linux-amd64`. Распакуйте загруженный tar-архив на машине, где планируется запуск службы мониторинга.

#### 2. Подготовка файла конфигурации {#2-write-the-configuration-file}

Откройте файл конфигурации `prometheus.yml`. Файл имеет формат YAML. Следите за единообразием отступов и пробелов. Здесь для настройки мониторинга используется самый простой способ: статический файл. Prometheus также поддерживает различные механизмы [обнаружения сервисов](https://prometheus.io/docs/prometheus/latest/configuration/configuration/), которые позволяют динамически обнаруживать добавление и удаление узлов.

Пример конфигурации:

```yaml
# my global config
global:
  scrape_interval:     15s # Global scrape interval, default is 1m, set to 15s here
  evaluation_interval: 15s # Global rule evaluation interval, default is 1m, set to 15s here

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      # - alertmanager:9093

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'DORIS_CLUSTER' # Each Doris cluster is called a job. You can give the job a name here as the name of the Doris cluster in the monitoring system.
    metrics_path: '/metrics' # Specify the RESTful API path for retrieving metrics. Combined with the host:port in targets below, Prometheus eventually scrapes metrics via host:port/metrics_path.
    static_configs: # Configure the target addresses of FE and BE separately. All FEs and BEs are written into their respective groups.
      - targets: ['fe_host1:8030', 'fe_host2:8030', 'fe_host3:8030']
        labels:
          group: fe # The fe group is configured here, containing 3 Frontends.

      - targets: ['be_host1:8040', 'be_host2:8040', 'be_host3:8040']
        labels:
          group: be # The be group is configured here, containing 3 Backends.

  - job_name: 'DORIS_CLUSTER_2' # You can monitor multiple Doris clusters in one Prometheus. Another Doris cluster configuration starts here. Configuration is the same as above; details omitted.
    metrics_path: '/metrics'
    static_configs:
      - targets: ['fe_host1:8030', 'fe_host2:8030', 'fe_host3:8030']
        labels:
          group: fe

      - targets: ['be_host1:8040', 'be_host2:8040', 'be_host3:8040']
        labels:
          group: be
```

Основные поля:

| Поле                    | Описание                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `scrape_interval`        | Глобальный интервал сбора метрик; рекомендуется `15s`.                                                              |
| `evaluation_interval`    | Глобальный интервал вычисления правил; рекомендуется `15s`.                                                     |
| `job_name`               | Каждому кластеру Doris соответствует одно задание, которое служит идентификатором кластера в системе мониторинга. |
| `metrics_path`           | Путь эндпоинта метрик, всегда `/metrics`.                                                                 |
| `static_configs.targets` | Список адресов `host:port` узлов FE/BE. Порт FE по умолчанию: `8030`, порт BE по умолчанию: `8040`.         |
| `labels.group`           | Метка группы узлов; рекомендуется использовать `fe` и `be`.                                                           |

#### 3. Запуск Prometheus {#3-start-prometheus}

Запустите Prometheus в фоновом режиме следующей командой, задав веб-порт `8181`:

```shell
nohup ./prometheus --web.listen-address="0.0.0.0:8181" &
```

Сразу после запуска Prometheus начинает собирать данные и сохранять их в каталоге `data`.

#### 4. Остановка Prometheus {#4-stop-prometheus}

В настоящее время Prometheus не предоставляет штатного способа остановки процесса. Можно напрямую использовать `kill -9`. Также можно зарегистрировать Prometheus как службу и запускать или останавливать его как службу.

#### 5. Доступ к Prometheus {#5-access-prometheus}

Откройте в браузере адрес с портом `8181`, чтобы перейти на страницу Prometheus. В панели навигации выберите `Status` -> `Targets`, чтобы увидеть наблюдаемые узлы всех сгруппированных заданий. При нормальной работе все узлы должны иметь статус `UP`, означающий, что сбор данных работает. Нажмите на `Endpoint`, чтобы просмотреть текущие значения метрик.

Если статус узла отличается от `UP`, сначала откройте эндпоинт Doris `/metrics` (см. [Формат данных мониторинга](#monitoring-data-format)), чтобы проверить его доступность, или обратитесь к документации Prometheus для устранения проблемы.

Дополнительные возможности описаны в [официальной документации](https://prometheus.io/docs/introduction/overview/) Prometheus.

### Развёртывание Grafana {#deploying-grafana}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Setting up monitoring for the first time -->

#### 1. Загрузка и распаковка {#1-download-and-extract-1}

Загрузите последнюю версию Grafana с [официального сайта Grafana](https://grafana.com/grafana/download). Здесь в качестве примера используется версия `8.5.22.linux-amd64`. Распакуйте загруженный tar-архив на машине, где планируется запуск службы мониторинга.

#### 2. Подготовка файла конфигурации {#2-write-the-configuration-file-1}

Откройте файл конфигурации `conf/defaults.ini`. Настройте только следующие параметры; для остальных оставьте значения по умолчанию:

```ini
# Path to where grafana can store temp files, sessions, and the sqlite3 db (if that is used)
data = data

# Directory where grafana can store logs
logs = data/log

# Protocol (http, https, socket)
protocol = http

# The ip address to bind to, empty will bind to all interfaces
http_addr =

# The http port to use
http_port = 8182
```

#### 3. Запуск Grafana {#3-start-grafana}

Запустите Grafana в фоновом режиме следующей командой. Для доступа используется порт `8182`, заданный выше:

```shell
nohup ./bin/grafana-server &
```

#### 4. Остановка Grafana {#4-stop-grafana}

В настоящее время Grafana не предоставляет штатного способа остановки процесса. Можно напрямую использовать `kill -9`. Также можно зарегистрировать Grafana как службу и запускать или останавливать её как службу.

#### 5. Доступ к Grafana {#5-access-grafana}

Откройте в браузере адрес с портом `8182`, чтобы перейти на страницу Grafana. Имя пользователя и пароль по умолчанию: `admin`.

#### 6. Настройка источника данных {#6-configure-the-data-source}

После первого входа настройте источник данных, следуя подсказкам. В качестве источника данных здесь используется экземпляр Prometheus, развёрнутый на предыдущем этапе.

На странице настроек источника данных укажите следующие параметры:

| Поле         | Описание                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| Имя          | Произвольное имя источника данных, например `doris_monitor_data_source`.             |
| Тип          | Выберите `Prometheus`.                                                                 |
| URL           | Введите веб-адрес Prometheus, например `http://host:8181`.                 |
| Доступ        | Выберите режим `Server`, чтобы обращаться к Prometheus через сервер, на котором работает Grafana.     |
| Остальные параметры | Оставьте значения по умолчанию.                                                                   |

Нажмите `Save & Test` внизу страницы. Если появится сообщение `Data source is working`, источник данных доступен.

#### 7. Импорт панели мониторинга {#7-import-the-dashboard}

Убедившись в доступности источника данных, импортируйте официальный шаблон панели мониторинга Doris следующим образом:

1. Нажмите значок `+` в левой панели навигации, чтобы начать добавление панели мониторинга.
2. Загрузите JSON-файл из раздела [Загрузка шаблона панели мониторинга](#dashboard-template-download) этого документа.
3. В верхней части страницы выберите `New dashboard` -> `Import dashboard` -> `Upload .json File` и импортируйте загруженный JSON-файл.
4. После импорта можно задать имя панели мониторинга. Имя по умолчанию: `Doris Overview`. При выборе источника данных укажите ранее созданный `doris_monitor_data_source`.
5. Нажмите `Import`, чтобы завершить импорт. После этого появится панель мониторинга Doris.

Дополнительные возможности описаны в [официальной документации](http://docs.grafana.org/) Grafana.

## Описание панели мониторинга {#dashboard-description}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Reading and using the dashboard -->

Содержимое панели мониторинга может меняться с выходом новых версий. Этот документ не гарантирует, что описание соответствует последней версии.

### Верхняя панель {#top-bar}

![Верхняя панель](/images/dashboard_navibar.png)

| Элемент        | Описание                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Слева вверху       | Имя панели мониторинга.                                                                                              |
| Справа вверху      | Текущий временной диапазон мониторинга. В раскрывающемся списке можно выбрать другой диапазон и задать интервал автоматического обновления. |
| `cluster_name` | Соответствует каждому `job_name` в файле конфигурации Prometheus и обозначает кластер Doris. После переключения на графиках ниже отображаются данные мониторинга выбранного кластера. |
| `fe_master`    | Узел Master Frontend соответствующего кластера.                                                       |
| `fe_instance`  | Все узлы Frontend соответствующего кластера. После переключения на графиках ниже отображаются данные мониторинга выбранного Frontend. |
| `be_instance`  | Все узлы Backend соответствующего кластера. После переключения на графиках ниже отображаются данные мониторинга выбранного Backend. |
| `interval`     | Интервал выборки для метрик скорости. (Примечание: при интервале `15s` некоторые графики могут быть пустыми.)      |

### Строка {#row}

![Строка](/images/dashboard_row.png)

В Grafana строка (Row) представляет собой группу графиков (например, «Обзор» и «Обзор кластера» на рисунке выше). Нажмите на строку, чтобы свернуть её. Текущая панель мониторинга содержит следующие строки (список постоянно обновляется):

| Строка                | Описание                                       |
| ------------------ | ------------------------------------------------- |
| Обзор           | Сводное представление всех кластеров Doris.            |
| Обзор кластера   | Сводное представление выбранного кластера.          |
| Статистика запросов    | Мониторинг запросов выбранного кластера. |
| FE JVM             | Мониторинг JVM выбранного Frontend.         |
| BE                 | Сводное представление узлов Backend выбранного кластера. |
| Задачи BE            | Информация о задачах Backend выбранного кластера. |

### Графики {#charts}

![График](/images/dashboard_panel.png)

Типичный график обычно содержит следующие элементы:

1. Наведите указатель на значок `i` в левом верхнем углу, чтобы просмотреть описание графика.
2. Нажмите на элемент легенды под графиком, чтобы отобразить отдельную метрику. Нажмите ещё раз, чтобы восстановить отображение всех метрик.
3. Выделите область на графике перетаскиванием, чтобы выбрать временной диапазон.
4. В `[]` в заголовке указано имя выбранного кластера.
5. Некоторые значения относятся к левой оси Y, а другие к правой. Последние обозначаются суффиксом `-right` в конце подписи в легенде.
6. Нажмите на имя графика -> `Edit`, чтобы отредактировать график.

## Обновление панели мониторинга {#dashboard-update}

Когда официальный шаблон панели мониторинга обновится, перезапишите существующую панель следующим образом:

1. Нажмите значок `+` в левой панели Grafana, затем выберите `Dashboard`.
2. Нажмите `New dashboard` в левом верхнем углу, затем выберите `Import dashboard` справа.
3. Нажмите `Upload .json File` и выберите файл последней версии шаблона.
4. Выберите источник данных.
5. Нажмите `Import (Overwrite)`, чтобы завершить обновление шаблона.

## Часто задаваемые вопросы {#faq}

### Вопрос: в разделе Prometheus `Targets` узел имеет статус `DOWN`. Что делать? {#q-a-node-status-in-prometheus-targets-is-down-what-should-i-do}

Проверьте сетевую доступность узлов FE/BE с сервера Prometheus. Убедитесь, что адрес и порт целевого узла указаны правильно, а эндпоинт `/metrics` доступен напрямую.

### Вопрос: браузер не может открыть `/metrics` на FE/BE. Что делать? {#q-the-browser-cannot-access-metrics-on-febe-what-should-i-do}

Убедитесь, что порт FE `http_port` (по умолчанию `8030`) и порт BE `webserver_port` (по умолчанию `8040`) открыты, а процессы узлов работают нормально.

### Вопрос: Grafana показывает сообщение `Data source is not working`. Что делать? {#q-grafana-shows-data-source-is-not-working-what-should-i-do}

Проверьте, соответствует ли URL источника данных Grafana фактическому адресу, на котором Prometheus принимает подключения, и убедитесь, что сервер Grafana может обращаться к Prometheus по сети.

### Вопрос: некоторые графики на панели мониторинга пустые. Что делать? {#q-some-charts-in-the-dashboard-are-empty-what-should-i-do}

Проверьте, не слишком ли мал `interval` (например, при `15s` на графиках метрик скорости может не быть данных), и убедитесь, что Prometheus успешно собирает данные соответствующих заданий.

### Вопрос: не удаётся разобрать файл конфигурации YAML. Что делать? {#q-the-yaml-configuration-file-fails-to-parse-what-should-i-do}

YAML строго зависит от отступов и пробелов. Проверьте, не используются ли символы табуляции для отступов и согласованы ли уровни отступов.

### Вопрос: для узлов Broker нет данных мониторинга. Что делать? {#q-there-is-no-monitoring-data-for-broker-nodes-what-should-i-do}

Текущая версия Broker не предоставляет эндпоинт `/metrics`.
