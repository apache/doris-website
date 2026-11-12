---
{
    "title": "rowsets",
    "language": "ru",
    "description": "Возвращает основные сведения о Rowset."
}
---

## Обзор {#overview}

Возвращает основные сведения о Rowset.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца            | Тип         | Описание                                                     |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | Идентификатор Backend, однозначно определяющий этот Backend. |
| ROWSET_ID              | varchar(64) | Идентификатор Rowset, однозначно определяющий этот Rowset. |
| TABLET_ID              | bigint      | Идентификатор Tablet, однозначно определяющий этот Tablet. |
| ROWSET_NUM_ROWS        | bigint      | Количество строк данных, содержащихся в Rowset.             |
| TXN_ID                 | bigint      | Идентификатор транзакции, выполнившей запись в Rowset.       |
| NUM_SEGMENTS           | bigint      | Количество Segments, содержащихся в Rowset.                 |
| START_VERSION          | bigint      | Начальный номер версии Rowset.                             |
| END_VERSION            | bigint      | Конечный номер версии Rowset.                              |
| INDEX_DISK_SIZE        | bigint      | Объём пространства, занимаемого индексами в Rowset.         |
| DATA_DISK_SIZE         | bigint      | Объём пространства, занимаемого данными в Rowset.           |
| CREATION_TIME          | datetime    | Время создания Rowset.                                     |
| NEWEST_WRITE_TIMESTAMP | datetime    | Время последней записи в Rowset.                           |
| SCHEMA_VERSION         | int         | Номер версии Schema таблицы, которой соответствуют данные Rowset. |
