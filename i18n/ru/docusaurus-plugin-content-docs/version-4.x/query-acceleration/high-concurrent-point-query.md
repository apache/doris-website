---
{
    "title": "Точечные запросы при высокой конкурентной нагрузке",
    "language": "ru",
    "description": "Как включить точечные запросы при высокой конкурентной нагрузке в Doris? Значительно повысьте QPS точечных запросов по первичному ключу и сократите время отклика с помощью построчного хранения, сокращённого пути выполнения, PreparedStatement и кеша строк.",
    "keywords": [
        "точечные запросы в Doris при высокой конкурентной нагрузке",
        "оптимизация точечных запросов по первичному ключу",
        "PreparedStatement",
        "построчное хранение store_row_column",
        "точечные запросы Merge-On-Write",
        "сокращённый путь SHORT-CIRCUIT",
        "кеш строк",
        "высокая загрузка CPU на FE как узкое место точечных запросов"
    ]
}
---

<!-- Knowledge type: Capability definition / Configuration parameter / Performance tuning -->
<!-- Applicable scenarios: High-concurrency primary-key point queries, KV-style queries, low-latency online services -->

## Что такое точечные запросы при высокой конкурентной нагрузке {#what-is-a-high-concurrency-point-query}

Точечные запросы при высокой конкурентной нагрузке представляют собой специальный механизм оптимизации Doris для **запросов с условием равенства по первичному ключу**. В сервисах с большим числом одновременных обращений пользователям требуется получать из системы целую строку данных по первичному ключу. Однако используемые в Doris по умолчанию колоночный формат хранения и путь планирования запросов плохо подходят для таких запросов в стиле KV.

Для решения этой задачи Doris применяет оптимизации на следующих уровнях:

| Оптимизация | Решаемая проблема |
| -------------------- | ----------------------------------------------------------- |
| Построчное хранение (Row Store) | При чтении целых строк широких таблиц колоночное хранение увеличивает объём случайного ввода-вывода; построчное хранение снижает эти затраты |
| Сокращённый путь выполнения запросов Short-Circuit (SHORT-CIRCUIT) | Планирование и разбор простых запросов на FE требуют слишком много ресурсов; сокращённый путь позволяет обойти обычный процесс планирования |
| PreparedStatement | Разбор SQL и вычисление выражений потребляют ресурсы CPU на FE; кеширование плана и выражений снижает эти затраты |
| Кеш строк (Row Cache) | Крупные запросы легко вытесняют данные из Page Cache; отдельный кеш строк повышает долю попаданий |

## Контрольный список для быстрого включения {#quick-enablement-checklist}

Перед использованием точечных запросов при высокой конкурентной нагрузке убедитесь, что выполнены все следующие условия:

- Таблица использует **модель Unique Key** с включённым параметром `enable_unique_key_merge_on_write = true`
- При создании таблицы задано `store_row_column = true` для включения построчного хранения
- При создании таблицы включён параметр `light_schema_change = true`
- Запрос содержит только **условия равенства по столбцам Key**, без соединений и вложенных подзапросов
- В JDBC URL включён параметр `useServerPrepStmts=true` для использования PreparedStatement
- (Необязательно) На BE задан параметр `disable_storage_row_cache = false` для включения кеша строк
- С помощью `EXPLAIN` убедитесь, что план выполнения содержит маркер `SHORT-CIRCUIT`

## Построчное хранение (Row Store) {#row-store}

<!-- Knowledge type: Configuration parameter -->

Режим построчного хранения позволяет снизить затраты на случайный ввод-вывод при чтении целых строк широких таблиц. В текущей реализации строка данных кодируется и сохраняется в отдельном столбце.

- Этот режим можно включить только **при создании таблицы**; изменить его впоследствии нельзя.
- Укажите следующее свойство в разделе `PROPERTIES` оператора `CREATE TABLE`:

```sql
"store_row_column" = "true"
```

- Включение построчного хранения увеличивает объём занимаемого места. **Начиная с Doris 3.0**, если запрашивать требуется только некоторые столбцы, рекомендуется использовать `row_store_columns`, чтобы включить в построчное хранение только нужные столбцы:

```sql
"row_store_columns" = "key,v1,v2"
```

Запросам достаточно обращаться только к этим столбцам, например:

```sql
SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1;
```

## Оптимизация точечных запросов для модели Unique {#point-query-optimization-under-the-unique-model}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Primary-key point-query table creation -->

После включения Merge-On-Write и построчного хранения для модели Unique точечные запросы по первичному ключу автоматически используют **сокращённый путь выполнения**. Это оптимизирует выполнение SQL так, что для завершения запроса требуется только один RPC.

### Пример создания таблицы {#table-creation-example}

```sql
CREATE TABLE `tbl_point_query` (
    `k1` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k1`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true"
);
```

### Основные ограничения и примечания {#key-constraints-and-notes}

| Ограничение / свойство | Описание |
| ---------------------------------- | -------------------------------------------------------------------- |
| `enable_unique_key_merge_on_write` | Должно быть включено. Движок хранения использует это свойство для быстрого выполнения точечных запросов по первичному ключу |
| `light_schema_change` | Должно быть включено. Точечные запросы по первичному ключу используют предоставляемый им `column unique id` для поиска столбцов |
| Условия запроса | Поддерживаются только **запросы с условиями равенства** по столбцам Key одной таблицы. Соединения и вложенные подзапросы не поддерживаются |
| Форма предиката | Предложение `WHERE` должно содержать **только условия равенства по столбцам Key**; такой запрос можно рассматривать как запрос в стиле KV |
| Место для построчного хранения | Включение построчного хранения увеличивает объём занимаемого места. В версиях 3.0+ рекомендуется использовать `row_store_columns`, чтобы указать подмножество столбцов |

Например, `SELECT * FROM tbl_point_query WHERE k1 = 123` соответствует условиям и использует оптимизированный сокращённый путь выполнения.

## Использование PreparedStatement {#using-preparedstatement}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: FE CPU becomes the point-query bottleneck -->

Для снижения затрат на разбор SQL и вычисление выражений Doris предоставляет на стороне FE механизм `PreparedStatement`, **полностью совместимый** с протоколом MySQL. В настоящее время поддерживаются только точечные запросы по первичному ключу.

- После включения SQL и выражения обрабатываются заранее и сохраняются в кеше в памяти на уровне сессии.
- Последующие запросы напрямую используют кешированные объекты, что позволяет избежать повторного разбора и вычислений.
- Если CPU становится узким местом при выполнении точечных запросов по первичному ключу, включение `PreparedStatement` может повысить производительность **более чем в 4 раза**.

### Шаг 1: включение PreparedStatement на стороне сервера в JDBC URL {#step-1-enable-server-side-preparedstatement-in-the-jdbc-url}

```text
url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
```

### Шаг 2: использование PreparedStatement в коде {#step-2-use-preparedstatement-in-code}

```java
// use `?` for placement holders, readStatement should be reused
PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
...
readStatement.setInt(1, 1234);
ResultSet resultSet = readStatement.executeQuery();
...
readStatement.setInt(1, 1235);
resultSet = readStatement.executeQuery();
...
```

## Включение кеша строк (Row Cache) {#enabling-row-cache}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Low row-store hit rate, Page Cache easily evicted -->

По умолчанию Doris предоставляет **кеш на уровне страниц**, в котором каждая страница хранит данные одного столбца, поэтому Page Cache ориентирован на столбцы. При построчном хранении строка содержит несколько столбцов, и крупные запросы могут вытеснять данные из кеша.

Чтобы повысить долю попаданий, Doris предоставляет отдельный **кеш строк (Row Cache)**, использующий механизм LRU Cache для управления потреблением памяти. Включите его с помощью следующих параметров BE:

| Параметр | Значение по умолчанию | Описание |
| ---------------------------- | ---------- | --------------------------------- |
| `disable_storage_row_cache` | `true` (по умолчанию отключён) | Отключать ли кеш строк. Для включения задайте `false` |
| `row_cache_mem_limit` | `20%` | Доля памяти, используемая Row Cache |

## Рекомендации по настройке производительности {#performance-tuning-recommendations}

<!-- Knowledge type: Performance tuning -->

После включения описанных выше возможностей можно дополнительно повысить пропускную способность и стабильность точечных запросов с учётом архитектуры развёртывания:

1. **Увеличьте число узлов Observer**: добавление узлов Observer обычно позволяет эффективно увеличить число обрабатываемых запросов.
2. **Настройте балансировку нагрузки запросов**: если FE, принимающий точечные запросы, испытывает высокую загрузку CPU или замедляется, используйте JDBC Load Balance для распределения запросов между несколькими узлами. Также можно использовать другие решения, например Nginx или ProxySQL.
3. **Направляйте точечные запросы на узлы Observer**: сокращение числа точечных запросов, отправляемых на FE Master, обычно уменьшает колебания задержки запросов на FE Master, повышая производительность и стабильность.

## Часто задаваемые вопросы {#faqs}

### Вопрос 1: как убедиться, что настройки верны и точечные запросы при высокой конкурентной нагрузке используют сокращённый путь выполнения? {#q1-how-can-i-confirm-that-the-configuration-is-correct-and-that-high-concurrency-point-queries-use-the-short-circuit-optimization}

Выполните `EXPLAIN`. Если в плане выполнения присутствует `SHORT-CIRCUIT`, используется оптимизация с сокращённым путём выполнения:

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ;
+-----------------------------------------------------------------------------------------------+
| Explain String(Old Planner)                                                                   |
+-----------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                               |
|   OUTPUT EXPRS:                                                                               |
|     `test`.`tbl_point_query`.`k1`                                                             |
|     `test`.`tbl_point_query`.`v1`                                                             |
|     `test`.`tbl_point_query`.`v2`                                                             |
|     `test`.`tbl_point_query`.`v3`                                                             |
|     `test`.`tbl_point_query`.`v4`                                                             |
|     `test`.`tbl_point_query`.`v5`                                                             |
|     `test`.`tbl_point_query`.`v6`                                                             |
|     `test`.`tbl_point_query`.`v7`                                                             |
|   PARTITION: UNPARTITIONED                                                                    |
|                                                                                               |
|   HAS_COLO_PLAN_NODE: false                                                                   |
|                                                                                               |
|   VRESULT SINK                                                                                |
|      MYSQL_PROTOCAL                                                                           |
|                                                                                               |
|   0:VOlapScanNode                                                                             |
|      TABLE: test.tbl_point_query(tbl_point_query), PREAGGREGATION: ON                         |
|      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0  |
|      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         |
|      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |
|      pushAggOp=NONE                                                                           |
|      SHORT-CIRCUIT                                                                            |
+-----------------------------------------------------------------------------------------------+
```

### Вопрос 2: как убедиться, что PreparedStatement работает? {#q2-how-can-i-confirm-that-preparedstatement-is-in-effect}

После отправки запроса в Doris найдите соответствующую запись в `fe.audit.log`. Если в ней присутствует `Stmt=EXECUTE()`, PreparedStatement работает:

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVariables=
```

### Вопрос 3: могут ли запросы не по первичному ключу использовать специальную оптимизацию точечных запросов при высокой конкурентной нагрузке? {#q3-can-non-primary-key-queries-use-the-special-high-concurrency-point-query-optimization}

Нет. Эта оптимизация предназначена только для **запросов с условиями равенства по столбцам Key**, причём запрос **не должен содержать соединений или вложенных подзапросов**.

### Вопрос 4: полезен ли `useServerPrepStmts` для обычных запросов? {#q4-is-useserverprepstmts-useful-for-ordinary-queries}

В настоящее время PreparedStatement действует **только для точечных запросов по первичному ключу**.

### Вопрос 5: нужно ли задавать выбор оптимизатора глобально? {#q5-do-i-need-to-set-the-optimizer-choice-globally}

Нет. При использовании PreparedStatement для запросов Doris автоматически выбирает наиболее производительный способ выполнения запроса, поэтому задавать оптимизатор вручную не требуется.

### Вопрос 6: что делать, если FE становится узким местом? {#q6-what-should-i-do-when-the-fe-becomes-the-bottleneck}

Если загрузка CPU на FE слишком высока (высокое значение `%CPU`), рекомендуется включить следующие настройки балансировки нагрузки и кеширования в JDBC URL:

```text
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```

| Параметр | Назначение |
| ----------------------- | ---------------------------------------------------------- |
| `loadbalance` | Позволяет нескольким FE обслуживать запросы. Чем больше FE, тем лучше (развёртывайте по одному экземпляру на узел) |
| `useServerPrepStmts` | Снижает затраты FE на разбор и планирование |
| `cachePrepStmts` | Кеширует PreparedStatement на стороне клиента, позволяя избежать частых запросов на подготовку к FE |
| `prepStmtCacheSize` | Задаёт максимальное число кешируемых шаблонов запросов |
| `prepStmtCacheSqlLimit` | Задаёт максимальную длину отдельного кешируемого шаблона SQL |

### Вопрос 7: как оптимизировать производительность запросов при развёртывании с разделением хранения и вычислений? {#q7-how-can-i-optimize-query-performance-under-the-storage-compute-separation-deployment}

Можно выполнить настройку по следующим двум направлениям:

- **Отключите точечные запросы со снимками**:

    ```sql
    SET GLOBAL enable_snapshot_point_query = false;
    ```

    Получение версии из Meta Service при выполнении точечных запросов требует дополнительного RPC, и при высоком QPS Meta Service легко становится узким местом. Установка значения `false` ускоряет запросы, но снижает видимость данных (**найдите баланс между производительностью и видимостью данных**).

- **Включите кеширование результатов Base Compaction**: задайте для параметра BE `enable_file_cache_keep_base_compaction_output=1`, чтобы данные, полученные после Base Compaction, помещались в кеш. Это позволит избежать колебаний задержки запросов, вызванных удалённым доступом.
