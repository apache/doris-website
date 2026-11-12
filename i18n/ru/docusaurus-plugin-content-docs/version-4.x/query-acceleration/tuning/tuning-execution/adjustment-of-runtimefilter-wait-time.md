---
{
    "title": "Настройка времени ожидания RuntimeFilter: устранение состояния NOT_READY и медленного выполнения запросов",
    "sidebar_label": "Настройка RuntimeFilter",
    "language": "ru",
    "description": "Запросы выполняются медленно, потому что тайм-аут ожидания RuntimeFilter не сработал? В этой статье показано, как с помощью Profile выявить состояние NOT_READY и настроить runtime_filter_wait_time_ms.",
    "keywords": ["Doris RuntimeFilter", "runtime_filter_wait_time_ms", "RuntimeFilterState NOT_READY", "WaitForRuntimeFilter", "Настройка запросов"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Query performance issues caused by unreasonable (too short / too long) RuntimeFilter wait time -->

**RuntimeFilter** представляет собой метод оптимизации запросов: во время выполнения он формирует условия фильтрации по правой таблице Join и проталкивает их на этап сканирования левой таблицы, сокращая тем самым I/O и объём вычислений.

Если время ожидания RuntimeFilter задано некорректно (слишком мало), сканирование левой таблицы может начаться до формирования фильтра. В результате оптимизация не срабатывает, и запрос выполняется медленнее.

В этой статье на реальном примере Profile показано, как выявить и устранить эту проблему.

## Проверка применимости {#applicability-checklist}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Determine whether RuntimeFilter wait time needs to be adjusted -->

Прежде чем изменять время ожидания, убедитесь в следующем:

- Запрос выполняется медленно и содержит операцию Join.
- План выполнения и профиль выполнения получены с помощью `EXPLAIN` / `PROFILE`.
- В Profile есть поле `WaitForRuntimeFilter`.
- RuntimeFilter находится в состоянии `NOT_READY`, либо время построения Join превышает текущее время ожидания.

## Основные параметры {#key-parameters}

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Adjust RuntimeFilter wait time -->

| Параметр | По умолчанию | Описание |
| --- | --- | --- |
| `runtime_filter_wait_time_ms` | 1000 мс | Максимальное время, в течение которого сканирование левой таблицы ожидает формирования RuntimeFilter. По истечении этого времени ожидание прекращается и начинается сканирование. |

Как задать значение (на уровне Session):

```sql
SET runtime_filter_wait_time_ms = 3000;
```

## Пример: слишком короткое время ожидания приводит к неготовности RuntimeFilter {#case-wait-time-too-short-causes-runtimefilter-not-ready}

<!-- Knowledge type: Case analysis -->
<!-- Applicable scenario: Diagnose RuntimeFilter NOT_READY issues through Profile -->

### Шаг 1: проверка состояния ожидания по данным ScanOperator {#step-1-observe-the-wait-state-from-scanoperator}

Рассмотрим следующие данные Profile:

```sql
OLAP_SCAN_OPERATOR (id=22. nereids_id=1764. table name = test_doris(test_doris)):(ExecTime: 62.870ms)
               - RuntimeFilters: : RuntimeFilter: (id = 6, type = minmax, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false, RuntimeFilter: (id = 7, type = in_or_bloomfilter, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false,
               - PushDownPredicates: []
               - KeyRanges: ScanKeys:ScanKey=[null(-9223372036854775808) : 9223372036854775807]
               - TabletIds: [1732763414173, 1732763414187, 1732763414201, 1732763414215]
               - UseSpecificThreadToken: False
               - AcquireRuntimeFilterTime: 969ns
               - BlocksProduced: 1.829K (1829)
               - CloseTime: 0ns
               - ExecTime: 62.870ms
               - InitTime: 75.703us
               - KeyRangesNum: 0
               - MaxScannerThreadNum: 32
               - MemoryUsage:
                 - PeakMemoryUsage: 0.00
               - NumScanners: 32
               - OpenTime: 19.276ms
               - ProcessConjunctTime: 30.360us
               - ProjectionTime: 0ns
               - RowsProduced: 7.433056M (7433056)
               - RowsRead: 0
               - RuntimeFilterInfo:
               - ScannerWorkerWaitTime: 0ns
               - TabletNum: 4
               - TotalReadThroughput: 0
               - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: 0ns
               - WaitForRuntimeFilter: 1000ms
              RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
              RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

Ключевые признаки:

- `WaitForRuntimeFilter: 1000ms`: оператор сканирования ожидал 1000 мс.
- `RuntimeFilterState = NOT_READY`: фильтры RuntimeFilter 6 и 7 всё ещё не готовы.
- `IsPushDown = false`: фильтры не удалось протолкнуть на этап сканирования.

### Шаг 2: поиск Join, который формирует фильтры RuntimeFilter {#step-2-locate-the-join-that-generates-the-runtimefilters}

```sql
RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

Найдите в Profile оператор Join, который формирует фильтры RuntimeFilter 6 и 7:

```sql
HASH_JOIN_OPERATOR (id=26 , nereids_id=37948):
                - PlanInfo
                   - join op: RIGHT OUTER JOIN(PARTITIONED)[]
                   - equal join conjunct: (id = ID)
                   - runtime filters: RF006[min_max] <- ID(6418/8192/1048576), RF007[in_or_bloom] <- ID(6418/8192/1048576)
                   - cardinality=6,418
                   - vec output tuple id: 27
                   - output tuple id: 27
                   - vIntermediate tuple ids: 25
                   - hash output slot ids: 396 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 447
                   - projections: USER_ID
                   - project output tuple id: 27
                - BlocksProduced: sum 1, avg 1, max 1, min 1
                - CloseTime: avg 10.111us, max 10.111us, min 10.111us
                - ExecTime: avg 364.497us, max 364.497us, min 364.497us
                - InitTime: avg 26.653us, max 26.653us, min 26.653us
                - MemoryUsage: sum , avg , max , min
                  - PeakMemoryUsage: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                  - ProbeKeyArena: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                - OpenTime: avg 45.985us, max 45.985us, min 45.985us
                - ProbeRows: sum 0, avg 0, max 0, min 0
                - ProjectionTime: avg 211.930us, max 211.930us, min 211.930us
                - RowsProduced: sum 1, avg 1, max 1, min 1
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 1sec780ms, max 1sec780ms, min 1sec780ms
```

`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: 1sec780ms` указывает, что построение Join занимает около **1.78 с**. Это превышает время ожидания RuntimeFilter по умолчанию, равное 1 с. В результате ScanOperator не успевает дождаться фильтра.

### Шаг 3: увеличение времени ожидания {#step-3-increase-the-wait-time}

- **Цель**: дать оператору сканирования дождаться формирования RuntimeFilter, чтобы сработало проталкивание фильтра.
- **Команда**:

  ```sql
  SET runtime_filter_wait_time_ms = 3000;
  ```

- **Пояснение**: увеличьте предел ожидания с 1000 мс до 3000 мс, чтобы учесть время построения Join, равное 1.78 с.

### Шаг 4: проверка результата {#step-4-verify-the-effect}

После изменения настройки время выполнения запроса сократилось с **5 с до 2 с**.

## Сравнение способов диагностики {#diagnostic-workflow-comparison}

<!-- Knowledge type: Method comparison -->
<!-- Applicable scenario: Quickly select a diagnostic path -->

| Симптом | Возможная причина | Рекомендуемое действие |
| --- | --- | --- |
| `RuntimeFilterState = NOT_READY`, а `WaitForRuntimeFilter` близко к пределу | Слишком короткое время ожидания, медленное построение Join | Увеличить `runtime_filter_wait_time_ms` |
| `RuntimeFilterState = READY` и `IsPushDown = true` | Фильтр действует | Настройка не требуется |
| `Ignored = true` | У фильтра низкая селективность, поэтому он автоматически игнорируется | Проверить селективность Join; не включать принудительно |
| Этап сканирования долго простаивает | Слишком большое время ожидания, фильтр приносит мало пользы | Соответствующим образом уменьшить `runtime_filter_wait_time_ms` |

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshoot RuntimeFilter-related questions -->

**Вопрос 1: всегда ли лучше увеличивать `runtime_filter_wait_time_ms`?**

Нет. Слишком долгое ожидание приводит к длительному простою при сканировании левой таблицы и замедляет выполнение запроса. Рекомендуется умеренно увеличивать значение с учётом времени построения Join (`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time`).

**Вопрос 2: как определить, что RuntimeFilter действительно действует?**

Проверьте поля `RuntimeFilterState` и `IsPushDown` фильтра RuntimeFilter в Profile. Значения `READY` и `IsPushDown = true` означают, что фильтр действует.

**Вопрос 3: что делать, если после настройки сохраняется состояние NOT_READY?**

Проверьте, нет ли более серьёзного узкого места на стороне правой таблицы Join (например, перекоса данных или медленного Shuffle), либо рассмотрите возможность отключить неэффективные для этого запроса фильтры RuntimeFilter с помощью SQL Hint.

**Вопрос 4: можно ли задать этот параметр глобально?**

Да, но рекомендуется настраивать его на уровне Session или для отдельного SQL-запроса с помощью Hint, чтобы глобальное изменение не влияло на другие запросы.

## Итоги {#summary}

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Practical recap -->

- Время ожидания RuntimeFilter следует выбирать с учётом времени построения Join. Универсального значения нет.
- Используйте `EXPLAIN` и `PROFILE`, чтобы выявить состояние `NOT_READY` и определить время выполнения Join.
- Используйте `SET runtime_filter_wait_time_ms` или SQL Hint для настройки времени ожидания.
- В Doris постоянно совершенствуется адаптивная оптимизация, поэтому в будущем необходимость вручную настраивать этот параметр будет постепенно снижаться.
