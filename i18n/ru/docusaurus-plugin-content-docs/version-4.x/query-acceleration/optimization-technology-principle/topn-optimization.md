---
{
    "title": "Оптимизация запросов TOPN: принципы ускорения ORDER BY LIMIT и настройка",
    "language": "ru",
    "description": "Как Doris ускоряет запросы ORDER BY LIMIT? В этой статье рассматриваются принципы оптимизации TOPN, ограничения применимости, параметры сеанса, способы проверки плана выполнения и политика File Cache для фазы 2 отложенной материализации в развёртываниях с разделением хранения и вычислений.",
    "keywords": ["оптимизация TOPN в Doris", "ускорение ORDER BY LIMIT", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "двухфазное чтение", "File Cache", "RuntimePredicate", "фильтрация Zonemap"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## Определение в одном предложении {#one-sentence-definition}

Оптимизация запросов TOPN в Doris автоматически ускоряет запросы `ORDER BY ... LIMIT n`. Она значительно сокращает затраты на сканирование и сортировку благодаря динамической фильтрации, отсечению диапазонов и отложенной материализации.

## Что проверить перед чтением {#pre-reading-checklist}

- [ ] Мой SQL имеет вид `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`
- [ ] Тип таблицы: Duplicate или Unique MOW (не MOR)
- [ ] Значение `n` невелико (меньше `topn_opt_limit_threshold`, по умолчанию 1024)
- [ ] Нужно проверить по EXPLAIN и Profile, применяется ли оптимизация

## Типичный шаблон SQL {#typical-sql-pattern}

Запросы TOPN часто встречаются в сценариях получения детальных данных, например при поиске по журналам. Doris автоматически распознаёт и оптимизирует их:

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## Три направления оптимизации {#three-optimization-points}

| № | Оптимизация | Принцип | Основное преимущество |
| :--- | :--- | :--- | :--- |
| Оптимизация 1 | Динамическая фильтрация по диапазону (RuntimePredicate) | Во время сортировки динамически формируются условия диапазона для столбцов сортировки (например, `c1 >= 10000`) и передаются на уровень сканирования | Индекс Zonemap позволяет отфильтровать большие объёмы данных, вплоть до целых файлов |
| Оптимизация 2 | Сокращённое чтение по префиксу ключа | Если поля сортировки `c1, c2` в точности образуют префикс ключа таблицы, читаются только первые или последние n строк файла данных | Значительно сокращается объём чтения с диска |
| Оптимизация 3 | Двухфазная отложенная материализация | В первой фазе читаются только столбцы сортировки, выполняется сортировка и определяются номера строк; во второй фазе читаются остальные столбцы | Значительно сокращается количество столбцов, которые нужно читать и сортировать |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## Ограничения применимости {#applicable-limitations}

1. **Ограничение по типу таблицы**: Поддерживаются только таблицы Duplicate и Unique MOW. Использование этой оптимизации для таблицы Unique MOR может привести к некорректным результатам.
2. **Ограничение по значению n**: При слишком большом `n` потребление памяти при оптимизации значительно возрастает. Оптимизация не включается, если `n` превышает значение переменной сеанса `topn_opt_limit_threshold`.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **Ограничение двухфазного чтения**: Начиная с версии 4.1.5, для отложенной материализации TopN во внутренних таблицах Doris требуется `light_schema_change`; таблицы Aggregate Key не поддерживаются. Если эти условия не выполнены, Doris использует обычный путь выполнения TopN, и запрос по-прежнему можно выполнить.

## Параметры настройки {#configuration-parameters}

Все четыре приведённых ниже параметра являются переменными сеанса. Их можно задать для отдельного SQL-оператора или глобально.

| Параметр | Значение по умолчанию | Действие | Рекомендация по настройке |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | Оптимизация TOPN включается, только если LIMIT n меньше этого значения | Установите `0`, чтобы полностью отключить оптимизацию TOPN |
| `enable_two_phase_read_opt` | true | Определяет, включена ли оптимизация 3 (двухфазная отложенная материализация) | Установите `false`, чтобы отключить только оптимизацию 3 |
| `topn_filter_ratio` | 0.5 | Порог отношения LIMIT n к общему объёму данных таблицы | Когда количество строк в LIMIT превышает половину строк таблицы, фильтр больше не создаётся |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | В режиме разделения хранения и вычислений определяет, пропускается ли запись в File Cache при промахе кеша в фазе 2 отложенной материализации для внутренних таблиц Doris | Включайте только тогда, когда данные, прочитанные в фазе 2, редко используются повторно и могут засорять кеш |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## Проверка того, включена ли оптимизация TOPN {#check-whether-topn-optimization-is-enabled}

**Цель**: По плану выполнения определить, какие механизмы оптимизации включены для текущего SQL.

**Команда**:

```sql
EXPLAIN <your_sql>;
```

**Описание**: Найдите следующие маркеры в Query Plan:

- `TOPN OPT`: включена **оптимизация 1** (динамическая фильтрация по диапазону)
- `SORT LIMIT` под `VOlapScanNode`: включена **оптимизация 2** (сокращённое чтение по префиксу ключа)
- `MaterializeNode` (или `OPT TWO PHASE` в старых планах выполнения): включена **оптимизация 3** (двухфазная отложенная материализация)

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

## Управление записью в File Cache в фазе 2 отложенной материализации {#control-file-cache-writes-during-lazy-materialization-phase-2}

В кластере с разделением хранения и вычислений фаза 2 отложенной материализации TOPN считывает оставшиеся столбцы по идентификаторам строк, выбранных в фазе 1. Если небольшое количество результирующих строк распределено по множеству сегментов (Segments), блоки кеша, заполняемые при таком разреженном чтении, могут редко использоваться повторно и вытеснять горячие данные. В этом случае включите `enable_topn_lazy_mat_phase2_no_write_file_cache`, чтобы при промахах кеша в фазе 2 данные считывались непосредственно из удалённого хранилища без записи в File Cache.

Эта переменная не меняет результаты запроса. Она меняет только обработку промахов File Cache в фазе 2:

| Значение | Поведение чтения в фазе 2 |
| :--- | :--- |
| `false` (по умолчанию) | Используется обычная политика чтения с заполнением кеша: при промахе кеша Doris считывает удалённые данные и записывает их в File Cache |
| `true` | Локальный кеш читается, только если блоки кеша в состоянии `DOWNLOADED` полностью покрывают текущий диапазон чтения. Если какая-либо часть не закеширована или ещё загружается, Doris считывает весь текущий диапазон из удалённого хранилища, не создавая и не записывая блоки кеша |

Перед включением этой переменной учитывайте следующие ограничения:

- Она действует только в режиме разделения хранения и вычислений и управляет только фазой 2 отложенной материализации TOPN для внутренних таблиц Doris. Сейчас она не управляет чтением в фазе 2 для внешних таблиц.
- Она поддерживает внутренние таблицы Doris как с включённым row store, так и без него.
- Она не удаляет существующие записи кеша и не влияет на запись в кеш в фазе 1, в других запросах или операторах. Поэтому общий объём записи запроса в File Cache всё ещё может быть больше нуля.
- Она не оказывает дополнительного эффекта, если File Cache отключён или план выполнения не содержит `MaterializeNode`.

### Базовый пример использования {#basic-usage}

Для следующего примера требуется кластер с разделением хранения и вычислений, включённый File Cache на BE и пользователь с правами на создание и удаление таблиц, а также на вставку и запрос данных в целевой базе данных. Сначала создайте внутреннюю таблицу Duplicate Key:

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

Включите Profile и политику запрета записи в фазе 2, проверьте план выполнения и выполните запрос:

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

План выполнения должен содержать `MaterializeNode`. Независимо от того, включена ли переменная, запрос возвращает следующий результат:

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

Чтобы восстановить поведение записи в кеш по умолчанию, выполните:

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Проверка политики кеширования в Profile {#verify-the-cache-policy-in-profile}

После установки `profile_level` в значение `2` проверьте следующие метрики фазы 2 у оператора выполнения, соответствующего `MaterializeNode`, в Query Profile:

| Категория | Сводные метрики | Значение |
| :--- | :--- | :--- |
| Масштаб чтения | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | Количество прочитанных строк и сегментов (Segments), к которым выполнялось обращение в фазе 2 |
| Чтение из локального кеша | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | Количество операций, объём данных в байтах и время чтения из File Cache |
| Чтение из удалённого хранилища | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | Количество операций, объём данных в байтах и время чтения из удалённого хранилища |
| Обход кеша | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | Количество операций чтения из удалённого хранилища, при которых данные не записывались в File Cache |
| Запись в кеш | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | Объём данных, записанных в File Cache, в байтах и время, затраченное на запись |

Когда политика запрета записи включена, проверяйте её поведение по следующим сочетаниям значений:

| Состояние кеша | Ожидаемые значения метрик |
| :--- | :--- |
| Текущий диапазон чтения закеширован не полностью | Значения `RemoteIOCount`, `RemoteIOBytes` и `SkipCacheIOCount` больше 0, а `WriteCacheBytes` равно 0 |
| Текущий диапазон чтения полностью покрыт загруженными блоками кеша | Значения `LocalIOCount` и `LocalIOBytes` больше 0, а `RemoteIOCount`, `RemoteIOBytes` и `WriteCacheBytes` равны 0 |

Profile также содержит метрики по отдельным BE. В `TopNLazyMaterializationSecondPhasePerBackend` приведён список BE. В именах остальных метрик добавляется `PerBackend` после `SecondPhase`, например `TopNLazyMaterializationSecondPhasePerBackendRowsRead` и `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`. Элементы массивов по индексу соответствуют списку BE и накапливают данные нескольких выборок фазы 2 в рамках одного запроса.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` учитывает только фазу 2 отложенной материализации. Если общие метрики File Cache по-прежнему показывают запись, сначала определите, относится ли она к фазе 1 или другому оператору. О том, как получить Profile, см. [Анализ Query Profile](../query-profile.md).
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## Проверка эффективности оптимизации TOPN {#check-the-execution-effect-of-topn-optimization}

**Цель**: Подтвердить фактическую эффективность фильтрации при оптимизации TOPN, сравнив время выполнения и метрики Profile.

**Порядок действий**:

1. Установите `topn_opt_limit_threshold` в значение `0`, чтобы отключить оптимизацию, и запишите время выполнения.
2. Восстановите значение по умолчанию, чтобы включить оптимизацию, запишите время выполнения и сравните результаты.
3. Найдите `RuntimePredicate` в Query Profile и обратите внимание на ключевые метрики в таблице ниже.

**Ключевые метрики**:

| Метрика | Значение | Ожидаемая тенденция |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | Количество строк, отфильтрованных RuntimePredicate | Чем больше, тем лучше |
| `NumSegmentFiltered` | Количество отфильтрованных файлов данных (Segments) | Чем больше, тем лучше |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | Время, затраченное RuntimePredicate на фильтрацию данных | Чем меньше, тем лучше |

> Примечание: В версиях до 2.0.3 метрики для `RuntimePredicate` ещё не учитываются отдельно. Примерно оценить их можно по общим метрикам Zonemap.

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

## Часто задаваемые вопросы (FAQ / устранение неполадок) {#frequently-asked-questions-faq--troubleshooting}

**Вопрос 1: В EXPLAIN отсутствует `TOPN OPT`. Каковы возможные причины?**

- LIMIT n превышает `topn_opt_limit_threshold` (по умолчанию 1024).
- Отношение LIMIT n к общему количеству строк в таблице превышает `topn_filter_ratio` (по умолчанию 0.5).
- Используется таблица Unique MOR, для которой эта оптимизация недоступна.

**Вопрос 2: Почему после включения оптимизации SQL выполняется медленнее?**

- Проверьте, не слишком ли велико `n`, что увеличивает затраты памяти. При необходимости уменьшите `topn_opt_limit_threshold`.
- Проверьте эффективность фильтрации по `RowsZonemapRuntimePredicateFiltered` в Profile. Если количество отфильтрованных строк равно 0, оптимизация не даёт выигрыша.

**Вопрос 3: Как отключить только оптимизацию 3 (двухфазное чтение), оставив оптимизации 1 и 2?**

Установите `enable_two_phase_read_opt = false`.

**Вопрос 4: Почему запрос ORDER BY LIMIT к таблице MOR возвращает некорректные результаты?**

Убедитесь, что для таблицы MOR не включена оптимизация TOPN. Для таблиц MOR используйте модель MOW или избегайте запуска этого пути оптимизации.

**Вопрос 5: Почему после включения политики запрета записи в фазе 2 запрос продолжает записывать данные в File Cache?**

Политика управляет только фазой 2 отложенной материализации TOPN для внутренних таблиц Doris. Фаза 1, другие операторы и чтение внешних таблиц по-прежнему могут записывать данные в File Cache. Используйте `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, чтобы определить, выполняла ли фаза 2 запись в кеш, вместо оценки по общему объёму записи запроса.

## Краткий справочник по связанным параметрам {#quick-reference-for-related-parameters}

| Желаемый эффект | Настройка |
| :--- | :--- |
| Полностью отключить оптимизацию TOPN | `SET topn_opt_limit_threshold = 0;` |
| Отключить только двухфазную отложенную материализацию | `SET enable_two_phase_read_opt = false;` |
| Повысить верхнюю границу LIMIT, чтобы охватить больше запросов | Соответствующим образом увеличьте `topn_opt_limit_threshold` |
| Изменить порог отношения для формирования фильтра | Измените `topn_filter_ratio` |
| Не записывать в File Cache данные, прочитанные при промахах кеша в фазе 2 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| Восстановить поведение записи в кеш по умолчанию для фазы 2 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
