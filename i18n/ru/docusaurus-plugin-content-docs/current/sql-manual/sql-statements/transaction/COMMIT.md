---
{
    "title": "COMMIT",
    "language": "ru",
    "description": "Фиксирует явную транзакцию, используется в паре с BEGIN."
}
---

## Описание {#description}

Фиксирует явную транзакцию, используется в паре с [BEGIN](./BEGIN).

## Синтаксис {#syntax}

```sql
COMMIT
```

## Примечания {#notes}

- Если явная транзакция не начата, выполнение этой команды не даст результата.

## Пример {#example}

В следующем примере создаётся таблица с именем `test`, начинается транзакция, вставляются две строки данных, фиксируется транзакция, а затем выполняется запрос.

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
INSERT INTO test VALUES(1, 'Alice', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
COMMIT;
SELECT * FROM test;
```
