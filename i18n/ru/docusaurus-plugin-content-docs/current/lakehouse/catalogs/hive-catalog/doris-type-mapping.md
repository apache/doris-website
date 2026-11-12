---
{
    "title": "Сопоставление типов данных Hive с типами Doris",
    "sidebar_label": "Сопоставление типов данных Doris",
    "description": "Справочник по сопоставлению типов Hive в Doris 4.2: типы данных, точность, вложенные и неподдерживаемые типы."
}
---

В следующей таблице показано, как Doris 4.2 (`branch-4.2`) сопоставляет типы данных в схемах внешних таблиц Hive при чтении. Запись также зависит от целевой схемы и поддерживаемых операций записи; сопоставление для чтения не задаёт автоматически обратное сопоставление для записи.

| Тип Hive      | Тип Doris     | Примечание                                     |
| ------------- | ------------- | ---------------------------------------------- |
| boolean       | boolean       |                                                |
| tinyint       | tinyint       |                                                |
| smallint      | smallint      |                                                |
| int           | int           |                                                |
| bigint        | bigint        |                                                |
| date          | date          |                                                |
| timestamp     | datetime(6)   | Сопоставляется с datetime с точностью 6         |
| float         | float         |                                                |
| double        | double        |                                                |
| decimal(P, S) | decimal(P, S) | По умолчанию decimal(9, 0), если точность не указана |
| char(N)       | char(N)       |                                                |
| varchar(N)    | varchar(N)    |                                                |
| string        | string        |                                                |
| binary | VARBINARY | Начиная с 4.1.5 этот тип всегда сопоставляется с `VARBINARY`. |
| timestamp with local time zone | TIMESTAMPTZ(6) | Начиная с 4.1.5 этот тип всегда сопоставляется с `TIMESTAMPTZ(6)`. Точность ограничена значением 6, поэтому более высокая точность теряется. |
| array         | array         |                                                |
| map           | map           |                                                |
| struct        | struct        |                                                |
| другие        | не поддерживаются |                                            |

## Примечания по использованию {#usage-notes}

Для вложенных полей сложных типов те же правила сопоставления применяются рекурсивно. `TIMESTAMPTZ` представляет момент времени, который отображается в часовом поясе сессии `time_zone`.

Hive Catalog получает схемы из строк с описанием типов в Hive Metastore. `timestamp` сопоставляется с `DATETIME(6)`; данные с наносекундной точностью в исходном файле не приводят к автоматическому изменению сопоставления на `TIMESTAMP_NS`. Типы, не указанные как поддерживаемые, в том числе `uniontype`, не поддерживаются.

Ссылка на реализацию: [HiveMetaStoreClientHelper.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/hive/HiveMetaStoreClientHelper.java) (`branch-4.2`).
