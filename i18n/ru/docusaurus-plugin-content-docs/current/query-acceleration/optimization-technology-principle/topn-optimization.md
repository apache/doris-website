---
{
    "title": "Оптимизация запросов TOPN: принципы ускорения ORDER BY LIMIT и настройка",
    "language": "ru",
    "description": "Как Doris ускоряет запросы ORDER BY LIMIT? В этой статье описаны принципы оптимизации TOPN, ограничения её применения, параметры сеанса, способы проверки плана выполнения и политика File Cache для этапа 2 отложенной материализации в кластерах с разделением хранения и вычислений.",
    "keywords": ["оптимизация TOPN в Doris", "ускорение ORDER BY LIMIT", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "двухэтапное чтение", "File Cache", "RuntimePredicate", "фильтрация с помощью Zonemap"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## Определение в одном предложении {#one-sentence-definition}

Оптимизация запросов TOPN — это механизм Doris для автоматического ускорения запросов `ORDER BY ... LIMIT n`. Он значительно сокращает затраты на сканирование и сортировку благодаря динамической фильтрации, отсечению диапазонов и отложенной материализации.

## Что проверить перед чтением {#pre-reading-checklist}

- [ ] Мой SQL имеет вид `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`
- [ ] Тип таблицы — Duplicate или Unique MOW (не MOR)
- [ ] Значение `n` небольшое (меньше `topn_opt_limit_threshold`, по умолчанию 1024)
- [ ] Нужно проверить по EXPLAIN и Profile, действует ли оптимизация

## Типовой шаблон SQL {#typical-sql-pattern}

Запросы TOPN часто используются для получения детальных данных, например при поиске по журналам. Doris автоматически распознаёт и оптимизирует их:

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## Три направления оптимизации {#three-optimization-points}

| № | Оптимизация | Принцип | Основное преимущество |
| :--- | :--- | :--- | :--- |
| Оптимизация 1 | Динамическая фильтрация по диапазону (RuntimePredicate) | Во время сортировки динамически формирует условия диапазона для столбцов сортировки (например, `c1 >= 10000`) и передаёт их на уровень сканирования | Использует индекс Zonemap, чтобы отфильтровать большой объём данных, вплоть до целых файлов |
| Оптимизация 2 | Чтение с ранним завершением по префиксу ключа | Когда поля сортировки `c1, c2` в точности совпадают с префиксом ключа таблицы, читает только первые или последние n строк файла данных | Значительно сокращает объём чтения с диска |
| Оптимизация 3 | Двухэтапная отложенная материализация | На первом этапе читает только столбцы сортировки, чтобы выполнить сортировку и получить номера строк; на втором этапе читает остальные столбцы | Значительно сокращает количество столбцов, которые требуется читать и сортировать |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## Ограничения применения {#applicable-limitations}

1. **Ограничение по типу таблицы**: поддерживаются только таблицы Duplicate и Unique MOW. Применение этой оптимизации к таблице Unique MOR может привести к некорректным результатам.
2. **Ограничение по значению n**: при слишком большом значении `n` потребление памяти при оптимизации существенно возрастает. Оптимизация не включается, если `n` превышает значение переменной сеанса `topn_opt_limit_threshold`.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **Ограничение двухэтапного чтения**: начиная с версии 4.1.5, отложенная материализация TopN для внутренних таблиц Doris требует `light_schema_change` и не поддерживает таблицы Aggregate Key. В dev из этой оптимизации также исключены таблицы с сопоставлением столбца последовательности. Если эти условия не выполняются, Doris использует обычный путь выполнения TopN, а запрос по-прежнему можно выполнить.

## Параметры настройки {#configuration-parameters}

Все четыре параметра ниже являются переменными сеанса. Их можно задать для отдельного SQL-оператора или глобально.

| Параметр | Значение по умолчанию | Действие | Рекомендации по настройке |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | Оптимизация TOPN включается, только если LIMIT n меньше этого значения | Установите `0`, чтобы полностью отключить оптимизацию TOPN |
| `enable_two_phase_read_opt` | true | Определяет, включена ли оптимизация 3 (двухэтапная отложенная материализация) | Установите `false`, чтобы отключить только оптимизацию 3 |
| `topn_filter_ratio` | 0.5 | Порог отношения LIMIT n к общему объёму данных таблицы | Если количество строк в LIMIT превышает половину данных таблицы, фильтр больше не создаётся |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | В режиме разделения хранения и вычислений определяет, пропускает ли этап 2 отложенной материализации для внутренних таблиц Doris запись в кеш при промахе File Cache | Включайте только в том случае, если данные, прочитанные на этапе 2, редко используются повторно и могут засорять кеш |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## Проверка включения оптимизации TOPN {#check-whether-topn-optimization-is-enabled}

**Цель**: определить по плану выполнения, какие направления оптимизации включены для текущего SQL.

**Команда**:

```sql
EXPLAIN <your_sql>;
```

**Описание**: найдите в плане запроса следующие маркеры:

- `TOPN OPT`: включена **оптимизация 1** (динамическая фильтрация по диапазону)
- `SORT LIMIT` в узле `VOlapScanNode`: включена **оптимизация 2** (чтение с ранним завершением по префиксу ключа)
- `MaterializeNode` (или `OPT TWO PHASE` в более старых планах выполнения): включена **оптимизация 3** (двухэтапная отложенная материализация)

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

## Управление записью в File Cache на этапе 2 отложенной материализации {#control-file-cache-writes-during-lazy-materialization-phase-2}

В кластере с разделением хранения и вычислений этап 2 отложенной материализации TOPN читает оставшиеся столбцы по идентификаторам строк, выбранных на этапе 1. Если небольшое количество результирующих строк распределено по множеству Segments, блоки кеша, заполненные при таком разрозненном чтении, могут редко использоваться повторно и вытеснять часто используемые данные. В этом случае включите `enable_topn_lazy_mat_phase2_no_write_file_cache`, чтобы на этапе 2 при промахах кеша данные читались напрямую из удалённого хранилища без записи в File Cache.

Эта переменная не меняет результаты запроса. Она меняет только обработку промахов File Cache на этапе 2:

| Значение | Поведение чтения на этапе 2 |
| :--- | :--- |
| `false` (по умолчанию) | Используется стандартная политика сквозного чтения с записью прочитанных данных в кеш: при промахе кеша Doris читает удалённые данные и записывает их в File Cache |
| `true` | Локальный кеш читается, только если блоки кеша в состоянии `DOWNLOADED` полностью покрывают текущий диапазон чтения. Если какая-либо часть не закеширована или ещё загружается, Doris читает весь текущий диапазон из удалённого хранилища, не создавая и не записывая блоки кеша |

Перед включением этой переменной учитывайте следующие ограничения:

- Она действует только в режиме разделения хранения и вычислений и управляет только этапом 2 отложенной материализации TOPN для внутренних таблиц Doris. В настоящее время она не управляет чтением на этапе 2 для внешних таблиц.
- Поддерживаются внутренние таблицы Doris как с включённым, так и с отключённым построчным хранением.
- Она не удаляет существующие записи кеша и не меняет запись в кеш, выполняемую на этапе 1, другими запросами или другими операторами. Поэтому общий объём записи запроса в File Cache по-прежнему может быть больше нуля.
- Она не оказывает дополнительного влияния, если File Cache отключён или план выполнения не содержит `MaterializeNode`.

### Базовое использование {#basic-usage}

Для следующего примера требуется кластер с разделением хранения и вычислений, включённый File Cache на узлах BE и пользователь, который может создавать и удалять таблицы, вставлять данные и выполнять запросы в целевой базе данных. Сначала создайте внутреннюю таблицу Duplicate Key:

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

Включите Profile и политику без записи в кеш на этапе 2, проверьте план выполнения и выполните запрос:

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

Чтобы восстановить стандартное поведение записи в кеш, выполните:

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Проверка политики кеширования в Profile {#verify-the-cache-policy-in-profile}

После установки `profile_level` в `2` проверьте следующие метрики этапа 2 в Query Profile у оператора выполнения, соответствующего `MaterializeNode`:

| Категория | Агрегированные метрики | Значение |
| :--- | :--- | :--- |
| Объём чтения | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | Количество прочитанных строк и Segments, к которым выполнялось обращение на этапе 2 |
| Чтение из локального кеша | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | Количество операций, объём данных в байтах и время чтения из File Cache |
| Чтение из удалённого хранилища | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | Количество операций, объём данных в байтах и время чтения из удалённого хранилища |
| Обход кеша | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | Количество операций чтения из удалённого хранилища, данные которых не были записаны в File Cache |
| Запись в кеш | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | Объём данных в байтах, записанных в File Cache, и время их записи |

Когда включена политика без записи в кеш, проверяйте её поведение по следующим признакам:

| Состояние кеша | Ожидаемое соотношение метрик |
| :--- | :--- |
| Текущий диапазон чтения закеширован не полностью | `RemoteIOCount`, `RemoteIOBytes` и `SkipCacheIOCount` больше 0, а `WriteCacheBytes` равен 0 |
| Текущий диапазон чтения полностью покрыт загруженными блоками кеша | `LocalIOCount` и `LocalIOBytes` больше 0, а `RemoteIOCount`, `RemoteIOBytes` и `WriteCacheBytes` равны 0 |

Profile также предоставляет метрики по каждому BE. `TopNLazyMaterializationSecondPhasePerBackend` содержит список BE. В именах остальных метрик `PerBackend` добавляется после `SecondPhase`, например `TopNLazyMaterializationSecondPhasePerBackendRowsRead` и `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`. Элементы массивов соответствуют списку BE по индексу и содержат накопленные данные нескольких загрузок на этапе 2 в рамках одного запроса.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` охватывает только этап 2 отложенной материализации. Если общие метрики File Cache по-прежнему показывают запись, сначала определите, выполняется ли она на этапе 1 или другим оператором. О получении Profile см. [Анализ Query Profile](../query-profile.md).
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## Проверка эффективности оптимизации TOPN {#check-the-execution-effect-of-topn-optimization}

**Цель**: проверить фактический эффект фильтрации при оптимизации TOPN, сравнив время выполнения и метрики Profile.

**Порядок действий**:

1. Установите `topn_opt_limit_threshold` в `0`, чтобы отключить оптимизацию, и запишите время выполнения.
2. Восстановите значение по умолчанию, чтобы включить оптимизацию, запишите время выполнения и сравните результаты.
3. Найдите `RuntimePredicate` в Query Profile и обратите внимание на ключевые метрики в таблице ниже.

**Ключевые метрики**:

| Метрика | Значение | Желаемая тенденция |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | Количество строк, отфильтрованных RuntimePredicate | Чем больше, тем лучше |
| `NumSegmentFiltered` | Количество отфильтрованных файлов данных (Segments) | Чем больше, тем лучше |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | Время, затраченное RuntimePredicate на фильтрацию данных | Чем меньше, тем лучше |

> Примечание: в версиях до 2.0.3 метрики `RuntimePredicate` ещё не учитываются отдельно. Приблизительно оценить их можно по общим метрикам Zonemap.

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

- LIMIT n больше `topn_opt_limit_threshold` (по умолчанию 1024).
- Отношение LIMIT n к общему количеству строк в таблице превышает `topn_filter_ratio` (по умолчанию 0.5).
- Таблица имеет тип Unique MOR, для которого эта оптимизация недоступна.

**Вопрос 2: После включения оптимизации SQL выполняется медленнее. Почему?**

- Проверьте, не слишком ли велико значение `n`, из-за чего растут затраты памяти. При необходимости уменьшите `topn_opt_limit_threshold`.
- Проверьте эффект фильтрации по метрике `RowsZonemapRuntimePredicateFiltered` в Profile. Если количество отфильтрованных строк равно 0, оптимизация не даёт выигрыша.

**Вопрос 3: Как отключить только оптимизацию 3 (двухэтапное чтение), сохранив оптимизации 1 и 2?**

Установите `enable_two_phase_read_opt = false`.

**Вопрос 4: Запрос ORDER BY LIMIT к таблице MOR возвращает некорректные результаты. Почему?**

Убедитесь, что для таблицы MOR не включена оптимизация TOPN. Для таблиц MOR используйте модель MOW или избегайте условий, при которых задействуется этот путь оптимизации.

**Вопрос 5: Почему запрос по-прежнему записывает данные в File Cache после включения политики без записи в кеш на этапе 2?**

Политика управляет только этапом 2 отложенной материализации TOPN для внутренних таблиц Doris. Этап 1, другие операторы и чтение внешних таблиц по-прежнему могут записывать данные в File Cache. Используйте `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, чтобы определить, выполнялась ли запись в кеш на этапе 2, вместо того чтобы ориентироваться на общий объём записи запроса.

## Краткий справочник по связанным параметрам {#quick-reference-for-related-parameters}

| Желаемый результат | Настройка |
| :--- | :--- |
| Полностью отключить оптимизацию TOPN | `SET topn_opt_limit_threshold = 0;` |
| Отключить только двухэтапную отложенную материализацию | `SET enable_two_phase_read_opt = false;` |
| Повысить верхнюю границу LIMIT, чтобы охватить больше запросов | Увеличьте `topn_opt_limit_threshold` до подходящего значения |
| Настроить порог отношения для создания фильтра | Измените `topn_filter_ratio` |
| Не записывать в File Cache данные, прочитанные при промахах кеша на этапе 2 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| Восстановить стандартное поведение записи в кеш на этапе 2 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
