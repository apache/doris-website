---
{
    "title": "Оптимизация запросов TOPN: принципы ускорения ORDER BY LIMIT и настройка",
    "language": "ru",
    "description": "Как Doris ускоряет запросы ORDER BY LIMIT? В этой статье объясняются принципы оптимизации TOPN, ограничения применения, параметры сеанса, методы проверки плана выполнения и политика File Cache для ленивой материализации на этапе 2 в развертываниях с разделением хранения и вычислений.",
    "keywords": ["оптимизация Doris TOPN", "ускорение ORDER BY LIMIT", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "двухфазное чтение", "File Cache", "RuntimePredicate", "фильтрация Zonemap"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## Определение в одном предложении {#one-sentence-definition}

Оптимизация запросов TOPN — это встроенная возможность Doris автоматически ускорять запросы вида `ORDER BY ... LIMIT n`. Она значительно сокращает затраты на сканирование и сортировку за счёт динамической фильтрации, отсечения диапазонов и ленивой материализации.

## Чек-лист перед чтением {#pre-reading-checklist}

- [ ] Мой SQL имеет форму `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`
- [ ] Тип таблицы — Duplicate или Unique MOW (не MOR)
- [ ] `n` мало (меньше `topn_opt_limit_threshold`, по умолчанию 1024)
- [ ] Я хочу проверить действие оптимизации с помощью EXPLAIN и Profile

## Типичный шаблон SQL {#typical-sql-pattern}

Запросы TOPN часто используются в сценариях запросов детализации, например при поиске по журналам. Doris автоматически распознаёт и оптимизирует их:

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## Три точки оптимизации {#three-optimization-points}

| № | Оптимизация | Принцип | Ключевая польза |
| :--- | :--- | :--- | :--- |
| Оптимизация 1 | Динамическая фильтрация диапазона (RuntimePredicate) | Во время сортировки динамически строятся условия диапазона для столбцов сортировки (например, `c1 >= 10000`) и передаются на уровень сканирования | Индекс Zonemap отфильтровывает большие объёмы данных, вплоть до целых файлов |
| Оптимизация 2 | Короткое чтение по префиксу ключа | Если поля сортировки `c1, c2` в точности являются префиксом ключа таблицы, считываются только первые или последние n строк файла данных | Существенно сокращает чтение с диска |
| Оптимизация 3 | Двухфазная ленивая материализация | На первом этапе считываются только столбцы сортировки, выполняется сортировка и получаются номера строк; на втором этапе считываются остальные столбцы | Существенно сокращает число столбцов, которые нужно читать и сортировать |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## Ограничения применения {#applicable-limitations}

1. **Ограничение типа таблицы**: поддерживаются только таблицы Duplicate и Unique MOW. Использование этой оптимизации для таблицы Unique MOR может привести к неверным результатам.
2. **Ограничение значения n**: при слишком большом `n` потребление памяти оптимизацией значительно возрастает. Оптимизация не включается, если `n` превышает переменную сеанса `topn_opt_limit_threshold`.

3. **Ограничение двухфазного чтения**: начиная с версии 4.1.5 ленивая материализация TopN для внутренних таблиц Doris требует `light_schema_change` и не поддерживает таблицы Aggregate Key. Если эти условия не выполнены, Doris использует обычный путь выполнения TopN, и запрос остаётся доступным.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

## Параметры конфигурации {#configuration-parameters}

Все следующие четыре параметра являются переменными сеанса. Их можно задать для отдельного SQL-оператора или глобально.

| Параметр | Значение по умолчанию | Эффект | Рекомендация по настройке |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | Оптимизация TOPN включается только если LIMIT n меньше этого значения | Установите `0`, чтобы отключить всю оптимизацию TOPN |
| `enable_two_phase_read_opt` | true | Включать ли оптимизацию 3 (двухфазную ленивую материализацию) | Установите `false`, чтобы отключить только оптимизацию 3 |
| `topn_filter_ratio` | 0.5 | Пороговое отношение LIMIT n к общему объёму данных таблицы | Если количество строк LIMIT превышает половину данных таблицы, фильтр больше не создаётся |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | В режиме разделения хранения и вычислений определяет, пропускает ли второй этап ленивой материализации для внутренних таблиц Doris запись в кэш при промахе File Cache | Включайте только когда результаты чтения на втором этапе редко используются повторно и могут загрязнить кэш |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## Проверка включения оптимизации TOPN {#check-whether-topn-optimization-is-enabled}

**Цель**: с помощью плана выполнения определить, какие точки оптимизации включены для текущего SQL.

**Команда**:

```sql
EXPLAIN <your_sql>;
```

**Описание**: в Query Plan найдите следующие маркеры:

- `TOPN OPT`: включена **оптимизация 1** (динамическая фильтрация диапазона)
- `SORT LIMIT` под `VOlapScanNode`: включена **оптимизация 2** (короткое чтение по префиксу ключа)
- `MaterializeNode` (или `OPT TWO PHASE` в старых планах выполнения): включена **оптимизация 3** (двухфазная ленивая материализация)

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

## Управление записью в File Cache на втором этапе ленивой материализации {#control-file-cache-writes-during-lazy-materialization-phase-2}

В кластере с разделением хранения и вычислений второй этап ленивой материализации TOPN считывает оставшиеся столбцы по идентификаторам строк, выбранным на первом этапе. Если небольшое число результирующих строк распределено по множеству Segments, блоки кэша, заполненные этими разреженными чтениями, могут редко использоваться повторно и вытеснять горячие данные. В этом случае включите `enable_topn_lazy_mat_phase2_no_write_file_cache`, чтобы чтения второго этапа при промахе кэша выполнялись напрямую из удалённого хранилища без записи обратно в File Cache.

Эта переменная не изменяет результаты запроса. Она меняет только обработку промахов File Cache на втором этапе:

| Настройка | Поведение чтения на втором этапе |
| :--- | :--- |
| `false` (по умолчанию) | Используется обычная политика чтения с подкачкой и записью: при промахе кэша Doris считывает удалённые данные и записывает их в File Cache |
| `true` | Локальный кэш используется только если блоки кэша в состоянии `DOWNLOADED` полностью покрывают текущий диапазон чтения. Если какая-либо часть не кэширована или ещё загружается, Doris считывает весь текущий диапазон из удалённого хранилища без создания или записи блоков кэша |

Перед включением этой переменной учитывайте следующие ограничения:

- Она действует только в режиме разделения хранения и вычислений и управляет только вторым этапом ленивой материализации TOPN для внутренних таблиц Doris. В настоящее время она не управляет чтениями второго этапа для внешних таблиц.
- Поддерживаются внутренние таблицы Doris как с включённым row store, так и без него.
- Она не удаляет существующие записи кэша и не изменяет записи, выполняемые первым этапом, другими запросами или другими операторами. Поэтому общий объём записей запроса в File Cache всё ещё может быть больше 0.
- Она не даёт дополнительного эффекта, если File Cache отключён или если план выполнения не содержит `MaterializeNode`.

### Базовое использование {#basic-usage}

Следующий пример требует кластера с разделением хранения и вычислений, включённого File Cache на BE и пользователя с правами на создание и удаление таблиц, а также вставку и запрос данных в целевой базе данных. Сначала создайте внутреннюю таблицу Duplicate Key:

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

Включите Profile и политику отказа от записи на втором этапе, проверьте план выполнения и выполните запрос:

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

План выполнения должен содержать `MaterializeNode`. Запрос возвращает следующий результат независимо от того, включена ли переменная:

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

Чтобы восстановить поведение записи в кэш по умолчанию, выполните:

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Проверка политики кэша в Profile {#verify-the-cache-policy-in-profile}

После установки `profile_level` в `2` проверьте следующие метрики второго этапа под оператором выполнения, соответствующим `MaterializeNode` в Query Profile:

| Измерение | Агрегированные метрики | Значение |
| :--- | :--- | :--- |
| Масштаб чтения | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | Число строк, прочитанных на втором этапе, и количество затронутых Segments |
| Чтения локального кэша | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | Число, объём и время чтений из File Cache |
| Удалённые чтения | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | Число, объём и время чтений из удалённого хранилища |
| Обход кэша | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | Число удалённых чтений, не записанных в File Cache |
| Записи в кэш | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | Объём данных, записанных в File Cache, и время записи |

При включённой политике отказа от записи используйте следующие признаки для проверки её поведения:

| Состояние кэша | Ожидаемый набор метрик |
| :--- | :--- |
| Текущий диапазон чтения кэширован не полностью | `RemoteIOCount`, `RemoteIOBytes` и `SkipCacheIOCount` больше 0, а `WriteCacheBytes` равен 0 |
| Текущий диапазон чтения полностью покрыт загруженными блоками кэша | `LocalIOCount` и `LocalIOBytes` больше 0, а `RemoteIOCount`, `RemoteIOBytes` и `WriteCacheBytes` равны 0 |

Profile также предоставляет метрики по каждому BE. `TopNLazyMaterializationSecondPhasePerBackend` содержит список BE. В именах остальных метрик после `SecondPhase` добавляется `PerBackend`, например `TopNLazyMaterializationSecondPhasePerBackendRowsRead` и `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`. Элементы массивов соответствуют списку BE по индексам и накапливают данные нескольких чтений второго этапа в рамках одного запроса.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` охватывает только второй этап ленивой материализации. Если общие метрики File Cache по-прежнему показывают записи, сначала определите, поступают ли они с первого этапа или от другого оператора. Сведения о получении Profile см. в разделе [Анализ Query Profile](../query-profile.md).
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## Проверка эффекта выполнения оптимизации TOPN {#check-the-execution-effect-of-topn-optimization}

**Цель**: подтвердить фактический эффект фильтрации оптимизации TOPN, сравнив время выполнения и метрики Profile.

**Шаги**:

1. Установите `topn_opt_limit_threshold` в `0`, чтобы отключить оптимизацию, и зафиксируйте время выполнения.
2. Восстановите значение по умолчанию, чтобы включить оптимизацию, снова зафиксируйте время выполнения и сравните результаты.
3. Найдите `RuntimePredicate` в Query Profile и обратите внимание на ключевые метрики из таблицы ниже.

**Ключевые метрики**:

| Метрика | Значение | Ожидаемая тенденция |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | Число строк, отфильтрованных RuntimePredicate | Чем больше, тем лучше |
| `NumSegmentFiltered` | Число отфильтрованных файлов данных (Segments) | Чем больше, тем лучше |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | Время фильтрации данных с помощью RuntimePredicate | Чем меньше, тем лучше |

> Примечание: в версиях до 2.0.3 метрики `RuntimePredicate` ещё не отслеживаются отдельно. Их можно приблизительно оценить по общим метрикам Zonemap.

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

**В1: В EXPLAIN отсутствует `TOPN OPT`. Каковы возможные причины?**

- LIMIT n больше `topn_opt_limit_threshold` (по умолчанию 1024).
- Отношение LIMIT n к общему числу строк таблицы превышает `topn_filter_ratio` (по умолчанию 0.5).
- Таблица является Unique MOR и не может использовать эту оптимизацию.

**В2: После включения оптимизации SQL выполняется медленнее. Почему?**

- Проверьте, не слишком ли велико `n`, из-за чего увеличиваются затраты памяти. Можно соответствующим образом уменьшить `topn_opt_limit_threshold`.
- Подтвердите эффект фильтрации по `RowsZonemapRuntimePredicateFiltered` в Profile. Если число отфильтрованных строк равно 0, оптимизация не приносит пользы.

**В3: Как отключить только оптимизацию 3 (двухфазное чтение), сохранив оптимизации 1 и 2?**

Установите `enable_two_phase_read_opt = false`.

**В4: Запрос ORDER BY LIMIT к таблице MOR возвращает неверные результаты. Почему?**

Убедитесь, что оптимизация TOPN не включена для таблицы MOR. Для таблиц MOR используйте модель MOW или избегайте активации этого пути оптимизации.

**В5: Почему после включения политики отказа от записи на втором этапе запрос по-прежнему записывает данные в File Cache?**

Политика управляет только вторым этапом ленивой материализации TOPN для внутренних таблиц Doris. Первый этап, другие операторы и чтения внешних таблиц по-прежнему могут записывать данные в File Cache. Используйте `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, чтобы определить, выполнял ли второй этап записи в кэш, вместо общего объёма записей запроса.

### Можно ли повысить порог 1024 для запросов с большим LIMIT? {#larger-topn-limits}

Да. По умолчанию `topn_opt_limit_threshold` равен 1024 и управляет несколькими путями оптимизации TopN. Это не максимальное поддерживаемое SQL-значение `LIMIT`, и разные пути используют разные правила включения граничного значения. Чтобы проверить запрос с `LIMIT 5000`, сначала увеличьте порог в текущем сеансе:

```sql
SET topn_opt_limit_threshold = 10000;
```

Сравните один и тот же запрос до и после изменения с помощью `EXPLAIN` и Profile. Увеличение набора кандидатов может повысить нагрузку на CPU при сортировке, пиковое потребление памяти и число строк, считываемых при двухфазной материализации. В режиме разделения вычислений и хранения разреженные чтения на втором этапе также могут увеличить удалённый ввод-вывод. Тип таблицы, ключи сортировки, селективность и другие условия оптимизации по-прежнему применяются; повышение порога не заставляет активироваться каждую оптимизацию TopN.

При представительской конкурентной нагрузке проверьте задержку запроса, число просканированных строк, пиковое потребление памяти, а также, если доступно, время второго чтения и объём удалённого чтения. После эксперимента восстановите значение по умолчанию командой `SET topn_opt_limit_threshold = 1024;`. Не повышайте глобальное значение, пока не измерите пользу для рабочей нагрузки.

## Краткая справка по связанным параметрам {#quick-reference-for-related-parameters}

| Требуемый эффект | Настройка |
| :--- | :--- |
| Полностью отключить оптимизацию TOPN | `SET topn_opt_limit_threshold = 0;` |
| Отключить только двухфазную ленивую материализацию | `SET enable_two_phase_read_opt = false;` |
| Ослабить верхнюю границу LIMIT для охвата большего числа запросов | Соответствующим образом увеличьте `topn_opt_limit_threshold` |
| Изменить порог отношения для создания фильтра | Измените `topn_filter_ratio` |
| Не записывать промахи кэша второго этапа обратно в File Cache | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| Восстановить стандартное поведение записи кэша второго этапа | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
