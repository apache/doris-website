---
{
    "title": "Сопоставление типов данных",
    "language": "ru",
    "description": "Соответствие типов данных Doris и Flink при чтении и записи данных с помощью Flink Doris Connector."
}
---

# Сопоставление типов данных {#data-type-mapping}

На этой странице показано соответствие типов данных Doris и Flink при чтении и записи данных с помощью Flink Doris Connector.

## Из Doris в Flink {#doris-to-flink}

| Тип Doris | Тип Flink |
| ---------- | ---------- |
| NULL_TYPE  | NULL       |
| BOOLEAN    | BOOLEAN    |
| TINYINT    | TINYINT    |
| SMALLINT   | SMALLINT   |
| INT        | INT        |
| BIGINT     | BIGINT     |
| FLOAT      | FLOAT      |
| DOUBLE     | DOUBLE     |
| DATE       | DATE       |
| DATETIME   | TIMESTAMP  |
| DECIMAL    | DECIMAL    |
| CHAR       | STRING     |
| LARGEINT   | STRING     |
| VARCHAR    | STRING     |
| STRING     | STRING     |
| DECIMALV2  | DECIMAL    |
| ARRAY      | ARRAY      |
| MAP        | STRING     |
| JSON       | STRING     |
| VARIANT    | STRING     |
| IPV4       | STRING     |
| IPV6       | STRING     |

## Из Flink в Doris {#flink-to-doris}

| Тип Flink    | Тип Doris     |
| ------------- | -------------- |
| BOOLEAN       | BOOLEAN        |
| TINYINT       | TINYINT        |
| SMALLINT      | SMALLINT       |
| INTEGER       | INTEGER        |
| BIGINT        | BIGINT         |
| FLOAT         | FLOAT          |
| DOUBLE        | DOUBLE         |
| DECIMAL       | DECIMAL        |
| CHAR          | CHAR           |
| VARCHAR       | VARCHAR/STRING |
| STRING        | STRING         |
| DATE          | DATE           |
| TIMESTAMP     | DATETIME       |
| TIMESTAMP_LTZ | DATETIME       |
| ARRAY         | ARRAY          |
| MAP           | MAP/JSON       |
| ROW           | STRUCT/JSON    |
