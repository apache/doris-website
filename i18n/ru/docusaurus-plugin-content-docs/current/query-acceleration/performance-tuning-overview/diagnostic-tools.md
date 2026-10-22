---
{
    "title": "Инструменты диагностики медленных SQL-запросов: журнал аудита и таблица аудита",
    "language": "ru",
    "description": "Как найти медленные SQL-запросы в Apache Doris? В этой статье описано использование трёх инструментов диагностики: журналов Doris Manager, fe.audit.log и системной таблицы audit_log.",
    "keywords": ["медленные SQL-запросы Doris", "инструменты диагностики Doris", "fe.audit.log", "системная таблица audit_log", "SqlDigest", "настройка производительности Doris", "qe_slow_log_ms"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: DBAs or developers troubleshooting slow queries, locating performance bottlenecks, performing tuning analysis -->

Инструменты диагностики производительности помогают быстро находить проблемные SQL-запросы приложений и играют важную роль в соблюдении SLA базы данных. По умолчанию Doris считает медленными SQL-запросы, время выполнения которых превышает 5 секунд. Порог можно настроить с помощью `config.qe_slow_log_ms`.

**Что проверить перед началом:**

- Известен ли порог для медленных SQL-запросов (по умолчанию 5000 мс).
- Доступен ли файл `fe/log/fe.audit.log` на узлах FE.
- Используется ли Doris 2.1 или более поздняя версия (это необходимо для работы с системной таблицей).
- Развёрнут ли Doris Manager (необязательно; используется для фильтрации через интерфейс).

**Сравнение трёх способов диагностики:**

| Инструмент | Сценарий использования | Способ доступа | Требуется Doris Manager | Требования к версии |
| --- | --- | --- | --- | --- |
| Журналы Doris Manager | Фильтрация медленных SQL-запросов через интерфейс | Консоль Doris Manager | Да | Все версии |
| Журнал аудита (`fe.audit.log`) | Непосредственный просмотр исходных журналов, текстовая фильтрация | Файл на узле FE | Нет | Все версии |
| Системная таблица `audit_log` | Статистика и агрегированный анализ с помощью SQL | Запрос из клиента MySQL | Нет | 2.1+ |

## Журналы Doris Manager {#doris-manager-logs}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: filter slow SQL quickly through the UI -->

Модуль журналов Doris Manager позволяет фильтровать медленные SQL-запросы.

**Порядок действий:**

1.  Цель: просмотреть историю медленных SQL-запросов.
2.  Действие: на странице журналов выберите `fe.audit.log` нужного узла FE.
3.  Описание: введите `slow_query` в поле поиска, чтобы отобразить на странице список медленных SQL-запросов.

![Мониторинг и журналы Doris Manager](/images/doris-manage-trace-log-2.png)

## Журнал аудита {#audit-log}

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: directly read FE audit logs to analyze slow SQL -->

Журнал аудита (Audit Log) формируется компонентом Doris FE. Его можно просматривать на странице журналов Doris Manager или непосредственно в файле `fe/log/fe.audit.log` на узле FE.

**Типы записей журнала аудита:**

| Тип | Описание |
| --- | --- |
| `slow_query` | Медленные запросы, время выполнения которых превышает порог |
| `query` | Обычные запросы |
| `load` | Задачи загрузки |
| `stream_load` | Загрузки через Stream Load |

### Фильтрация медленных запросов непосредственно в fe.audit.log {#filter-slow-queries-directly-from-feauditlog}

Медленные запросы можно быстро отфильтровать по метке `slow_query` в `fe.audit.log`. Пример журнала:

```sql
2024-07-18 11:23:13,042 [slow_query] |Client=127.0.0.1:63510|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=11603|ScanBytes=236667379712|ScanRows=13649979418|ReturnRows=100|StmtId=1689|QueryId=91ff336304f14182-9ca537eee75b3856|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice,     sum(l_quantity) from     customer,     orders,     lineitem where     o_orderkey  in  (         select             l_orderkey         from             lineitem         group  by             l_orderkey  having                 sum(l_quantity)  >  300     )     and  c_custkey  =  o_custkey     and  o_orderkey  =  l_orderkey group  by     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice order  by     o_totalprice  desc,     o_orderdate limit  100|CpuTimeMS=918556|ShuffleSendBytes=3267419|ShuffleSendRows=89668|SqlHash=b4e1de9f251214a30188180f37907f7d|peakMemoryBytes=38720935552|SqlDigest=f23c7a7ecff61da33f537b2699e9b053|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:33,043 [slow_query] |Client=127.0.0.1:26672|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8978|ScanBytes=334985555968|ScanRows=10717654374|ReturnRows=100|StmtId=1815|QueryId=6e1fae453cb04d9a-b1e5f94d9cea1885|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=990127|ShuffleSendBytes=59208164|ShuffleSendRows=3651504|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10495660672|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:41,044 [slow_query] |Client=127.0.0.1:26684|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8514|ScanBytes=334986551296|ScanRows=10717654374|ReturnRows=100|StmtId=1833|QueryId=4f91483464ce4aa8-beeed7dcb8675bc8|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=925841|ShuffleSendBytes=59223190|ShuffleSendRows=3651602|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10505123104|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:49,044 [slow_query] |Client=127.0.0.1:10748|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8660|ScanBytes=334987673600|ScanRows=10717654374|ReturnRows=100|StmtId=1851|QueryId=4599cb1bab204f80-ac430dd78b45e3da|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=932664|ShuffleSendBytes=59223178|ShuffleSendRows=3651991|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10505123104|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

`fe.audit.log` содержит ключевую информацию о медленных SQL-запросах: время выполнения, количество просканированных и возвращённых строк, а также текст SQL-запроса. Эти сведения служат основой для дальнейшего воспроизведения и оптимизации.

### Справочник основных полей {#key-field-reference}

<!-- Knowledge type: reference -->
<!-- Applicable scenarios: quickly understand the meaning of log fields -->

| Поле | Значение |
| --- | --- |
| `Time(ms)` | Время выполнения запроса (миллисекунды) |
| `ScanBytes` / `ScanRows` | Объём просканированных данных и количество просканированных строк |
| `ReturnRows` | Количество строк, возвращённых клиенту |
| `QueryId` | Уникальный идентификатор запроса, используемый для связи с Profile |
| `Stmt` | Полный текст SQL-запроса |
| `SqlDigest` | Хеш структуры SQL-запроса, используемый для группировки SQL-запросов одного шаблона |
| `CpuTimeMS` | Суммарное процессорное время (миллисекунды) |
| `peakMemoryBytes` | Пиковое потребление памяти |
| `WorkloadGroup` | Группа Workload Group, к которой относится запрос |

### Использование SqlDigest для группировки по шаблонам {#use-sqldigest-for-pattern-aggregation}

<!-- Knowledge type: method -->
<!-- Applicable scenarios: identify "high-frequency" or "high-cost" slow query patterns -->

`SqlDigest` представляет собой хеш, вычисленный по структуре SQL-запроса без конкретных значений параметров. SQL-запросы с одинаковой структурой имеют одинаковый `SqlDigest`, что позволяет группировать и анализировать медленные SQL-запросы по шаблонам.

С помощью `SqlDigest` можно определить, какие шаблоны SQL-запросов встречаются чаще всего или занимают больше всего суммарного времени выполнения, и оптимизировать их в первую очередь. Такой подход значительно повышает эффективность оптимизации и избавляет от необходимости анализировать каждый запрос отдельно.

Примечание: `SqlDigest` содержит только хеш, который нельзя прочитать как текст запроса. Выбрав шаблон для оптимизации, получите исходный SQL-запрос из поля `Stmt` и используйте `QueryId` для связи с Profile и углублённого анализа (Profile описывается в следующих главах).

### Пример анализа медленных запросов {#slow-query-analysis-example}

<!-- Knowledge type: example -->
<!-- Applicable scenarios: locate high-frequency slow SQL through SqlDigest aggregation -->

Рассмотрим четыре приведённые выше записи журнала медленных запросов:

1.  Значение `SqlDigest` первой записи (`Time(ms)=11603`): `f23c7a7ecff61da33f537b2699e9b053`.
2.  Значение `SqlDigest` следующих трёх записей (`Time(ms)=8978/8514/8660`): `fec5a7136f9375aa968a4de971b994da`.

Хотя последние три записи различаются деталями выполнения, они относятся к одному шаблону SQL-запроса и имеют одинаковую структуру.

На практике, если определённый `SqlDigest` (например, `fec5a7136f9375aa968a4de971b994da`) встречается многократно или на него приходится значительная доля суммарного времени выполнения, стоит заняться им в первую очередь.

**Этапы оптимизации:**

1.  **Найдите бизнес-логику**: используйте поле `Stmt` любой записи журнала с этим шаблоном, чтобы определить SQL-запрос приложения:

    ```sql
    select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where ...
    ```

2.  **Проведите углублённый анализ**: используйте `QueryId` (например, `6e1fae453cb04d9a-b1e5f94d9cea1885`), чтобы найти соответствующий Query Profile. С помощью Profile определите узкие места (слишком большой объём сканируемых данных, длительное выполнение Join и т. п.) и разработайте стратегию оптимизации (добавление индексов, переписывание SQL-запроса, изменение структуры таблицы и т. п.).

Устранение проблемы для этого шаблона улучшит выполнение всех медленных запросов с таким же шаблоном.

## Системная таблица audit_log {#audit_log-system-table}

<!-- Knowledge type: operation + reference -->
<!-- Applicable scenarios: query and aggregate audit data through SQL -->

В Doris 2.1 и более поздних версиях доступна системная таблица `audit_log` в базе данных `__internal_schema`, которая позволяет запрашивать информацию аудита с помощью SQL.

### Порядок включения {#enablement-steps}

| Шаг | Команда | Описание |
| --- | --- | --- |
| 1. Включите плагин | `set global enable_audit_plugin=true;` | Включите плагин аудита глобально; по умолчанию он отключён |
| 2. Переключите базу данных | `use __internal_schema;` | Перейдите во внутреннюю схему |
| 3. Выведите список таблиц | `show tables;` | Убедитесь, что таблица `audit_log` существует |

### Пример проверки {#verification-example}

```sql
mysql> use __internal_schema;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+-----------------------------+
| Tables_in___internal_schema |
+-----------------------------+
| audit_log                   |
| column_statistics           |
| histogram_statistics        |
| partition_statistics        |
+-----------------------------+
4 rows in set (0.00 sec)

mysql> desc audit_log;
+-------------------+--------------+------+-------+---------+-------+
| Field             | Type         | Null | Key   | Default | Extra |
+-------------------+--------------+------+-------+---------+-------+
| query_id          | varchar(48)  | Yes  | true  | NULL    |       |
| time              | datetime     | Yes  | true  | NULL    |       |
| client_ip         | varchar(128) | Yes  | true  | NULL    |       |
| user              | varchar(128) | Yes  | false | NULL    | NONE  |
| catalog           | varchar(128) | Yes  | false | NULL    | NONE  |
| db                | varchar(128) | Yes  | false | NULL    | NONE  |
| state             | varchar(128) | Yes  | false | NULL    | NONE  |
| error_code        | int          | Yes  | false | NULL    | NONE  |
| error_message     | text         | Yes  | false | NULL    | NONE  |
| query_time        | bigint       | Yes  | false | NULL    | NONE  |
| scan_bytes        | bigint       | Yes  | false | NULL    | NONE  |
| scan_rows         | bigint       | Yes  | false | NULL    | NONE  |
| return_rows       | bigint       | Yes  | false | NULL    | NONE  |
| stmt_id           | bigint       | Yes  | false | NULL    | NONE  |
| is_query          | tinyint      | Yes  | false | NULL    | NONE  |
| frontend_ip       | varchar(128) | Yes  | false | NULL    | NONE  |
| cpu_time_ms       | bigint       | Yes  | false | NULL    | NONE  |
| sql_hash          | varchar(128) | Yes  | false | NULL    | NONE  |
| sql_digest        | varchar(128) | Yes  | false | NULL    | NONE  |
| peak_memory_bytes | bigint       | Yes  | false | NULL    | NONE  |
| stmt              | text         | Yes  | false | NULL    | NONE  |
+-------------------+--------------+------+-------+---------+-------+
```

Через внутреннюю таблицу `audit_log` можно с помощью SQL получать подробные сведения о выполнении, фильтровать медленные запросы и проводить статистический анализ.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: quickly locate common issues -->

**Вопрос 1: Почему записи `slow_query` не отображаются в `fe.audit.log`?**

-   Причина: время выполнения SQL-запроса не достигло порога (по умолчанию 5000 мс).
-   Решение: настройте порог с помощью `config.qe_slow_log_ms`.

**Вопрос 2: Почему запрос к таблице `audit_log` не возвращает данных?**

-   Причина: `enable_audit_plugin` по умолчанию отключён.
-   Решение: выполните `set global enable_audit_plugin=true;`.

**Вопрос 3: Нормально ли, что `SqlDigest` совпадает, хотя текст SQL-запросов различается?**

-   Да. `SqlDigest` вычисляется по структуре без значений параметров; SQL-запросы одного шаблона с разными параметрами имеют одинаковый хеш.

**Вопрос 4: Где найти таблицу `audit_log`?**

-   Она находится в базе данных `__internal_schema` и доступна в Doris 2.1 и более поздних версиях.

**Вопрос 5: Как связать запрос с Profile для углублённого анализа?**

-   Используйте поле `QueryId` в журнале аудита, чтобы найти соответствующий план выполнения в системе Profile.

## Итоги {#summary}

Doris предоставляет три способа диагностики медленных SQL-запросов: журналы Doris Manager, `fe.audit.log` и системную таблицу `audit_log`. Они охватывают три сценария использования: фильтрацию через интерфейс, непосредственный просмотр текста и сбор статистики с помощью SQL. Объединяя анализ с группировкой по `SqlDigest` и связь с Profile по `QueryId`, можно систематически находить и устранять узкие места производительности.
