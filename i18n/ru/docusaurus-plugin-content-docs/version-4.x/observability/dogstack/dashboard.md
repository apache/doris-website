---
{
    "title": "Дашборды",
    "sidebar_label": "Дашборд",
    "language": "ru",
    "description": "Как создавать дашборды наблюдаемости в Grafana на базе Apache Doris? В статье рассматриваются импорт готовых дашбордов, модель данных OTel, расчёт скорости изменения Counter, шаблонные переменные и создание собственных панелей.",
    "keywords": [
        "Дашборд Grafana",
        "Дашборд Doris",
        "OpenTelemetry",
        "Источник данных MySQL",
        "шаблонные переменные",
        "скорость изменения Counter",
        "Time Series",
        "панель Stat",
        "панель Table"
    ]
}
---

<!-- Knowledge type: capability definition + operational steps -->
<!-- Applicable scenario: observability platform / dashboard construction and customization -->

## **Обзор** {#overview}

В этом документе описано, как использовать данные наблюдаемости DOG Stack в Grafana.

DOG Stack использует Doris как единое хранилище. Doris совместим с протоколом MySQL, поэтому один источник данных MySQL в Grafana позволяет запрашивать все логи, трассировки и метрики. Данные проходят следующий путь:

```Plain
Apps / Infrastructure  →  OpenTelemetry Collector  →  Doris Exporter  →  Doris  →  Grafana (MySQL DataSource)
```

В документе рассматриваются:

- Импорт готовых дашбордов: использование предоставленных нами дашбордов.
- Модель данных: хранение данных OTel в Doris.
- Создание собственных дашбордов: разработка панелей, запросов и переменных с нуля.
- Справочная информация: схема данных и памятка по синтаксису.



## **Предварительные требования** {#prerequisites}

Перед началом убедитесь, что:

- DOG Stack развёрнут, а Grafana и Doris запущены.
- В Grafana настроен источник данных типа MySQL для подключения к Doris (в Grafana, поставляемой с DOG Stack, источник данных Doris уже настроен).

Если источник данных ещё не настроен, выполните следующие действия:

1. В левом меню Grafana выберите **Подключения** > **Источники данных** > **Добавить источник данных**.
2. Выберите **MySQL**.

1. Укажите параметры подключения:

   \- **Хост**: `<Doris-fe-host>:9030`

   \- **База данных**: `otel`

   \- **Пользователь**: `root` (или настроенный вами пользователь)

   \- **Пароль**: оставьте пустым (если пароль не задан)

1. Нажмите **Сохранить и проверить**, чтобы убедиться, что подключение работает.

![Настройка источника данных MySQL](https://cdnd.selectdb.com/images/upload/dogstack/dashboard_datasource.png)



## **Импорт готовых дашбордов** {#importing-prebuilt-dashboards}

Мы предоставляем 4 [готовых дашборда](https://github.com/velodb/ai-observe-stack/tree/master/grafana-dashboard) для распространённых сценариев наблюдаемости:

| Дашборд          | Файл                                | Что отслеживает                                |
| ------------------ | ----------------------------------- | ---------------------------------------------- |
| Метрики хоста       | `host_metrics_dashboard.json`       | CPU, память, диск, сеть, нагрузку на систему        |
| Мониторинг JVM     | `jvm_metrics_dashboard.json`        | Память кучи, GC, потоки, использование CPU      |
| Наблюдаемость K8s  | `k8s_kubelet_dashboard.json`        | Использование ресурсов Pod / Node / Namespace          |
| Логи Nginx         | `nginx_logs_dashboard.json`         | Запросы, коды состояния, наиболее популярные URL, логи ошибок   |
| Метрики PostgreSQL | `postgresql-metrics-dashboard.json` | Подключения, транзакции, размер базы данных, Checkpoint, BGWriter |

Чтобы импортировать готовый дашборд:

1. В левом меню Grafana выберите **Дашборды** > **Создать** > **Импорт**.
2. Нажмите **Загрузить JSON-файл дашборда** и выберите JSON-файл из каталога `grafana-dashboard/`.

1. На странице импорта выберите настроенный источник данных Doris (MySQL).
2. Нажмите **Импорт**.

1. Повторите эти действия для остальных JSON-файлов.

После импорта селекторы переменных в верхней части дашборда (например, «Сервис» и «Пространство имён») автоматически получают доступные значения из Doris.

### Панели каждого дашборда {#per-dashboard-panel-details}

**Дашборд метрик хоста**

- Обзор: использование CPU, использование памяти, нагрузка за 1 минуту, использование корневого диска
- CPU: динамика использования, использование по режимам
- Память: сведения о памяти (всего / доступно / свободно / кэш / буферы), динамика использования
- Нагрузка на систему: нагрузка за 1 / 5 / 15 минут, открытые файловые дескрипторы
- Диск: таблица использования дискового пространства, пропускная способность чтения и записи
- Сеть: входящий и исходящий трафик, ошибки и потери пакетов

![Дашборд метрик хоста](https://cdnd.selectdb.com/images/upload/dogstack/dashboard_host.png)

**Дашборд мониторинга JVM**

- Обзор: использование кучи, количество Full GC, использование CPU, количество потоков
- Память: динамика использования памяти в куче и вне кучи; сведения о пулах Old Gen / Eden / Survivor
- GC: время (Young / Old) и количество сборок
- Потоки и CPU: динамика количества потоков, использование CPU

![Дашборд мониторинга JVM](https://cdnd.selectdb.com/images/upload/dogstack/dashboard_jvm.png)

**Дашборд наблюдаемости K8s**

- Pod: CPU (в миллиядрах), память, использование лимитов, таблица состояний (с количеством перезапусков и временем работы)
- Узлы: динамика использования CPU и памяти, таблица состояний
- Пространства имён: суммарное использование CPU и памяти, таблица состояний

![Дашборд наблюдаемости K8s](https://cdnd.selectdb.com/images/upload/dogstack/dashboard_k8s.png)

**Дашборд логов Nginx**

- Обзор: запросы, ошибки, статистика 5xx / 4xx, круговая диаграмма кодов состояния
- Динамика: количество запросов и записи в логе ошибок
- Анализ: наиболее популярные URL и IP, распределение HTTP-методов, наиболее частые сообщения об ошибках
- Последние логи: подробные записи логов доступа и ошибок

![Дашборд логов Nginx](https://cdnd.selectdb.com/images/upload/dogstack/dashboard_nginx.png)

**Дашборд метрик PostgreSQL**

- Подключения: активные подключения (по базам данных), максимальное количество подключений
- Транзакции: частота фиксации транзакций, количество откатов
- Хранение: размер баз данных (по базам данных), количество баз данных, количество таблиц
- BGWriter: количество контрольных точек (плановых / по запросу), записи буферов, время работы BGWriter

![Дашборд метрик PostgreSQL](https://cdnd.selectdb.com/images/upload/dogstack/dashboard_postgresql.png)



## **Модель данных** {#understanding-the-data-model}

Прежде чем создавать собственный дашборд, нужно понять, как данные OTel хранятся в Doris.

### **Таблицы** {#tables}

В отличие от Prometheus, в Doris нельзя выполнить запрос только по имени метрики: нужно также знать, к какой таблице обращаться. Данные OTel распределены по нескольким таблицам в зависимости от типа сигнала и типа метрики:

| Таблица                    | Содержимое              | Поле значения                     | Способ запроса                       |
| ------------------------ | -------------------- | ------------------------------- | ------------------------------------ |
| `otel_metrics_gauge`     | Метрики текущих значений| `value`                         | Прямая агрегация, например `AVG(value)`|
| `otel_metrics_sum`       | Накопительные счётчики  | `value` (монотонно возрастает) | Расчёт скорости с помощью `LAG()`          |
| `otel_metrics_histogram` | Гистограммы            | `count`, `sum`, `bucket_counts` | Расчёт приращений с помощью `LAG()`          |
| `otel_logs`              | Логи                 | `body`, `severity_text`         | Агрегация с помощью `COUNT` или запросы подробных записей|
| `otel_traces`            | Трассировки               | `duration`, `span_name`         | Сортировка или агрегация по длительности        |

Чтобы определить, в какой таблице хранится метрика, выполните:

```SQL
SELECT 'gauge' AS type, metric_name FROM otel.otel_metrics_gauge WHERE metric_name = 'your_metric_name' LIMIT 1
UNION ALL
SELECT 'sum', metric_name FROM otel.otel_metrics_sum WHERE metric_name = 'your_metric_name' LIMIT 1
UNION ALL
SELECT 'histogram', metric_name FROM otel.otel_metrics_histogram WHERE metric_name = 'your_metric_name' LIMIT 1;
```

Чтобы просмотреть все доступные метрики, выполните следующий запрос для каждой таблицы:

```SQL
SELECT DISTINCT metric_name FROM otel.otel_metrics_gauge ORDER BY metric_name;
```

### **Поля атрибутов** {#attribute-fields}

В Prometheus ко всем меткам обращаются одинаково: `{key="value"}`. В Doris атрибуты распределены по нескольким столбцам типа `variant` (JSON), а для доступа к ним используется синтаксис с квадратными скобками:

| Таблица        | Поле                 | Содержимое                              | Пример                              |
| ------------ | --------------------- | ------------------------------------ | ------------------------------------ |
| метрики      | `attributes`          | Измерения метрики (метки Prometheus)| `attributes['mode']`                 |
| метрики      | `resource_attributes` | Информация о ресурсе (pod/узел K8s и т. д.)   | `resource_attributes['k8s.pod.name']`|
| логи         | `log_attributes`      | Поля лога                           | `log_attributes['status']`           |
| трассировки       | `span_attributes`     | Поля спана                          | `span_attributes['http.method']`     |

Примечание: `service_name` и `service_instance_id` являются столбцами верхнего уровня и не входят в `attributes`. Обращайтесь к ним напрямую, например `WHERE service_name = '...'`.

При использовании `SELECT`, `GROUP BY`, `PARTITION BY` или `LIKE` необходимо выполнять преобразование типов с помощью `CAST`:

```SQL
-- Extract a value in SELECT
CAST(attributes['device'] AS VARCHAR) AS device

-- Pattern match in WHERE
CAST(attributes['device'] AS VARCHAR) NOT LIKE 'veth%'

-- Numeric comparison in WHERE
CAST(log_attributes['status'] AS INT) >= 500

-- Use in GROUP BY
GROUP BY CAST(resource_attributes['k8s.pod.name'] AS VARCHAR)
```

Для простых сравнений на равенство в `WHERE` преобразование `CAST` обычно не требуется:

```SQL
WHERE attributes['mode'] = 'idle'
```

Внимание: неверное имя поля атрибутов (например, `log_attributes` в таблице метрик) не вызывает ошибку. Вместо этого без предупреждения возвращается NULL, из-за чего результат запроса оказывается пустым.

### **Метрики Counter и расчёт скорости изменения** {#counter-metrics-and-rate-calculation}

Для метрик Gauge поле `value` непосредственно содержит текущее значение, которое можно агрегировать с помощью `AVG` или `MAX`.

Для метрик Counter / Sum поле `value` содержит монотонно возрастающее накопительное значение (например, общее время CPU в секундах или общее количество переданных по сети байтов). Чтобы получить скорость изменения, нужно вычислить разность между соседними точками данных. Аналог функции `rate()` из Prometheus в Doris реализуется с помощью оконной функции `LAG()`.

Ниже приведён универсальный шаблон расчёта скорости:

```SQL
SELECT
  t.timestamp AS time,
  t.<dimension_field> AS metric,
  CASE
    WHEN UNIX_TIMESTAMP(t.timestamp) > UNIX_TIMESTAMP(t.prev_ts)
         AND t.value >= t.prev_value
    THEN (t.value - t.prev_value) / (UNIX_TIMESTAMP(t.timestamp) - UNIX_TIMESTAMP(t.prev_ts))
    ELSE NULL
  END AS value
FROM (
  SELECT timestamp, value, <dimension_field>,
    LAG(value) OVER (PARTITION BY <dimension_field> ORDER BY timestamp) AS prev_value,
    LAG(timestamp) OVER (PARTITION BY <dimension_field> ORDER BY timestamp) AS prev_ts
  FROM otel.otel_metrics_sum
  WHERE metric_name = '<metric_name>'
    AND $__timeFilter(timestamp)
) t
WHERE t.prev_ts IS NOT NULL
ORDER BY time
```

Для использования шаблона замените следующие заполнители:

- `<dimension_field>`: поле, по которому данные разделяются на ряды, например `CAST(attributes['device'] AS VARCHAR)`.
- `<metric_name>`: имя метрики, например `node_network_receive_bytes_total`.

Шаблон предусматривает три уровня защиты:

| Условие                                                 | Назначение                                                |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `WHERE t.prev_ts IS NOT NULL`                             | Пропускает первую строку каждого раздела (`LAG` возвращает NULL) |
| `UNIX_TIMESTAMP(t.timestamp) > UNIX_TIMESTAMP(t.prev_ts)` | Предотвращает деление на ноль при одинаковых временных метках      |
| `t.value >= t.prev_value`                                 | Предотвращает отрицательные приращения при сбросе счётчика      |

Корректность расчёта скорости напрямую зависит от выбора `PARTITION BY`. Неверный выбор приводит к смешиванию данных разных измерений. В готовых дашбордах используются следующие варианты:

| Сценарий                          | PARTITION BY                                              |
| --------------------------------- | --------------------------------------------------------- |
| Использование CPU (агрегация по нескольким ядрам)| `service_instance_id, CAST(attributes['cpu'] AS VARCHAR)` |
| Дисковый ввод-вывод                          | `CAST(attributes['device'] AS VARCHAR)`                   |
| Сетевой трафик                   | `CAST(attributes['device'] AS VARCHAR)`                   |
| Время GC                           | `CAST(attributes['jvm.gc.name'] AS VARCHAR)`              |



## **Создание собственного дашборда** {#creating-a-custom-dashboard}

В этом разделе на практике показано, как с нуля создать дашборд с несколькими панелями и переменными.

### **Создание дашборда и панели Time Series** {#create-a-dashboard-and-a-time-series-panel}

Создадим панель Time Series, которая показывает динамику использования CPU одним pod в K8s. В этом примере используется метрика Gauge и подробно разбирается весь процесс написания SQL.

1. В левом меню Grafana выберите **Дашборды** > **Создать** > **Новый дашборд**.
2. Нажмите **Добавить визуализацию**.

1. В раскрывающемся списке источников данных выберите настроенный источник MySQL (Doris).
2. В правом верхнем углу редактора запросов переключитесь в режим **Код**.

Теперь напишем SQL-запрос, последовательно дополняя его.

**Напишите базовый запрос.** Наша цель: отслеживать CPU pod. Имя метрики: `k8s.pod.cpu.usage`. Это метрика Gauge, которая хранится в `otel_metrics_gauge`, где `value` можно агрегировать напрямую:

```SQL
SELECT timestamp, value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.cpu.usage'
```

**Добавьте фильтрацию по времени.** Источник данных MySQL в Grafana предоставляет два способа фильтрации по времени:

```SQL
-- Option A: use the $__timeFilter macro (recommended)
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND $__timeFilter(timestamp)

-- Option B: use $__from and $__to (more flexible inside subqueries or JOINs)
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND timestamp >= FROM_UNIXTIME($__from/1000)
  AND timestamp < FROM_UNIXTIME($__to/1000)
```

Примечание: `$__from` и `$__to` содержат временные метки в миллисекундах. Перед использованием в `FROM_UNIXTIME()` их нужно разделить на 1000.

**Добавьте группировку по временным интервалам.** Исходные точки данных расположены слишком плотно, поэтому агрегируйте их с фиксированным интервалом. Используйте `FLOOR(UNIX_TIMESTAMP(timestamp) / N) * N`, чтобы округлять время до интервалов по N секунд:

```SQL
SELECT
  FLOOR(UNIX_TIMESTAMP(timestamp) / 20) * 20 AS time,
  AVG(value) AS value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND timestamp >= FROM_UNIXTIME($__from/1000)
  AND timestamp < FROM_UNIXTIME($__to/1000)
GROUP BY time
ORDER BY time
```

**Разделите данные на несколько рядов по измерению.** Для формата Time Series источник данных MySQL в Grafana требует три столбца:

| Столбец            | Назначение                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `time` или `time_sec` | Время по оси X. Значение типа `datetime` или временная метка UNIX в секундах. |
| `metric`          | Имя ряда. Grafana создаёт отдельную линию для каждого уникального значения этого столбца. |
| `value`           | Значение по оси Y.                                                          |

Добавьте имя pod в качестве столбца `metric`, чтобы получить полный запрос:

```SQL
SELECT
  FLOOR(UNIX_TIMESTAMP(timestamp) / 20) * 20 AS time,
  CAST(resource_attributes['k8s.pod.name'] AS VARCHAR) AS metric,
  AVG(value) AS value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND timestamp >= FROM_UNIXTIME($__from/1000)
  AND timestamp < FROM_UNIXTIME($__to/1000)
GROUP BY time, metric
ORDER BY time
```

Чтобы отслеживать другую метрику Gauge, измените:

- `metric_name`: имя целевой метрики.
- Столбец `metric`: измерение для разделения на ряды, выбранное из `attributes` или `resource_attributes`.

1. Вставьте полный SQL в редактор запросов.
2. Под редактором установите **Формат** в **Time series**.

1. Нажмите на заголовок панели, чтобы задать имя.
2. В настройках панели справа найдите **Стандартные параметры** > **Единица измерения** и выберите подходящую единицу.
3. Нажмите **Применить** в правом верхнем углу.

### **Добавление панели с метрикой Counter** {#add-a-counter-metric-panel}

В этом разделе создаётся панель Time Series, показывающая скорость изменения метрики Counter. У Counter поле `value` содержит монотонно возрастающее накопительное значение. Для расчёта скорости используйте [универсальный шаблон расчёта скорости](#counter-metrics-and-rate-calculation).

1. На дашборде выберите **Добавить** > **Визуализация**.
2. Выберите источник данных и переключитесь в режим **Код**.

Замените заполнители в шаблоне расчёта скорости конкретными значениями. Пример ниже вычисляет скорость приёма байтов по сети с разделением по сетевым устройствам:

```SQL
SELECT
  t.timestamp AS time,
  t.device AS metric,
  CASE
    WHEN UNIX_TIMESTAMP(t.timestamp) > UNIX_TIMESTAMP(t.prev_ts)
         AND t.value >= t.prev_value
    THEN (t.value - t.prev_value) / (UNIX_TIMESTAMP(t.timestamp) - UNIX_TIMESTAMP(t.prev_ts))
    ELSE NULL
  END AS value
FROM (
  SELECT timestamp, CAST(attributes['device'] AS VARCHAR) AS device, value,
    LAG(value) OVER (PARTITION BY CAST(attributes['device'] AS VARCHAR) ORDER BY timestamp) AS prev_value,
    LAG(timestamp) OVER (PARTITION BY CAST(attributes['device'] AS VARCHAR) ORDER BY timestamp) AS prev_ts
  FROM otel.otel_metrics_sum
  WHERE metric_name = 'node_network_receive_bytes_total'
    AND $__timeFilter(timestamp)
) t
WHERE t.prev_ts IS NOT NULL
ORDER BY time
```

Для использования другой метрики Counter измените два параметра:

- `metric_name`: имя целевой метрики.
- Поле измерения в `PARTITION BY` и `SELECT`: измерение, по которому разделяется эта метрика (например, `attributes['cpu']`, `attributes['gc_name']` и т. д.).
- Вставьте SQL и установите **Формат** в **Time series**.
- В разделе **Стандартные параметры** > **Единица измерения** выберите подходящую единицу.
- Нажмите **Применить**.

### **Добавление панели Stat** {#add-a-stat-panel}

Панель Stat показывает одно значение, например текущую загрузку или последнее значение счётчика. SQL должен возвращать одно значение.

1. Выберите **Добавить** > **Визуализация** и переключитесь в режим **Код**.

Следующий запрос получает последнее значение метрики в выбранном диапазоне времени:

```SQL
SELECT value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'node_memory_MemAvailable_bytes'
  AND $__timeFilter(timestamp)
ORDER BY timestamp DESC
LIMIT 1
```

Если нужно выполнить вычисления по нескольким метрикам (например, найти отношение), см. «Запрос нескольких метрик одним SQL» в разделе [Советы по оптимизации](#optimization-tips).

2. Вставьте SQL и установите **Формат** в **Таблица** (панели Stat используют табличный формат).
3. В настройках панели справа измените тип панели на **Stat**.
4. В разделе **Стандартные параметры** > **Единица измерения** выберите подходящую единицу.
5. Нажмите **Применить**.

### **Добавление панели Table** {#add-a-table-panel}

Панель Table подходит для данных с несколькими строками и столбцами. Каждый псевдоним столбца в SQL становится заголовком столбца.

1. Выберите **Добавить** > **Визуализация** и переключитесь в режим **Код**.

Следующий запрос показывает подробные записи последних логов:

```SQL
SELECT
  timestamp,
  service_name,
  severity_text,
  body,
  CAST(log_attributes['your_key'] AS VARCHAR) AS your_key
FROM otel.otel_logs
WHERE $__timeFilter(timestamp)
ORDER BY timestamp DESC
LIMIT 100
```

Замените `your_key` фактическим именем поля атрибута лога. Чтобы просмотреть доступные атрибуты, выполните:

```SQL
SELECT log_attributes FROM otel.otel_logs LIMIT 1;
```

2. Вставьте SQL и установите **Формат** в **Таблица**.
3. Нажмите **Применить**.

### **Добавление шаблонных переменных** {#add-template-variables}

Шаблонные переменные добавляют на дашборд интерактивные раскрывающиеся фильтры, позволяя пользователям фильтровать данные без изменения SQL.

**Переменная с одиночным выбором:**

1. Нажмите значок шестерёнки в правом верхнем углу дашборда, затем перейдите в **Настройки** > **Переменные** > **Новая переменная**.

1. Заполните параметры:

   \- **Имя**: `service_name`

   \- **Тип**: **Запрос**

   \- **Источник данных**: выберите источник данных Doris

   \- **Запрос**:

​     `sql      SELECT DISTINCT service_name      FROM otel.otel_metrics_gauge      WHERE service_name != '' AND service_name IS NOT NULL        AND $__timeFilter(timestamp)      ORDER BY service_name      `

1. Нажмите **Применить**.

В SQL панели ссылайтесь на переменную с одиночным выбором с помощью синтаксиса `$variable`:

```SQL
AND service_name = '$service_name'
```

**Переменная с множественным выбором:**

1. Создайте новую переменную со следующими параметрами:

   \- **Имя**: `namespace`

   \- **Тип**: **Запрос**

   \- **Несколько значений**: включено

   \- **Добавить вариант «Все»**: включено

   \- **Запрос**:

​     `sql      SELECT DISTINCT CAST(resource_attributes['k8s.namespace.name'] AS VARCHAR) AS __text      FROM otel.otel_metrics_gauge      WHERE metric_name = 'k8s.pod.phase'        AND timestamp >= NOW() - INTERVAL 1 HOUR      ORDER BY 1      `

1. Нажмите **Применить**.

Примечание: псевдоним столбца `__text` является соглашением Grafana и задаёт отображаемый текст в раскрывающемся списке.

В SQL панели ссылайтесь на переменную с множественным выбором с помощью синтаксиса `${variable:sqlstring}` в сочетании с `IN()`:

```SQL
AND CAST(resource_attributes['k8s.namespace.name'] AS VARCHAR) IN (${namespace:sqlstring})
```

Внимание: если опустить `:sqlstring`, переменные с множественным выбором приведут к синтаксической ошибке SQL.

**Каскадные переменные:**

Доступные значения одной переменной могут зависеть от другой. Например, следующая переменная Pod фильтрует доступные значения по выбранному Namespace:

```SQL
SELECT DISTINCT CAST(resource_attributes['k8s.pod.name'] AS VARCHAR) AS __text
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.phase'
  AND timestamp >= NOW() - INTERVAL 1 HOUR
  AND CAST(resource_attributes['k8s.namespace.name'] AS VARCHAR) IN (${namespace:sqlstring})
ORDER BY 1
```

### **Советы по оптимизации** {#optimization-tips}

Ниже приведены распространённые приёмы оптимизации, используемые в готовых дашбордах.

**Настройте интервал группировки по времени.** Выберите размер интервала в соответствии с диапазоном времени. Измените N в `FLOOR(UNIX_TIMESTAMP(timestamp) / N) * N`:

- 20 секунд: подходит для мониторинга в реальном времени на коротких промежутках.
- 60 секунд: подходит для обзоров в масштабе часов.
- 300 секунд: подходит для отслеживания динамики в масштабе дней.

**Задавайте понятные имена рядов.** Используйте `CONCAT()` для объединения нескольких полей:

```SQL
CONCAT(device, ' read') AS metric
```

Используйте `CASE WHEN` для преобразования числовых значений в понятный текст:

```SQL
CASE WHEN value = 2 THEN 'Running'
     WHEN value = 1 THEN 'Pending'
     WHEN value = 3 THEN 'Succeeded'
     WHEN value = 4 THEN 'Failed'
     ELSE 'Unknown'
END AS status
```

**Обрабатывайте деление на ноль и значения NULL.** Используйте `NULLIF` для защиты от деления на ноль и `COALESCE` для подстановки значений по умолчанию:

```SQL
/ NULLIF(SUM(...), 0)
COALESCE(restarts, 0)
```

**Запрос нескольких метрик одним SQL.** Используйте `CASE WHEN metric_name` вместо JOIN:

```SQL
SELECT timestamp AS time,
  SUM(CASE WHEN metric_name = 'node_memory_MemAvailable_bytes' THEN value END) AS available,
  SUM(CASE WHEN metric_name = 'node_memory_MemTotal_bytes' THEN value END) AS total
FROM otel.otel_metrics_gauge
WHERE metric_name IN ('node_memory_MemTotal_bytes', 'node_memory_MemAvailable_bytes')
GROUP BY timestamp
```

**Отфильтровывайте шумовые данные.** Исключайте виртуальные сетевые интерфейсы:

```SQL
AND CAST(attributes['device'] AS VARCHAR) NOT LIKE 'veth%'
AND CAST(attributes['device'] AS VARCHAR) NOT LIKE 'br-%'
AND CAST(attributes['device'] AS VARCHAR) != 'lo'
```

Оставляйте только реальные файловые системы:

```SQL
AND CAST(attributes['fstype'] AS VARCHAR) IN ('ext4', 'xfs', 'btrfs')
```



## **Справочная информация** {#reference}

### **Схема таблиц OTel** {#otel-table-schema}

**Таблицы метрик (gauge / sum / histogram: общие поля)**

| Поле                 | Тип           | Описание           |
| --------------------- | -------------- | --------------------- |
| `service_name`        | varchar(200)   | Имя сервиса          |
| `timestamp`           | datetime(6)    | Временная метка данных        |
| `service_instance_id` | varchar(200)   | Идентификатор экземпляра сервиса   |
| `metric_name`         | varchar(200)   | Имя метрики           |
| `metric_description`  | text           | Описание метрики    |
| `metric_unit`         | text           | Единица измерения метрики           |
| `attributes`          | variant (JSON) | Измерения метрики     |
| `resource_attributes` | variant (JSON) | Атрибуты ресурса   |
| `scope_name`          | text           | Имя коллектора        |

Поле только для gauge: `value` (double)

Дополнительные поля sum: `value` (double), `aggregation_temporality` (text), `is_monotonic` (boolean)

Дополнительные поля histogram: `count` (bigint), `sum` (double), `bucket_counts` (array\<bigint\>), `explicit_bounds` (array\<double\>), `min` (double), `max` (double)

**Таблица логов**

| Поле                 | Тип           | Описание                       |
| --------------------- | -------------- | --------------------------------- |
| `timestamp`           | datetime(6)    | Временная метка лога                     |
| `service_name`        | varchar(200)   | Имя сервиса                      |
| `service_instance_id` | varchar(200)   | Идентификатор экземпляра сервиса               |
| `trace_id`            | varchar(200)   | Идентификатор связанной трассировки               |
| `span_id`             | text           | Идентификатор связанного спана                |
| `severity_number`     | int            | Числовой уровень важности                   |
| `severity_text`       | text           | Текстовый уровень важности (INFO / WARN / ERROR) |
| `body`                | text           | Тело записи лога                          |
| `resource_attributes` | variant (JSON) | Атрибуты ресурса               |
| `log_attributes`      | variant (JSON) | Атрибуты лога                    |

**Таблица трассировок**

| Поле                 | Тип           | Описание                                |
| --------------------- | -------------- | ------------------------------------------ |
| `timestamp`           | datetime(6)    | Время начала спана                            |
| `service_name`        | varchar(200)   | Имя сервиса                               |
| `trace_id`            | varchar(200)   | Идентификатор трассировки                                   |
| `span_id`             | text           | Идентификатор спана                                    |
| `parent_span_id`      | text           | Идентификатор родительского спана                             |
| `span_name`           | text           | Имя спана                                  |
| `span_kind`           | text           | Вид спана (CLIENT / SERVER / INTERNAL)     |
| `end_time`            | datetime(6)    | Время окончания спана                              |
| `duration`            | bigint         | Длительность (наносекунды)                     |
| `span_attributes`     | variant (JSON) | Атрибуты спана                            |
| `events`              | array          | События спана                                |
| `links`               | array          | Связи спана                                 |
| `status_code`         | text           | Код состояния (OK / ERROR / UNSET)           |
| `status_message`      | text           | Сообщение о состоянии                             |
| `resource_attributes` | variant (JSON) | Атрибуты ресурса                        |



### **Памятка по синтаксису** {#syntax-cheat-sheet}

| Назначение                          | Синтаксис                                                       |
| -------------------------------- | ------------------------------------------------------------ |
| Фильтр по времени (макрос)              | `$__timeFilter(timestamp)`                                   |
| Фильтр по времени (вручную)             | `timestamp >= FROM_UNIXTIME($__from/1000)`                   |
| Временной интервал (20 секунд)         | `FLOOR(UNIX_TIMESTAMP(timestamp) / 20) * 20 AS time`         |
| Временной интервал (1 минута)           | `UNIX_TIMESTAMP(DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:00')) * 1000 AS time` |
| Доступ к атрибуту                 | `attributes['key']`                                          |
| Преобразование типа атрибута с помощью CAST                   | `CAST(attributes['key'] AS VARCHAR)`                         |
| Переменная с одиночным выбором           | `service_name = '$service_name'`                             |
| Переменная с множественным выбором            | `IN (${namespace:sqlstring})`                                |
| Защита от деления на ноль             | `/ NULLIF(..., 0)`                                           |
| Значение по умолчанию                    | `COALESCE(..., 0)`                                           |
| Именование рядов                    | `CONCAT(device, ' read') AS metric`                          |
| Сопоставление состояний                   | `CASE WHEN value = 2 THEN 'Running' ... END`                 |
| Удаление строки запроса из URL       | `SUBSTRING_INDEX(url, '?', 1)`                               |
| Исключение виртуальных сетевых интерфейсов | `NOT LIKE 'veth%'` + `NOT LIKE 'br-%'` + `!= 'lo'`           |
