---
{
    "title": "Сопоставление типов данных OceanBase",
    "language": "ru",
    "sidebar_label": "Сопоставление типов данных",
    "description": "Узнайте, как типы столбцов OceanBase в режиме совместимости с MySQL сопоставляются с типами столбцов Doris при синхронизации CDC с автоматическим созданием таблиц."
}
---

:::caution Экспериментальная функция

Непрерывная загрузка в Doris — экспериментальная функция, поддерживаемая начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

Непрерывная загрузка через OceanBase CDC поддерживает только режим совместимости с MySQL и использует тот же механизм преобразования типов, что и MySQL. В следующей таблице показано, как типы столбцов OceanBase сопоставляются с типами столбцов Doris при автоматическом создании таблиц.

## Нормализация параметров JDBC URL {#jdbc-url-parameter-normalization}

При создании OceanBase Streaming Job Doris автоматически добавляет следующие параметры к `jdbc_url`, если они не заданы явно:

| Параметр | Добавляемое значение | Действие |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | Считывает `TINYINT(1)` как `TINYINT` (`1` / `0`), а не как `BOOLEAN` (`true` / `false`). |
| `yearIsDateType` | `false` | Считывает `YEAR` как целое число, обозначающее год, а не как дату. |
| `useUnicode` | `true` | Использует кодировку Unicode. |
| `characterEncoding` | `utf-8` | Использует UTF-8 в качестве набора символов. |

Если какой-либо из этих параметров явно задан в `jdbc_url`, Doris сохраняет указанное значение.

## Сопоставление типов OceanBase и Doris {#oceanbase-to-doris}

| Тип OceanBase (режим совместимости с MySQL) | Тип Doris | Примечания |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | По умолчанию значения представлены как `1` / `0`. Чтобы изменить поведение JDBC при чтении, задайте `tinyInt1isBit=true`. |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | Считывается как целое число, обозначающее год; нулевой год (`0000`) сохраняется как `0`. |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` / `STRING` | При точности выше 38 сопоставляется с `STRING` |
| `DECIMAL(p,s) UNSIGNED` | `DECIMAL(p+1,s)` / `STRING` | Точность увеличивается на 1; при точности выше 38 сопоставляется с `STRING` |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Сохраняет точность до микросекунд со значением от 0 до 6. |
| `TIMESTAMP` | `DATETIME(s)` | Приводится к часовому поясу сервера. |
| `TIME` | `STRING` | Хранится в виде строки, например `12:34:56.000000`. |
| `CHAR(n)` | `CHAR` / `VARCHAR` | Длина увеличивается в 3 раза для UTF-8; при значении выше 255 используется `VARCHAR` |
| `VARCHAR(n)` | `VARCHAR` / `STRING` | Длина увеличивается в 3 раза для UTF-8; при значении выше 65533 используется `STRING` |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Строка в кодировке Base64. |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Строка в кодировке Base64. |
| `JSON` | `STRING` | Хранится в виде текста JSON. |
| `ENUM` | `STRING` | Преобразуется в значение метки. |
| `SET` | `STRING` | Преобразуется в метки, разделённые запятыми. |
| Пространственные типы (`GEOMETRY`, `POINT` и другие) и прочие типы | Не поддерживаются | Автоматическое создание таблицы завершится ошибкой, если она содержит столбец такого типа. Столбец, не входящий в ключ, можно исключить с помощью `table.<table_name>.exclude_columns`. |

## Что следует учитывать {#considerations}

- Сопоставление типов основано на метаданных, которые OceanBase возвращает через MySQL Connector/J.
- Неподдерживаемые типы не заменяются произвольным типом Doris. Перед созданием задания для рабочей среды проверьте схему целевой таблицы.
- На `TIMESTAMP` влияют часовой пояс источника и параметр JDBC URL `serverTimezone`. При развёртывании в разных часовых поясах явно задайте часовой пояс и проверьте его.
- Столбцы первичного ключа нельзя исключить с помощью `table.<table_name>.exclude_columns`.

## Связанные документы {#related-documents}

- [OceanBase CDC с автоматическим созданием таблиц](./continuous-load-oceanbase-database.md)
- [Синхронизация изменений схемы OceanBase](./schema-change-oceanbase.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
