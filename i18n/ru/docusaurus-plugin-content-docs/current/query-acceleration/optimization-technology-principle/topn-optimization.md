---
{
    "title": "Оптимизация запросов TOPN: принципы ускорения ORDER BY LIMIT и настройка",
    "language": "ru",
    "description": "Как Doris ускоряет запросы ORDER BY LIMIT? В статье описаны принципы оптимизации TOPN, ограничения применения, параметры сеанса, способы проверки плана выполнения и политика File Cache для второго этапа отложенной материализации в кластерах с разделением хранения и вычислений.",
    "keywords": ["оптимизация Doris TOPN", "ускорение ORDER BY LIMIT", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "двухэтапное чтение", "File Cache", "RuntimePredicate", "фильтрация Zonemap"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## Определение в одном предложении {#one-sentence-definition}

Оптимизация запросов TOPN — это встроенный механизм Doris для автоматического ускорения запросов вида `ORDER BY ... LIMIT n`. Динамическая фильтрация, отсечение диапазонов и отложенная материализация существенно сокращают затраты на сканирование и сортировку.

## Что проверить перед чтением {#pre-reading-checklist}

- [ ] Мой SQL-запрос имеет вид `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`
- [ ] Используется таблица Duplicate или Unique MOW (не MOR)
- [ ] Значение `n` невелико (меньше `topn_opt_limit_threshold`, по умолчанию 1024)
- [ ] Я хочу проверить с помощью EXPLAIN и Profile, применяется ли оптимизация

## Типичный SQL-запрос {#typical-sql-pattern}

Запросы TOPN часто встречаются при получении подробных данных, например при поиске по журналам. Doris автоматически распознаёт и оптимизирует их:

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## Три способа оптимизации {#three-optimization-points}

| № | Оптимизация | Принцип | Основное преимущество |
| :--- | :--- | :--- | :--- |
| Оптимизация 1 | Динамическая фильтрация диапазонов (RuntimePredicate) | Во время сортировки динамически формируются условия для диапазонов значений столбцов сортировки (например, `c1 >= 10000`) и передаются на этап сканирования | Индекс Zonemap позволяет отфильтровать большой объём данных, вплоть до целых файлов |
| Оптимизация 2 | Досрочное завершение чтения по префиксу ключа | Если поля сортировки `c1, c2` в точности образуют префикс ключа таблицы, считываются только первые или последние n строк файла данных | Значительно сокращается объём чтения с диска |
| Оптимизация 3 | Двухэтапная отложенная материализация | На первом этапе для сортировки считываются только столбцы сортировки и определяются номера строк; на втором считываются остальные столбцы | Значительно сокращается число столбцов, которые нужно читать и сортировать |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## Ограничения применения {#applicable-limitations}

1. **Тип таблицы**: поддерживаются только таблицы Duplicate и Unique MOW. Применение этой оптимизации к таблице Unique MOR может привести к неверным результатам.
2. **Значение n**: при слишком большом `n` оптимизация значительно увеличивает потребление памяти. Если `n` превышает значение переменной сеанса `topn_opt_limit_threshold`, оптимизация не включается.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **Двухэтапное чтение**: начиная с версии 4.1.5, для отложенной материализации TopN во внутренних таблицах Doris требуется `light_schema_change`; таблицы Aggregate Key не поддерживаются. В версии dev таблицы с сопоставлением столбца последовательности также исключены из этой оптимизации. Если условия не выполнены, Doris использует обычный путь выполнения TopN, и запрос остаётся доступным.

## Параметры настройки {#configuration-parameters}

Все четыре перечисленных ниже параметра являются переменными сеанса. Их можно задать для отдельного SQL-запроса или глобально.

| Параметр | Значение по умолчанию | Действие | Рекомендация по настройке |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | Оптимизация TOPN включается, только если LIMIT n меньше этого значения | Установите `0`, чтобы полностью отключить оптимизацию TOPN |
| `enable_two_phase_read_opt` | true | Управляет включением оптимизации 3 (двухэтапной отложенной материализации) | Установите `false`, чтобы отключить только оптимизацию 3 |
| `topn_filter_ratio` | 0.5 | Порог отношения LIMIT n к общему объёму данных таблицы | Если значение LIMIT превышает половину объёма данных таблицы, фильтр больше не создаётся |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | В режиме разделения хранения и вычислений определяет, пропускается ли запись в File Cache при промахе кеша на втором этапе отложенной материализации для внутренних таблиц Doris | Включайте, только если данные, считываемые на втором этапе, редко используются повторно и могут вытеснить полезные данные из кеша |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## Как проверить, включена ли оптимизация TOPN {#check-whether-topn-optimization-is-enabled}

**Цель**: по плану выполнения определить, какие способы оптимизации включены для текущего SQL-запроса.

**Команда**:

```sql
EXPLAIN <your_sql>;
```

**Описание**: найдите в плане запроса следующие маркеры:

- `TOPN OPT`: включена **оптимизация 1** (динамическая фильтрация диапазонов)
- `SORT LIMIT` под `VOlapScanNode`: включена **оптимизация 2** (досрочное завершение чтения по префиксу ключа)
- `MaterializeNode` (или `OPT TWO PHASE` в старых планах выполнения): включена **оптимизация 3** (двухэтапная отложенная материализация)

**Пример**:

```sql
  1:VTOP-N(137)
  |  order by: @timestamp18 DESC
  |  TOPN OPT
  |  OPT TWO PHASE
  |  offset: 0
  |  limit: 10
  |  distribute expr lists: applicationName5
  |
  0:VOlapScanNode(106)
     TABLE: log_db.log_core_all_no_index(log_core_all_no_index), PREAGGREGATION: ON
     SORT INFO:
          @timestamp18
     SORT LIMIT: 10
     TOPN OPT:1
     PREDICATES: ZYCFC-TRACE-ID4 like '%flowId-1720055220933%'
     partitions=1/8 (p20240704), tablets=250/250, tabletList=1727094,1727096,1727098 ...
     cardinality=345472780, avgRowSize=0.0, numNodes=1
     pushAggOp=NONE
```

<!-- Knowledge type: configuration + operation + troubleshooting -->
<!-- Applicable scenarios: controlling File Cache writes during TOPN lazy materialization phase 2 in clusters with storage-compute separation -->

## Управление записью в File Cache на втором этапе отложенной материализации {#control-file-cache-writes-during-lazy-materialization-phase-2}

В кластере с разделением хранения и вычислений на втором этапе отложенной материализации TOPN оставшиеся столбцы считываются по идентификаторам строк, выбранных на первом этапе. Если небольшое число результирующих строк распределено по многим Segments, блоки кеша, заполненные при таком разрозненном чтении, могут почти не использоваться повторно и вытеснять часто запрашиваемые данные. В этом случае включите `enable_topn_lazy_mat_phase2_no_write_file_cache`: при промахе кеша второй этап будет читать данные непосредственно из удалённого хранилища без записи в File Cache.

Эта переменная не меняет результаты запроса. Она влияет только на обработку промахов File Cache на втором этапе:

| Значение | Поведение чтения на втором этапе |
| :--- | :--- |
| `false` (по умолчанию) | Применяется обычная политика чтения и записи в кеш: при промахе Doris считывает удалённые данные и записывает их в File Cache |
| `true` | Локальный кеш используется только тогда, когда блоки кеша в состоянии `DOWNLOADED` полностью покрывают текущий диапазон чтения. Если какая-либо часть диапазона отсутствует в кеше или ещё загружается, Doris считывает весь текущий диапазон из удалённого хранилища, не создавая и не записывая блоки кеша |

Перед включением этой переменной учитывайте следующие ограничения:

- Она действует только в режиме разделения хранения и вычислений и управляет только вторым этапом отложенной материализации TOPN для внутренних таблиц Doris. Сейчас она не управляет чтением внешних таблиц на втором этапе.
- Она поддерживает внутренние таблицы Doris как с включённым хранением строк, так и без него.
- Она не удаляет существующие записи кеша и не меняет запись в кеш, выполняемую на первом этапе, другими запросами или другими операторами. Поэтому общий объём записи запроса в File Cache всё ещё может быть больше нуля.
- Она не даёт дополнительного эффекта, если File Cache отключён или в плане выполнения нет `MaterializeNode`.

### Базовое использование {#basic-usage}

Для следующего примера нужны кластер с разделением хранения и вычислений, включённый File Cache на BE и пользователь, который может создавать и удалять таблицы, а также вставлять и запрашивать данные в целевой базе данных. Сначала создайте внутреннюю таблицу Duplicate Key:

```sql
DROP TABLE IF EXISTS topn_file_cache_demo;

CREATE TABLE topn_file_cache_demo (
    id BIGINT NOT NULL,
    event_time DATETIME NOT NULL,
    payload VARCHAR(128) NOT NULL
)
ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "light_schema_change" = "true"
);

INSERT INTO topn_file_cache_demo VALUES
    (1, '2026-01-01 10:00:00', 'alpha'),
    (2, '2026-01-02 10:00:00', 'beta'),
    (3, '2026-01-03 10:00:00', 'gamma');
```

Включите Profile и политику без записи в кеш на втором этапе, затем проверьте план выполнения и выполните запрос:

```sql
SET enable_profile = true;
SET profile_level = 2;
SET enable_sql_cache = false;
SET enable_query_cache = false;
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

EXPLAIN SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;

SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;
```

В плане выполнения должен присутствовать `MaterializeNode`. Запрос возвращает следующий результат независимо от того, включена ли переменная:

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

Чтобы восстановить стандартное поведение с записью в кеш, выполните:

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Проверка политики кеширования в Profile {#verify-the-cache-policy-in-profile}

После установки `profile_level` в `2` проверьте следующие метрики второго этапа у оператора выполнения, соответствующего `MaterializeNode` в Query Profile:

| Аспект | Сводные метрики | Значение |
| :--- | :--- | :--- |
| Объём чтения | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | Число строк, считанных на втором этапе, и число затронутых Segments |
| Чтение из локального кеша | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | Число операций чтения из File Cache, объём прочитанных данных в байтах и затраченное время |
| Удалённое чтение | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | Число операций чтения из удалённого хранилища, объём прочитанных данных в байтах и затраченное время |
| Обход кеша | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | Число операций удалённого чтения без записи в File Cache |
| Запись в кеш | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | Объём записи в File Cache в байтах и затраченное время |

Когда политика без записи в кеш включена, её работу можно проверить по следующим сочетаниям метрик:

| Состояние кеша | Ожидаемые значения метрик |
| :--- | :--- |
| Текущий диапазон чтения не полностью находится в кеше | `RemoteIOCount`, `RemoteIOBytes` и `SkipCacheIOCount` больше 0, а `WriteCacheBytes` равно 0 |
| Текущий диапазон чтения полностью покрыт загруженными блоками кеша | `LocalIOCount` и `LocalIOBytes` больше 0, а `RemoteIOCount`, `RemoteIOBytes` и `WriteCacheBytes` равны 0 |

Profile также предоставляет метрики по отдельным BE. `TopNLazyMaterializationSecondPhasePerBackend` содержит список BE. В названиях остальных метрик `PerBackend` добавляется после `SecondPhase`, например `TopNLazyMaterializationSecondPhasePerBackendRowsRead` и `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`. Элементы массивов соответствуют списку BE по индексам и накапливают данные нескольких обращений за строками на втором этапе в рамках одного запроса.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` учитывает только второй этап отложенной материализации. Если общие метрики File Cache по-прежнему показывают запись, сначала выясните, выполнялась ли она на первом этапе или другим оператором. О том, как получить Profile, см. в разделе [Анализ Query Profile](../query-profile.md).
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## Проверка эффективности оптимизации TOPN {#check-the-execution-effect-of-topn-optimization}

**Цель**: сравнить время выполнения и метрики Profile, чтобы оценить фактический эффект фильтрации при оптимизации TOPN.

**Шаги**:

1. Установите `topn_opt_limit_threshold` в `0`, чтобы отключить оптимизацию, и запишите время выполнения.
2. Восстановите значение по умолчанию, чтобы включить оптимизацию, запишите время выполнения и сравните результаты.
3. Найдите `RuntimePredicate` в Query Profile и обратите внимание на ключевые метрики в таблице ниже.

**Ключевые метрики**:

| Метрика | Значение | Ожидаемое направление изменения |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | Число строк, отфильтрованных RuntimePredicate | Чем больше, тем лучше |
| `NumSegmentFiltered` | Число отфильтрованных файлов данных (Segments) | Чем больше, тем лучше |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | Время, затраченное RuntimePredicate на фильтрацию данных | Чем меньше, тем лучше |

> Примечание: в версиях до 2.0.3 метрики `RuntimePredicate` ещё не учитываются отдельно. Их можно приблизительно оценить по общим метрикам Zonemap.

**Пример Profile**:

```sql
    SegmentIterator:
          -  BitmapIndexFilterTimer:  46.54us
          -  BlockConditionsFilteredBloomFilterTime:  10.352us
          -  BlockConditionsFilteredDictTime:  7.299us
          -  BlockConditionsFilteredTime:  202.23ms
          -  BlockConditionsFilteredZonemapRuntimePredicateTime:  0ns
          -  BlockConditionsFilteredZonemapTime:  402.917ms
          -  BlockInitSeekCount:  399
          -  BlockInitSeekTime:  11.309ms
          -  BlockInitTime:  215.59ms
          -  BlockLoadTime:  7s567ms
          -  BlocksLoad:  392.97K  (392970)
          -  CachedPagesNum:  0
          -  CollectIteratorMergeTime:  0ns
          -  CollectIteratorNormalTime:  0ns
          -  CompressedBytesRead:  29.76  MB
          -  DecompressorTimer:  427.713ms
          -  ExprFilterEvalTime:  3s930ms
          -  FirstReadSeekCount:  392.921K  (392921)
          -  FirstReadSeekTime:  528.287ms
          -  FirstReadTime:  1s134ms
          -  IOTimer:  51.286ms
          -  InvertedIndexFilterTime:  49.457us
          -  InvertedIndexQueryBitmapCopyTime:  0ns
          -  InvertedIndexQueryBitmapOpTime:  0ns
          -  InvertedIndexQueryCacheHit:  0
          -  InvertedIndexQueryCacheMiss:  0
          -  InvertedIndexQueryTime:  0ns
          -  InvertedIndexSearcherOpenTime:  0ns
          -  InvertedIndexSearcherSearchTime:  0ns
          -  LazyReadSeekCount:  0
          -  LazyReadSeekTime:  0ns
          -  LazyReadTime:  106.952us
          -  NumSegmentFiltered:  0
          -  NumSegmentTotal:  50
          -  OutputColumnTime:  61.987ms
          -  OutputIndexResultColumnTimer:  12.345ms
          -  RawRowsRead:  3.929151M  (3929151)
          -  RowsBitmapIndexFiltered:  0
          -  RowsBloomFilterFiltered:  0
          -  RowsConditionsFiltered:  6.38976M  (6389760)
          -  RowsDictFiltered:  0
          -  RowsInvertedIndexFiltered:  0
          -  RowsKeyRangeFiltered:  0
          -  RowsShortCircuitPredFiltered:  0
          -  RowsShortCircuitPredInput:  0
          -  RowsStatsFiltered:  6.38976M  (6389760)
          -  RowsVectorPredFiltered:  0
          -  RowsVectorPredInput:  0
          -  RowsZonemapRuntimePredicateFiltered:  6.38976M  (6389760)
          -  SecondReadTime:  0ns
          -  ShortPredEvalTime:  0ns
          -  TotalPagesNum:  2.301K  (2301)
          -  UncompressedBytesRead:  137.99  MB
          -  VectorPredEvalTime:  0ns
```

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions and troubleshooting -->

## Частые вопросы и устранение неполадок {#frequently-asked-questions-faq--troubleshooting}

**Вопрос 1: В выводе EXPLAIN нет `TOPN OPT`. Почему?**

- LIMIT n больше `topn_opt_limit_threshold` (по умолчанию 1024).
- Отношение LIMIT n к общему числу строк таблицы превышает `topn_filter_ratio` (по умолчанию 0.5).
- Используется таблица Unique MOR, к которой эта оптимизация неприменима.

**Вопрос 2: Почему после включения оптимизации SQL-запрос выполняется медленнее?**

- Проверьте, не слишком ли велико `n`: это может увеличить потребление памяти. При необходимости уменьшите `topn_opt_limit_threshold`.
- Оцените эффект фильтрации по метрике `RowsZonemapRuntimePredicateFiltered` в Profile. Если число отфильтрованных строк равно 0, оптимизация не приносит пользы.

**Вопрос 3: Как отключить только оптимизацию 3 (двухэтапное чтение), сохранив оптимизации 1 и 2?**

Установите `enable_two_phase_read_opt = false`.

**Вопрос 4: Почему запрос ORDER BY LIMIT к таблице MOR возвращает неверные результаты?**

Убедитесь, что для таблицы MOR не включена оптимизация TOPN. Для таблиц MOR используйте модель MOW или избегайте запуска этого пути оптимизации.

**Вопрос 5: Почему после включения политики без записи на втором этапе запрос всё ещё записывает данные в File Cache?**

Политика управляет только вторым этапом отложенной материализации TOPN для внутренних таблиц Doris. Первый этап, другие операторы и чтение внешних таблиц всё ещё могут записывать данные в File Cache. Чтобы выяснить, была ли запись в кеш на втором этапе, проверяйте `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, а не общий объём записи запроса.

### Можно ли повысить порог 1024 для запросов с большим LIMIT? {#larger-topn-limits}

Да. Значение `topn_opt_limit_threshold` по умолчанию равно 1024; этот параметр управляет несколькими путями оптимизации TopN. Он не задаёт максимальное допустимое значение SQL `LIMIT`, а разные пути по-разному учитывают граничное значение. Чтобы оценить запрос с `LIMIT 5000`, сначала повысьте порог в текущем сеансе:

```sql
SET topn_opt_limit_threshold = 10000;
```

Сравните `EXPLAIN` и Profile одного и того же запроса до и после изменения. Увеличение числа строк-кандидатов может повысить нагрузку на CPU при сортировке, пиковое потребление памяти и число строк, считываемых при двухэтапной материализации. В режиме разделения вычислений и хранения разрозненное чтение на втором этапе также может увеличить объём удалённого ввода-вывода. Тип таблицы, ключи сортировки, избирательность и остальные условия оптимизации по-прежнему имеют значение: повышение порога не гарантирует включения всех способов оптимизации TopN.

При характерной для вашей нагрузки параллельности проверьте задержку запроса, число просканированных строк, пиковое потребление памяти и, если доступны соответствующие метрики, время повторного чтения и объём удалённого чтения в байтах. После эксперимента восстановите значение по умолчанию командой `SET topn_opt_limit_threshold = 1024;`. Повышайте глобальное значение только после проверки пользы для рабочей нагрузки.

## Краткий справочник по связанным параметрам {#quick-reference-for-related-parameters}

| Желаемый результат | Настройка |
| :--- | :--- |
| Полностью отключить оптимизацию TOPN | `SET topn_opt_limit_threshold = 0;` |
| Отключить только двухэтапную отложенную материализацию | `SET enable_two_phase_read_opt = false;` |
| Повысить верхнюю границу LIMIT, чтобы охватить больше запросов | Соответствующим образом увеличьте `topn_opt_limit_threshold` |
| Изменить порог отношения, при котором создаётся фильтр | Измените `topn_filter_ratio` |
| Не записывать в File Cache данные, вызвавшие промах кеша на втором этапе | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| Восстановить стандартное поведение записи в кеш на втором этапе | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
