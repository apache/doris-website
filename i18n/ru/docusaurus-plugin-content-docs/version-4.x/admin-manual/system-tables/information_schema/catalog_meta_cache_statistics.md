---
{
    "title": "catalog_meta_cache_statistics",
    "language": "ru",
    "description": "Просмотр конфигурации кэша метаданных External Catalog, показателей его активности и статистики управления памятью на узлах FE."
}
---

## Обзор {#overview}

`catalog_meta_cache_statistics` показывает по одной строке для каждой комбинации FE, External Catalog, движка кэша метаданных и элемента кэша, доступной текущему пользователю. Таблица содержит конфигурацию кэша и показатели активности Caffeine, а также появившиеся в Doris 4.1.4 ограничения объёма удерживаемой памяти, оценку её использования, вес вытесненных данных и сведения об отказах в добавлении в кэш.

## База данных {#database}

`information_schema`

## Информация о таблице {#table-information}

| Столбец | Тип | Описание |
|---|---|---|
| `FE_HOST` | STRING | Узел FE, предоставляющий эту строку. |
| `CATALOG_NAME` | STRING | Имя External Catalog. |
| `ENGINE_NAME` | STRING | Движок кэша метаданных, например `hive`, `iceberg` или `paimon`. |
| `ENTRY_NAME` | STRING | Элемент кэша в движке. |
| `EFFECTIVE_ENABLED` | BOOLEAN | Активен ли элемент с учётом настроек включения, TTL, ёмкости и веса. |
| `CONFIG_ENABLED` | BOOLEAN | Заданное значение `enable`. |
| `AUTO_REFRESH` | BOOLEAN | Включено ли управляемое автоматическое обновление. |
| `TTL_SECOND` | BIGINT | Срок действия в секундах. `-1` означает отсутствие срока действия, а `0` отключает элемент. |
| `CAPACITY` | BIGINT | Заданная ёмкость по количеству записей. При использовании `max-weight` она не служит одновременно действующим ограничением по количеству, но `0` по-прежнему отключает элемент. |
| `ESTIMATED_SIZE` | BIGINT | Приблизительное количество закэшированных пар ключ-значение. |
| `REQUEST_COUNT` | BIGINT | Общее число запросов на поиск в кэше. |
| `HIT_COUNT` | BIGINT | Число попаданий в кэш. |
| `MISS_COUNT` | BIGINT | Число промахов кэша. |
| `HIT_RATE` | DOUBLE | Доля попаданий в кэш от `0.0` до `1.0`. |
| `LOAD_SUCCESS_COUNT` | BIGINT | Число успешных загрузок в кэш. |
| `LOAD_FAILURE_COUNT` | BIGINT | Число неудачных загрузок в кэш. |
| `TOTAL_LOAD_TIME_MS` | BIGINT | Общее время загрузки в кэш в миллисекундах. |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | Среднее время загрузки в миллисекундах. |
| `EVICTION_COUNT` | BIGINT | Число вытеснений, выполненных Caffeine, и явных вытеснений для соблюдения локального бюджета. |
| `INVALIDATE_COUNT` | BIGINT | Число явных инвалидаций. |
| `LAST_LOAD_SUCCESS_TIME` | STRING | Время последней успешной загрузки. |
| `LAST_LOAD_FAILURE_TIME` | STRING | Время последней неудачной загрузки. |
| `LAST_ERROR` | STRING | Последняя ошибка загрузки; значение пустое, если ошибок не зафиксировано. |
| `WEIGHT_BOUNDED` | BOOLEAN | Действует ли для этого элемента ограничение памяти на уровне FE, Catalog или самого элемента. |
| `MAX_WEIGHT` | BIGINT | Действующее ограничение памяти для элемента в байтах. |
| `ESTIMATED_WEIGHT` | BIGINT | Текущий зарезервированный расчётный вес этого элемента в байтах. |
| `EVICTION_WEIGHT` | BIGINT | Суммарный расчётный объём памяти в байтах, освобождённой при автоматическом вытеснении и вытеснении для соблюдения локального бюджета. |
| `WEIGHT_REJECT_COUNT` | BIGINT | Суммарное число отказов в добавлении в кэш из-за неполной оценки или недостаточного бюджета веса. |
| `CATALOG_MAX_WEIGHT` | BIGINT | Ограничение памяти для Catalog в байтах. |
| `CATALOG_ESTIMATED_WEIGHT` | BIGINT | Текущий зарезервированный расчётный вес всех управляемых элементов в этом Catalog. |
| `GLOBAL_MAX_WEIGHT` | BIGINT | Общее для FE ограничение памяти кэша внешних метаданных в байтах. |
| `GLOBAL_ESTIMATED_WEIGHT` | BIGINT | Текущий зарезервированный расчётный вес всех управляемых кэшей внешних метаданных на FE. |
| `LAST_WEIGHT_REJECT_REASON` | STRING | Последняя причина отказа в добавлении в кэш по весу. |

Для элементов с ограничением по количеству или при ненастроенном ограничении родительского уровня числовые столбцы, связанные с весом, содержат `-1`, если значение неприменимо.

Значения столбцов, связанных с весом, имеют два типа временной семантики:

- `ESTIMATED_WEIGHT` отражает текущее состояние. Он показывает зарезервированный объём на момент выполнения запроса.
- `WEIGHT_REJECT_COUNT` и остальные столбцы со счётчиками содержат накопленные значения для текущего экземпляра кэша. Отсчёт начинается с нуля при пересоздании группы кэшей после изменения свойства Catalog или перезапуска FE.

Таблица не хранит исторические замеры. Если нужно отслеживать динамику, запрашивайте её периодически.

## Пример использования {#usage-example}

Подсчитайте суммарный зарезервированный объём памяти элементов с ограничением памяти для каждого Catalog. Обычно это первый запрос при исследовании использования памяти FE:

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

Просмотрите элементы с ограничением памяти и последний результат попытки добавления в кэш для каждого из них:

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

Проверьте эффективность кэша и ошибки загрузки для одного Catalog:
Проверьте эффективность кэша и ошибки загрузки для одного Catalog:

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
