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

Используется для изменения имени материализованного представления

Например, изменение имени mv1 на mv2
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod {#refreshmethod}

Аналогично [созданию асинхронных материализованных представлений](./CREATE-ASYNC-MATERIALIZED-VIEW)

##### refreshTrigger {#refreshtrigger}

Аналогично [созданию асинхронных материализованных представлений](./CREATE-ASYNC-MATERIALIZED-VIEW)

##### SET {#set}
Изменение свойств, специфичных для материализованных представлений

Например, изменение grace_period для mv1 на 3000 мс
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

##### REPLACE {#replace}
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
Атомарная замена с участием двух материализованных представлений

По умолчанию swap имеет значение TRUE
- Если параметр swap установлен в TRUE, это эквивалентно переименованию материализованного представления mv1 в mv2 и одновременному переименованию mv2 в mv1
- Если параметр swap установлен в FALSE, это эквивалентно переименованию mv2 в mv1 и удалению исходного mv1

Например, если нужно поменять местами имена mv1 и mv2
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

Например, если нужно переименовать mv2 в mv1 и удалить исходное mv1
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## Ключевые слова {#keywords}

    ALTER, ASYNC, MATERIALIZED, VIEW
