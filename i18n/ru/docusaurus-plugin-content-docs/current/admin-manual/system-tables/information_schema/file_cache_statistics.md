---
{
    "title": "file_cache_statistics",
    "language": "ru",
    "description": "Позволяет просматривать метрики кеша данных на каждом узле BE."
}
---

## Обзор {#overview}

Позволяет просматривать метрики кеша данных на каждом узле BE. Источником информации служат метрики мониторинга кеша данных BE.

:::tip Совет
Эта системная таблица поддерживается начиная с версий 2.1.6 и 3.0.2.
:::

## База данных {#database}

`information_schema`

## Информация о таблице {#table-information}

| Имя столбца | Тип | Описание |
|---|---|---|
| BE_ID | BIGINT | Идентификатор узла BE |
| BE_IP | STRING | IP-адрес узла BE |
| CACHE_PATH | STRING | Путь к кешу узла BE |
| METRIC_NAME | STRING | Имя метрики |
| METRIC_VALUE | STRING | Текстовое представление значения метрики; для числовых сравнений или вычислений требуется явное приведение типа |

:::info Примечание

Набор метрик может различаться в разных версиях Doris.

:::

### Метрики версии 2.1.x {#21x-metrics}

> Приведены только основные метрики.

- `normal_queue_curr_elements`

    Текущее количество File Blocks в кеше.

- `normal_queue_max_elements`

    Максимально допустимое количество File Blocks в кеше.

- `normal_queue_curr_size`

    Текущий размер кеша.

- `normal_queue_max_size`

    Максимально допустимый размер кеша.

- `hits_ratio`

    Общая доля попаданий в кеш с момента запуска BE. Диапазон: 0-1.

- `hits_ratio_5m`

    Доля попаданий в кеш за последние 5 минут. Диапазон: 0-1.

- `hits_ratio_1h`

    Доля попаданий в кеш за последний 1 час. Диапазон: 0-1.

### Метрики версии 3.0.x {#30x-metrics}

Будет дополнено

### Изменения метрик в версии 4.1.5 {#metric-changes-in-version-415}

Начиная с версии 4.1.5 доступны следующие два значения `METRIC_NAME`. Они накапливаются отдельно для каждого BE и каждого пути к кешу с момента запуска процесса:

| METRIC_NAME | Единица измерения | Значение |
| --- | --- | --- |
| `evict_not_downloaded_size` | Байты | Суммарный логический размер диапазонов блоков кеша, удалённых до завершения загрузки, за исключением блоков, которые сейчас загружаются; не отражает физическое вытеснение загруженных данных |
| `evict_not_downloaded_num` | Блоки | Суммарное количество таких удалённых блоков кеша |

Начиная с той же версии `total_removed_size` учитывает только байты удалённых блоков кеша, которые были полностью загружены. Для блоков, которые не были загружены, учёт ведётся отдельно с помощью новых метрик. Пометка загружаемого блока для удаления не увеличивает эти счётчики.

Соответствующие имена в brpc `/vars`: `file_cache_evict_not_downloaded_size` и `file_cache_evict_not_downloaded_num`. Каждое из них имеет префикс с соответствующим путём к кешу. См. [Мониторинг кеша файлов](../../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics). В системной таблице `METRIC_NAME` не содержит префикса пути; путь указан в `CACHE_PATH`.

Например, следующий запрос возвращает новые метрики и суммарный объём удалённых загруженных данных:

```sql
SELECT BE_ID, CACHE_PATH, METRIC_NAME, CAST(METRIC_VALUE AS DOUBLE) AS metric_value
FROM information_schema.file_cache_statistics
WHERE METRIC_NAME IN ('total_removed_size', 'evict_not_downloaded_size', 'evict_not_downloaded_num')
ORDER BY BE_ID, CACHE_PATH, METRIC_NAME;
```

Запрос возвращает метрики для каждого пути к кешу на каждом BE. Значения меняются по мере использования кеша.

## Примеры {#examples}

1. Запрос всех метрик кеша

    ```sql
    mysql> select * from information_schema.file_cache_statistics;
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | BE_ID | BE_IP         | CACHE_PATH                 | METRIC_NAME                | METRIC_VALUE       |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_elements |               1392 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_size     |          248922234 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_elements  |             102400 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_size      |        21474836480 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio                 | 0.8539634687001242 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_1h              |                  0 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_5m              |                  0 |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    ```

2. Запрос доли попаданий в кеш с сортировкой по этой доле

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by cast(METRIC_VALUE as double) desc;
    ```
