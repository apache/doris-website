---
{
    "title": "Сопоставление типов данных",
    "language": "ru",
    "description": "Сопоставление типов данных для Doris Streaming Job CDC: как типы MySQL из источника сопоставляются с типами столбцов Doris при автоматическом создании таблиц и как значения преобразуются при записи в Doris."
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной функцией и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

В таблице ниже показано, как каждый тип столбца MySQL в источнике сопоставляется с типом столбца Doris. Для обоих методов синхронизации используется одно сопоставление — различается только то, кто создаёт целевую таблицу:

- **Auto Table Creation Sync**: Doris читает схему источника и автоматически создаёт целевую таблицу с указанными типами столбцов Doris.
- **SQL Mapping Sync**: целевую таблицу вы создаёте самостоятельно, используя совместимый тип Doris для каждого столбца.

В обоих случаях значения записываются в соответствии с этим сопоставлением. Для неподдерживаемых типов см. [Ограничения](./continuous-load-overview.md#limitations).

## Нормализация параметров JDBC URL {#jdbc-url-parameter-normalization}

При создании Streaming Job с источником данных MySQL (или при использовании табличной функции `cdc_stream()`) Doris автоматически добавляет в `jdbc_url` следующие параметры, если они не заданы явно:

| Параметр | Подставляемое значение | Эффект |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` читается как `TINYINT` (`1` / `0`), а не как `BOOLEAN` (`true` / `false`) |
| `yearIsDateType` | `false` | `YEAR` читается как целочисленный год, а не как дата |
| `useUnicode` | `true` | Используется кодировка Unicode |
| `characterEncoding` | `utf-8` | Используется UTF-8 в качестве набора символов |

Если какой-либо из этих параметров явно задан в `jdbc_url`, Doris сохраняет указанное значение и не переопределяет его. Нормализация `jdbc_url` для PostgreSQL не выполняется.

:::caution Влияние обновления

Чтобы читать `TINYINT(1)` как `BOOLEAN`, а `YEAR` — как дату, явно задайте `tinyInt1isBit=true` или `yearIsDateType=true` соответственно в `jdbc_url`.

:::

## MySQL в Doris {#mysql-to-doris}

| Тип MySQL | Тип Doris | Примечания |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | Сопоставляется с `TINYINT` (значения `1` / `0`). Причину см. в разделе [Нормализация параметров JDBC URL](#jdbc-url-parameter-normalization) |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | Значение читается как целочисленный год, а не как дата; нулевой год MySQL (`0000`) сохраняется как `0` |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | При очень высокой точности тип заменяется на `STRING` |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Сохраняется микросекундная точность (0–6) |
| `TIMESTAMP` | `DATETIME(s)` | Нормализуется по часовому поясу сервера |
| `TIME` | `STRING` | Сериализуется в строку, например `12:34:56.000000` |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Строка в кодировке Base64 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Строка в кодировке Base64 |
| `JSON` | `STRING` | Хранится как текст JSON |
| `ENUM` | `STRING` | Преобразуется в значение метки |
| `SET` | `STRING` | Преобразуется в метки, разделённые запятыми |
| Пространственные типы (`GEOMETRY`, `POINT`, …) и другие типы | Не поддерживается | Auto Table Creation завершается ошибкой для таблиц с такими столбцами; используйте SQL Mapping Sync (выполните преобразование в `SELECT`) или исключите столбец |
