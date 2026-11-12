---
{
    "title": "Сопоставление типов данных OceanBase",
    "language": "ru",
    "sidebar_label": "Сопоставление типов данных",
    "description": "Узнайте, как типы столбцов OceanBase, совместимые с MySQL, сопоставляются с типами столбцов Doris при синхронизации CDC с автоматическим созданием таблиц."
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной функцией и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

Непрерывная загрузка CDC из OceanBase поддерживает только режим совместимости с MySQL и использует путь преобразования типов MySQL. В следующей таблице показано, как типы столбцов OceanBase сопоставляются с типами столбцов Doris при автоматическом создании таблиц.

## Нормализация параметров JDBC URL {#jdbc-url-parameter-normalization}

При создании задания OceanBase Streaming Job Doris автоматически добавляет в `jdbc_url` следующие параметры, если они не заданы явно:

| Параметр | Добавляемое значение | Эффект |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | Считывает `TINYINT(1)` как `TINYINT` (`1` / `0`), а не как `BOOLEAN` (`true` / `false`). |
| `yearIsDateType` | `false` | Считывает `YEAR` как целочисленный год, а не как дату. |
| `useUnicode` | `true` | Использует кодировку Unicode. |
| `characterEncoding` | `utf-8` | Использует UTF-8 в качестве набора символов. |

Если любой из этих параметров явно задан в `jdbc_url`, Doris сохраняет настроенное значение.

## Из OceanBase в Doris {#oceanbase-to-doris}

| Тип OceanBase (режим совместимости с MySQL) | Тип Doris | Примечания |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | По умолчанию значения — `1` / `0`. Установите `tinyInt1isBit=true`, чтобы изменить поведение JDBC при чтении. |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | Считывается как целочисленный год; нулевой год (`0000`) сохраняется как `0`. |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | При очень высокой точности выполняется откат к `STRING`. |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Сохраняет микросекундную точность от 0 до 6. |
| `TIMESTAMP` | `DATETIME(s)` | Нормализуется к часовому поясу сервера. |
| `TIME` | `STRING` | Хранится как строка, например, `12:34:56.000000`. |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Строка в кодировке Base64. |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Строка в кодировке Base64. |
| `JSON` | `STRING` | Хранится как текст JSON. |
| `ENUM` | `STRING` | Преобразуется в значение метки. |
| `SET` | `STRING` | Преобразуется в список меток, разделённых запятыми. |
| Пространственные типы (`GEOMETRY`, `POINT` и другие) и прочие типы | Не поддерживается | Автоматическое создание таблицы завершается ошибкой, если таблица содержит такой столбец. Исключите столбец, не являющийся ключевым, с помощью `table.<table_name>.exclude_columns`. |

## Особенности {#considerations}

- Сопоставление типов основано на метаданных, которые OceanBase возвращает через MySQL Connector/J.
- Для неподдерживаемых типов не выполняется автоматический откат к произвольному типу Doris. Перед созданием задания для рабочей среды проверьте схему целевой таблицы.
- На `TIMESTAMP` влияют часовой пояс источника и параметр `serverTimezone` в JDBC URL. При развертывании в средах с разными часовыми поясами явно задайте и проверьте часовой пояс.
- Столбцы первичного ключа нельзя исключить с помощью `table.<table_name>.exclude_columns`.

## Связанные документы {#related-documents}

- [CDC OceanBase с автоматическим созданием таблиц](./continuous-load-oceanbase-database.md)
- [Синхронизация Schema Change в OceanBase](./schema-change-oceanbase.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
