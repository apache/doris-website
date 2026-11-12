---
{
    "title": "Анализ и диагностика рабочей нагрузки: мониторинг во время выполнения и аудит исторических данных",
    "sidebar_label": "Анализ рабочей нагрузки",
    "language": "ru",
    "description": "Описывает, как выявлять узкие места кластера и диагностировать аномальные SQL-запросы с помощью мониторинга в реальном времени и исторических журналов аудита, а также как быстро восстанавливать доступность кластера.",
    "keywords": ["workload management", "workload group", "cluster diagnosis", "abnormal SQL", "audit log", "resource bottleneck", "CPU memory IO", "kill query", "backend_active_tasks", "active_queries"]
}
---

<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

Анализ рабочей нагрузки кластера делится на два этапа: **анализ текущей нагрузки** (быстрая стабилизация работы при снижении доступности кластера) и **анализ исторических данных** (ретроспективное выявление нерациональной нагрузки по журналам аудита).

## Сценарии применения {#applicable-scenarios}

| Сценарий | Условие | Основные инструменты |
|------|----------|----------|
| Анализ текущей нагрузки | Мониторинг показывает аномальный рост потребления CPU / памяти / IO | `workload_group_resource_usage`, `backend_active_tasks`, оператор KILL |
| Анализ исторических данных | Разбор инцидента или периодическая проверка | Таблицы журналов аудита, функции вычисления процентилей, оптимизация SQL |

## Анализ текущей рабочей нагрузки {#runtime-workload-analysis}

<!-- Knowledge type: Procedure -->

Если мониторинг показывает снижение доступности кластера, выполните следующие шаги.

### Шаг 1: Определите, какой ресурс стал узким местом {#step-1-determine-the-type-of-resource-bottleneck}

По данным мониторинга определите, какой ресурс сейчас является основным узким местом: память, CPU или IO. Если все три показателя высокие, сначала решите проблему с памятью.

### Шаг 2: Найдите группу рабочей нагрузки с наибольшим потреблением ресурсов {#step-2-find-the-workload-group-with-the-highest-resource-usage}

В таблице `workload_group_resource_usage` отсортируйте данные по соответствующей метрике ресурсов в порядке убывания и найдите N групп с наибольшим потреблением. Подробнее см. в разделе [Основные диагностические SQL-запросы](#common-diagnostic-sql).

### Шаг 3: Ограничьте число одновременных запросов для групп с высоким потреблением ресурсов {#step-3-limit-query-concurrency-for-high-usage-groups}

Если ресурсы кластера уже на пределе, уменьшите максимальное число одновременно выполняемых запросов для группы, чтобы новые запросы не продолжали истощать ресурсы.

### Шаг 4: Примените меры снижения нагрузки к группам с высоким потреблением ресурсов {#step-4-apply-degradation-to-high-usage-groups}

<!-- Knowledge type: Configuration parameters -->

Выберите способ снижения нагрузки в зависимости от типа узкого места:

| Тип узкого места | Способ снижения нагрузки | Примечания |
|----------|----------|------|
| CPU | Включите жёсткое ограничение CPU и уменьшите значение `cpu_hard_limit` | Высвобождает ресурсы CPU, чтобы не влиять на другие группы |
| IO | Задайте `read_bytes_per_second` | Ограничивает максимальную скорость чтения с диска для группы |
| Память | Включите жёсткое ограничение памяти и уменьшите значение `memory_limit` | Освобождает часть памяти, но может привести к сбоям многих запросов в группе |

### Шаг 5: Продолжите анализ первопричины {#step-5-further-analyze-the-root-cause}

После снижения нагрузки доступность кластера обычно частично восстанавливается. На этом этапе выясните причину резкого роста потребления ресурсов: увеличилось ли общее число одновременных запросов или нагрузку создают отдельные тяжёлые запросы. Если причина в тяжёлом запросе, быстро завершите его оператором KILL, чтобы ускорить восстановление после сбоя.

### Шаг 6: Найдите и завершите аномальные SQL-запросы {#step-6-locate-and-kill-abnormal-sql}

Объедините данные из `backend_active_tasks` и `active_queries`, чтобы найти SQL-запросы с аномальным потреблением ресурсов, и освободите ресурсы с помощью оператора KILL. Подробнее см. в разделе [Основные диагностические SQL-запросы](#common-diagnostic-sql).

## Анализ исторических данных {#historical-data-analysis}

<!-- Knowledge type: Procedure -->

Таблица журнала аудита Doris содержит краткие сведения о выполнении SQL-запросов, по которым можно ретроспективно выявить нерациональные запросы.

### Шаг 1: Подтвердите узкие места в прошлом по данным мониторинга {#step-1-confirm-historical-resource-bottlenecks-through-monitoring}

Просмотрите исторические данные мониторинга, чтобы подтвердить тип узкого места кластера (CPU, память или IO) и сузить временной диапазон для расследования.

### Шаг 2: Найдите аномальные SQL-запросы в журнале аудита {#step-2-locate-abnormal-sql-from-the-audit-log}

Определить аномальные SQL-запросы можно двумя способами:

- **На основе ожиданий бизнеса**: если большинство запросов выполняется за секунды и сканирует десятки миллионов строк, то SQL-запросы, сканирующие сотни миллионов или миллиарды строк, считаются аномальными и требуют ручного вмешательства.

- **На основе базового уровня процентилей**: если у бизнеса нет ожиданий по потреблению ресурсов, базовый уровень можно определить с помощью функций вычисления процентилей. Рассмотрим узкое место по CPU: сначала вычислите tp50/tp75/tp99/tp999 времени CPU запросов за прошлый период и используйте их как базовый уровень нормы, затем сравните их со значениями процентилей за такое же временное окно текущего периода. Например, если в прошлом tp999 составлял 1 минуту, а в текущем периоде tp50 уже достиг 1 минуты, это означает, что в текущем периоде появилось много SQL-запросов со временем CPU более 1 минуты. Такие SQL-запросы можно считать аномальными. Тот же подход применим и к другим метрикам ресурсов.

### Шаг 3: Оптимизируйте аномальные SQL-запросы {#step-3-optimize-abnormal-sql}

Оптимизируйте SQL-запросы с аномальным потреблением ресурсов. К распространённым методам относятся переписывание SQL, оптимизация схемы таблиц и настройка параллелизма. Это позволяет уменьшить потребление ресурсов отдельным SQL-запросом.

### Шаг 4: Решите, нужно ли масштабировать кластер или ограничить нагрузку {#step-4-decide-whether-to-scale-out-or-throttle}

Если журнал аудита показывает, что потребление ресурсов каждым SQL-запросом находится в норме, проверьте по данным мониторинга и журналам аудита, не превышало ли число SQL-запросов, выполнявшихся в тот момент, исторический уровень. При значительном росте уточните у владельцев приложений, увеличился ли входящий трафик, а затем решите, следует ли расширить кластер или включить очереди и ограничение нагрузки.

## Основные диагностические SQL-запросы {#common-diagnostic-sql}

<!-- Knowledge type: Procedure -->

:::tip Примечание
`active_queries` содержит запросы, зарегистрированные на FE, а `backend_active_tasks` — задачи, выполняющиеся на BE. На FE регистрируются не все запросы (например, Stream Load не регистрируется на FE), поэтому строки без соответствий при объединении `backend_active_tasks` LEFT JOIN `active_queries` — нормальное явление.

- Для запросов типа SELECT значение `queryId` в обеих таблицах совпадает.
- Для запросов типа Stream Load значение `queryId` в `active_queries` пустое, а значение `queryId` в `backend_active_tasks` — это ID операции Stream Load.
:::

**1. Просмотр потребления ресурсов каждой группой рабочей нагрузки (сортировка по памяти / CPU / IO в порядке убывания)**

```sql
SELECT be_id, workload_group_id, memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second
FROM workload_group_resource_usage
ORDER BY memory_usage_bytes DESC, cpu_usage_percent DESC, local_scan_bytes_per_second DESC;
```

**2. N SQL-запросов с наибольшим потреблением CPU**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t2.`database`,
    t1.cpu_time,
    t2.`sql`
FROM
    (SELECT query_id, query_type, sum(task_cpu_time_ms) AS cpu_time
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY cpu_time DESC
LIMIT 10;
```

**3. N SQL-запросов с наибольшим потреблением памяти**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.mem_used
FROM
    (SELECT query_id, query_type, sum(current_used_memory_bytes) AS mem_used
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY mem_used DESC
LIMIT 10;
```

**4. N SQL-запросов с наибольшим объёмом сканируемых данных**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.scan_rows,
    t1.scan_bytes
FROM
    (SELECT query_id, query_type, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY scan_rows DESC, scan_bytes DESC
LIMIT 10;
```

**5. Сводка объёма сканируемых данных для каждой группы рабочей нагрузки**

```sql
SELECT
    t2.workload_group_id,
    sum(t1.scan_rows) AS wg_scan_rows,
    sum(t1.scan_bytes) AS wg_scan_bytes
FROM
    (SELECT query_id, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
GROUP BY t2.workload_group_id
ORDER BY wg_scan_rows DESC, wg_scan_bytes DESC;
```

**6. Просмотр запросов в очереди и времени ожидания для каждой группы рабочей нагрузки**

```sql
SELECT
    workload_group_id,
    query_id,
    query_status,
    now() - queue_start_time AS queued_time
FROM active_queries
WHERE query_status = 'queued'
ORDER BY workload_group_id;
```
