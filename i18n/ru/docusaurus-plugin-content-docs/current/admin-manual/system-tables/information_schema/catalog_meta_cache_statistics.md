---
{
    "title": "catalog_meta_cache_statistics",
    "language": "ru",
    "description": "Просмотр настроек кэша метаданных внешних Catalog, показателей его работы и статистики управления памятью на узлах FE."
}
---

## Обзор {#overview}

`catalog_meta_cache_statistics` содержит по одной строке для каждой доступной текущему пользователю комбинации FE, внешнего Catalog, движка кэширования метаданных и элемента кэша. В ней представлены настройки кэша и показатели работы Caffeine, а также появившиеся в Doris 4.1.4 ограничения объёма удерживаемой памяти, оценки её использования и сведения об отказах в добавлении данных в кэш.

## База данных {#database}

`information_schema`

## Информация о таблице {#table-information}

| Столбец | Тип | Описание |
|---|---|---|
| `FE_HOST` | STRING | Узел FE, предоставляющий эту строку. |
| `CATALOG_NAME` | STRING | Имя внешнего Catalog. |
| `ENGINE_NAME` | STRING | Движок кэширования метаданных, например `hive`, `iceberg` или `paimon`. |
| `ENTRY_NAME` | STRING | Элемент кэша в движке. |
| `EFFECTIVE_ENABLED` | BOOLEAN | Действует ли элемент в данный момент с учётом настроек включения, TTL, ёмкости и веса. |
| `CONFIG_ENABLED` | BOOLEAN | Настроенное значение `enable`. |
| `AUTO_REFRESH` | BOOLEAN | Включено ли управляемое автоматическое обновление. |
| `TTL_SECOND` | BIGINT | Срок хранения в секундах. `-1` означает бессрочное хранение, а `0` отключает элемент. |
| `CAPACITY` | BIGINT | Настроенное ограничение на количество записей. Если задан `max-weight`, это значение не задаёт дополнительного ограничения на количество записей, однако `0` по-прежнему отключает элемент. |
| `ESTIMATED_SIZE` | BIGINT | Приблизительное количество записей в кэше. |
| `REQUEST_COUNT` | BIGINT | Общее количество запросов на поиск в кэше. |
| `HIT_COUNT` | BIGINT | Количество попаданий в кэш. |
| `MISS_COUNT` | BIGINT | Количество промахов при обращении к кэшу. |
| `HIT_RATE` | DOUBLE | Доля попаданий в кэш от `0.0` до `1.0`. |
| `LOAD_SUCCESS_COUNT` | BIGINT | Количество успешных загрузок в кэш. |
| `LOAD_FAILURE_COUNT` | BIGINT | Количество неудачных загрузок в кэш. |
| `TOTAL_LOAD_TIME_MS` | BIGINT | Общее время загрузки в кэш в миллисекундах. |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | Среднее время загрузки в миллисекундах. |
| `EVICTION_COUNT` | BIGINT | Количество вытеснений, выполненных Caffeine, и явных вытеснений для соблюдения локального бюджета памяти. |
| `EVICTION_RATE` | DOUBLE | Отношение `EVICTION_COUNT` к `REQUEST_COUNT`; `0`, если запросов нет. |
| `INVALIDATE_COUNT` | BIGINT | Количество явных инвалидаций. |
| `LAST_LOAD_SUCCESS_TIME` | STRING | Время последней успешной загрузки. |
| `LAST_LOAD_FAILURE_TIME` | STRING | Время последней неудачной загрузки. |
| `LAST_ERROR` | STRING | Последняя ошибка загрузки; пустое значение, если ошибка не зарегистрирована. |
| `MAX_WEIGHT` | BIGINT | Действующее ограничение объёма памяти для элемента в байтах. |
| `ESTIMATED_WEIGHT` | BIGINT | Текущий зарезервированный оценочный вес этого элемента в байтах. |
| `WEIGHT_REJECT_COUNT` | BIGINT | Накопленное количество отказов в добавлении данных в кэш из-за неполной оценки или недостаточного бюджета веса. |
| `LAST_WEIGHT_REJECT_REASON` | STRING | Причина последнего отказа в добавлении в кэш при проверке веса. |

Для элементов, к которым не применяется ограничение памяти на уровне FE, Catalog или самого элемента, `MAX_WEIGHT` равно `-1`, а `ESTIMATED_WEIGHT` равно `0`.

Для столбцов веса используются два подхода к учёту значений во времени:

- `ESTIMATED_WEIGHT` является метрикой типа gauge. Она отражает объём резервирования на момент запроса.
- `WEIGHT_REJECT_COUNT` и другие столбцы со счётчиками накапливают значения в рамках текущего экземпляра кэша. Их значения сбрасываются до нуля при пересоздании группы кэшей после изменения свойства Catalog или перезапуска FE.

Таблица не хранит историю значений. Чтобы отслеживать динамику, периодически запрашивайте её содержимое.

## Пример использования {#usage-example}

Получите суммарный объём резервирования для элементов с управлением памятью по каждому Catalog. Обычно это первый запрос при анализе использования памяти FE:

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

Проверьте элементы с управлением памятью и результат последней попытки добавления данных в кэш:

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
