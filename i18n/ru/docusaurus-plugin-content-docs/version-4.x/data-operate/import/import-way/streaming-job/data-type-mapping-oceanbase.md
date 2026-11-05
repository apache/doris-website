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

Непрерывная загрузка CDC из OceanBase поддерживает только режим совместимости с MySQL и использует путь преобразования типов MySQL. В таблице ниже показано, как типы столбцов OceanBase сопоставляются с типами столбцов Doris при автоматическом создании таблиц.

## Нормализация параметров JDBC URL {#jdbc-url-parameter-normalization}

При создании OceanBase Streaming Job Doris автоматически добавляет следующие параметры в `jdbc_url`, если они не заданы явно:

| Параметр | Добавляемое значение | Действие |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | Считывает `TINYINT(1)` как `TINYINT` (`1` / `0`), а не как `BOOLEAN` (`true` / `false`). |
| `yearIsDateType` | `false` | Считывает `YEAR` как целочисленный год, а не как дату. |
| `useUnicode` | `true` | Использует кодировку Unicode. |
| `characterEncoding` | `utf-8` | Использует UTF-8 в качестве набора символов. |

Если какой-либо из этих параметров явно задан в `jdbc_url`, Doris сохраняет настроенное значение.

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
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | При очень высокой точности выполняется переход к `STRING`. |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Сохраняется микросекундный масштаб от 0 до 6. |
| `TIMESTAMP` | `DATETIME(s)` | Приводится к часовому поясу сервера. |
| `TIME` | `STRING` | Хранится как строка, например `12:34:56.000000`. |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Строка в кодировке Base64. |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Строка в кодировке Base64. |
| `JSON` | `STRING` | Хранится как текст JSON. |
| `ENUM` | `STRING` | Преобразуется в значение метки. |
| `SET` | `STRING` | Преобразуется в строку с метками, разделёнными запятыми. |
| Пространственные типы (`GEOMETRY`, `POINT` и другие) и прочие типы | Не поддерживается | Автоматическое создание таблицы завершается ошибкой, если таблица содержит такой столбец. Исключите столбец, не являющийся ключевым, с помощью `table.<table_name>.exclude_columns`. |

## Примечания {#considerations}

- Сопоставление типов основано на метаданных, возвращаемых OceanBase через MySQL Connector/J.
- Неподдерживаемые типы не преобразуются автоматически в произвольный тип Doris. Перед созданием рабочего задания проверьте схему целевой таблицы.
- На `TIMESTAMP` влияют часовой пояс источника и параметр `serverTimezone` в JDBC URL. При развертывании в разных часовых поясах явно задайте часовой пояс и проверьте его.
- Столбцы первичного ключа нельзя исключить с помощью `table.<table_name>.exclude_columns`.

## Связанные документы {#related-documents}

- [CDC OceanBase с автоматическим созданием таблиц](./continuous-load-oceanbase-database.md)
- [Синхронизация Schema Change в OceanBase](./schema-change-oceanbase.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
