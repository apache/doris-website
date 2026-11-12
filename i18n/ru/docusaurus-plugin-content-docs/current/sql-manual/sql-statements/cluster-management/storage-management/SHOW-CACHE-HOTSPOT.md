---
{
    "title": "SHOW CACHE HOTSPOT",
    "language": "ru",
    "description": "Эта инструкция используется для просмотра информации о горячих точках файлового кэша."
}
---

## Описание {#description}


Эта инструкция используется для просмотра информации о горячих точках файлового кэша.

:::info Примечание

До версии 3.0.4 для получения статистики по горячим точкам кэша можно было использовать инструкцию `SHOW CACHE HOTSPOT`. Начиная с версии 3.0.4, использование инструкции `SHOW CACHE HOTSPOT` для получения такой статистики больше не поддерживается. Для выполнения запросов обращайтесь напрямую к системной таблице `__internal_schema.cloud_cache_hotspot`. Подробные инструкции см. в разделе [УПРАВЛЕНИЕ ФАЙЛОВЫМ КЭШЕМ](../../../../compute-storage-decoupled/file-cache/file-cache).

:::

## Синтаксис {#syntax}


```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<table_name>]';
```

## Параметры {#parameters}


| Имя параметра	                  | Описание                                                         |
|---------------------------|--------------------------------------------------------------|
| <compute_group_name>        | Имя вычислительной группы.                                               |
| <table_name>                | Имя таблицы.                                                   |
## Примеры {#examples}

1. Показать информацию о горячих точках кэша для всей системы:

```sql
SHOW CACHE HOTSPOT '/';
```

2. Показать информацию о горячих точках кэша для конкретной вычислительной группы my_compute_group:

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```

## См. также {#references}

- [WARMUP CACHE](../../../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP)
- [УПРАВЛЕНИЕ ФАЙЛОВЫМ КЭШЕМ](../../../../compute-storage-decoupled/file-cache/file-cache)
