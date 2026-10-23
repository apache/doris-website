---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "ru",
    "description": "Этот оператор выводит группы рабочей нагрузки, доступные текущему пользователю для просмотра."
}
---

## Описание {#description}

Этот оператор выводит группы рабочей нагрузки, доступные текущему пользователю для просмотра. Для поиска по шаблону имени можно использовать `LIKE`. Чтобы просмотреть определённую группу рабочей нагрузки, пользователь должен иметь привилегию `USAGE_PRIV` для этой группы или глобальную привилегию `ADMIN_PRIV`.

## Синтаксис {#syntax}

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## Примеры {#examples}

### Пример 1: вывод всех групп рабочей нагрузки {#example-1-show-all-workload-groups}

```sql
SHOW WORKLOAD GROUPS;
```

```text
mysql> show workload groups \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
*************************** 2. row ***************************
                          Id: 1754740507946
                        Name: test_group2
             min_cpu_percent: 10%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 3%
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
             scan_thread_num: -1
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

### Пример 2: вывод групп рабочей нагрузки по шаблону {#example-2-show-workload-groups-using-a-pattern}

```sql
SHOW WORKLOAD GROUPS LIKE "normal%";
```

```text
mysql> show workload groups like "normal%" \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

## Описание полей {#field-descriptions}

Этот оператор возвращает группы рабочей нагрузки, видимые текущему пользователю. Ниже описаны основные поля результата:

| Поле | Описание |
| --- | --- |
| `Id` | Идентификатор группы рабочей нагрузки. |
| `Name` | Имя группы рабочей нагрузки. |
| `min_cpu_percent` | Минимальная гарантированная доля CPU в процентах. |
| `max_cpu_percent` | Максимальная доля CPU в процентах. |
| `min_memory_percent` | Минимальная гарантированная доля памяти в процентах. |
| `max_memory_percent` | Максимальная доля памяти в процентах. |
| `max_concurrency` | Максимальное количество одновременно выполняемых запросов. |
| `max_queue_size` | Максимальная длина очереди ожидающих запросов. |
| `queue_timeout` | Максимальное время ожидания в очереди в миллисекундах. |
| `scan_thread_num` | Количество потоков локального сканирования, используемых группой рабочей нагрузки. |
| `max_remote_scan_thread_num` | Максимальное количество потоков сканирования для удалённых источников данных. |
| `min_remote_scan_thread_num` | Минимальное количество потоков сканирования для удалённых источников данных. |
| `memory_low_watermark` | Нижний порог использования памяти. |
| `memory_high_watermark` | Верхний порог использования памяти. |
| `compute_group` | Вычислительная группа, к которой относится группа рабочей нагрузки. В необлачном режиме здесь обычно отображается группа ресурсов или тег по умолчанию, например `default`. |
| `read_bytes_per_second` | Ограничение пропускной способности IO при чтении внутренних таблиц Doris, в байтах в секунду. `-1` означает отсутствие ограничения. |
| `remote_read_bytes_per_second` | Ограничение пропускной способности IO при чтении удалённых источников данных, в байтах в секунду. `-1` означает отсутствие ограничения. |
| `slot_memory_policy` | Политика выделения памяти для слотов запросов. |
| `running_query_num` | Количество запросов, выполняемых в данный момент в этой группе рабочей нагрузки. |
| `waiting_query_num` | Количество запросов, ожидающих в данный момент в очереди этой группы рабочей нагрузки. |

## Примечания по использованию {#usage-notes}

1. Этот оператор поддерживает только фильтрацию с помощью `LIKE` и не поддерживает предложение `WHERE`.
2. Этот оператор предназначен для простого отображения информации о группах рабочей нагрузки. Для более сложных запросов или фильтрации используйте TVF `workload_groups()`.
3. Результаты фильтруются с учётом привилегий. Чтобы просмотреть определённую группу рабочей нагрузки, пользователь должен иметь привилегию `USAGE_PRIV` для этой группы или глобальную привилегию `ADMIN_PRIV`. Пример:

   ```sql
   GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
   ```

4. В текущей реализации группа рабочей нагрузки по умолчанию `normal` обычно видна без дополнительного предоставления прав из соображений совместимости.
