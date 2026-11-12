---
{
    "title": "rowsets",
    "language": "ru",
    "description": "Возвращает основную информацию о Rowset."
}
---

## Обзор {#overview}

Возвращает основную информацию о Rowset.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца            | Тип         | Описание                                                     |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | Идентификатор Backend, уникально определяющий Backend.        |
| ROWSET_ID              | varchar(64) | Идентификатор Rowset, уникально определяющий Rowset.          |
| TABLET_ID              | bigint      | Идентификатор Tablet, уникально определяющий Tablet.          |
| ROWSET_NUM_ROWS        | bigint      | Количество строк данных в Rowset.                            |
| TXN_ID                 | bigint      | Идентификатор транзакции, выполнившей запись в Rowset.        |
| NUM_SEGMENTS           | bigint      | Количество объектов Segment в Rowset.                        |
| START_VERSION          | bigint      | Номер начальной версии Rowset.                               |
| END_VERSION            | bigint      | Номер конечной версии Rowset.                                |
| INDEX_DISK_SIZE        | bigint      | Объём дискового пространства, занимаемого индексами в Rowset. |
| DATA_DISK_SIZE         | bigint      | Объём дискового пространства, занимаемого данными в Rowset.   |
| CREATION_TIME          | datetime    | Время создания Rowset.                                       |
| NEWEST_WRITE_TIMESTAMP | datetime    | Время последней записи в Rowset.                             |
| SCHEMA_VERSION         | int         | Номер версии схемы таблицы, которой соответствуют данные Rowset. |
| COMMIT_TSO | varchar(64) | Диапазон TSO для Rowset в формате `[start_tso-end_tso]` (только в dev). Если диапазон не записан, по умолчанию используется `[-1--1]`. |

## Использование COMMIT_TSO {#commit_tso-usage}

Этот столбец содержит строку: не сортируйте его как единое значение BIGINT и не сравнивайте напрямую с числом `-1`. Отсутствующий диапазон отображается как `[-1--1]`; значение для одной фиксации также отображается в виде диапазона с начальным и конечным значениями.

```sql
SELECT BACKEND_ID, ROWSET_ID, COMMIT_TSO
FROM information_schema.rowsets
WHERE COMMIT_TSO <> '[-1--1]'
LIMIT 20;
```

Результат содержит список Rowset с записанными диапазонами или пуст, если ни один диапазон не записан. Сведения о проверке состояния и настройке см. в разделе [TSO](../../cluster-management/tso.md).
