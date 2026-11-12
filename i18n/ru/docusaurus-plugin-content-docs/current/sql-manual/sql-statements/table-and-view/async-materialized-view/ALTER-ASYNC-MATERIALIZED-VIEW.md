---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
    "language": "ru",
    "description": "Эта инструкция используется для изменения асинхронных материализованных представлений."
}
---

## Описание {#description}

Эта инструкция используется для изменения асинхронных материализованных представлений.

#### Синтаксис {#syntax}

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### Пояснения {#illustrate}

##### RENAME {#rename}

Используется для изменения имени материализованного представления.

Например, переименование mv1 в mv2:
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod {#refreshmethod}

Аналогично [созданию асинхронных материализованных представлений](./CREATE-ASYNC-MATERIALIZED-VIEW).

Обычное асинхронное материализованное представление нельзя перевести в режим `INCREMENTAL` с помощью `ALTER MATERIALIZED VIEW`; также нельзя изменить метод обновления IVM по умолчанию на другой. Для перехода необходимо заново создать материализованное представление.

##### refreshTrigger {#refreshtrigger}

Аналогично [созданию асинхронных материализованных представлений](./CREATE-ASYNC-MATERIALIZED-VIEW).

##### SET {#set}
Изменение свойств, специфичных для материализованных представлений.

Например, изменение grace_period для mv1 на 3000 мс:
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

Среди свойств IVM свойство `ivm_use_full_keys` можно задать только при создании, после чего его нельзя изменить. Свойство `ivm_partition_window_limit` можно изменять; расширение окна или снятие ограничения делает базовое состояние материализованного представления недействительным, и при следующем обновлении всё материализованное представление перестраивается. См. [Инкрементальное обслуживание представлений (IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#ivm-properties).

##### REPLACE {#replace}
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
Атомарная замена с использованием двух материализованных представлений.

Значение swap по умолчанию: TRUE.
- Если параметр swap установлен в TRUE, операция эквивалентна переименованию материализованного представления mv1 в mv2 и одновременному переименованию mv2 в mv1.
- Если параметр swap установлен в FALSE, операция эквивалентна переименованию mv2 в mv1 и удалению исходного mv1.

Например, чтобы поменять местами имена mv1 и mv2:
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

Например, чтобы переименовать mv2 в mv1 и удалить исходное mv1:
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## Ключевые слова {#keywords}

    ALTER, ASYNC, MATERIALIZED, VIEW
