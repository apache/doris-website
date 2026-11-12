---
{
    "title": "ROLLBACK",
    "language": "ru",
    "description": "Откатывает явную транзакцию. Используется в паре с BEGIN."
}
---

## Описание {#description}

Откатывает явную транзакцию. Используется в паре с [BEGIN](./BEGIN).

## Синтаксис {#syntax}

```sql
ROLLBACK
```

## Примечания по использованию {#usage-notes}

- Если явная транзакция не начата, выполнение этой команды не даст эффекта.

## Примеры {#examples}

В следующем примере создаётся таблица с именем `test`, начинается транзакция, вставляются две строки данных, выполняется откат транзакции, а затем выполняется запрос.

```sql
CREATE TABLE `test` (
  `ID` int NOT NULL,
  `NAME` varchar(100) NULL,
  `SCORE` int NULL
) ENGINE=OLAP
DUPLICATE KEY(`ID`)
DISTRIBUTED BY HASH(`ID`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

BEGIN;
INSERT INTO test VALUES(1, 'Bob', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
ROLLBACK;
SELECT * FROM test;
```
