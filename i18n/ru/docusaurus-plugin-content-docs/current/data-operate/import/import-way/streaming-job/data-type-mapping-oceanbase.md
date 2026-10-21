---
{
    "title": "Сопоставление типов данных OceanBase",
    "language": "ru",
    "sidebar_label": "Сопоставление типов данных",
    "description": "Узнайте, как типы столбцов OceanBase в режиме совместимости с MySQL сопоставляются с типами столбцов Doris при синхронизации CDC с автоматическим созданием таблиц."
}
---

<!-- Knowledge type: Reference / data type mapping -->

Непрерывная загрузка OceanBase CDC поддерживает только режим совместимости с MySQL и использует механизм преобразования типов MySQL. В следующей таблице показано, как типы столбцов OceanBase сопоставляются с типами столбцов Doris при автоматическом создании таблиц.

:::caution Экспериментальная функция

Непрерывная загрузка OceanBase CDC доступна как экспериментальная функция начиная с Doris 4.1.4.

:::

## Нормализация параметров JDBC URL {#jdbc-url-parameter-normalization}

При создании задания OceanBase Streaming Job Doris автоматически добавляет следующие параметры в `jdbc_url`, если вы не задали их явно:

| Параметр | Добавляемое значение | Действие |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | Читает `TINYINT(1)` как `TINYINT` (`1` / `0`) вместо `BOOLEAN` (`true` / `false`). |
| `yearIsDateType` | `false` | Читает `YEAR` как целочисленное значение года вместо даты. |
| `useUnicode` | `true` | Использует кодировку Unicode. |
| `characterEncoding` | `utf-8` | Использует UTF-8 в качестве набора символов. |

Если какой-либо из этих параметров явно задан в `jdbc_url`, Doris сохраняет указанное значение.

## Сопоставление типов OceanBase и Doris {#oceanbase-to-doris}

| Тип OceanBase (режим совместимости с MySQL) | Тип Doris | Примечания |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | Значения по умолчанию: `1` / `0`. Задайте `tinyInt1isBit=true`, чтобы изменить поведение при чтении через JDBC. |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | Читается как целочисленное значение года; нулевой год (`0000`) сохраняется как `0`. |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | При очень высокой точности используется `STRING`. |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Сохраняется точность дробной части секунд от 0 до 6 знаков, вплоть до микросекунд. |
| `TIMESTAMP` | `DATETIME(s)` | Приводится к часовому поясу сервера. |
| `TIME` | `STRING` | Хранится в виде строки, например `12:34:56.000000`. |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Строка в кодировке Base64. |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Строка в кодировке Base64. |
| `JSON` | `STRING` | Хранится в виде текста JSON. |
| `ENUM` | `STRING` | Преобразуется в соответствующее значение метки. |
| `SET` | `STRING` | Преобразуется в метки, разделённые запятыми. |
| Пространственные типы (`GEOMETRY`, `POINT` и другие) и прочие типы | Не поддерживаются | Автоматическое создание таблицы завершается ошибкой, если в ней есть такой столбец. Исключите неключевой столбец с помощью `table.<table_name>.exclude_columns`. |

## Особенности {#considerations}

- Сопоставление типов основано на метаданных, которые OceanBase возвращает через MySQL Connector/J.
- Неподдерживаемые типы не преобразуются автоматически в произвольный тип Doris. Перед созданием задания для рабочей среды проверьте схему целевой таблицы.
- На `TIMESTAMP` влияют часовой пояс источника и параметр JDBC URL `serverTimezone`. При развёртывании в разных часовых поясах явно задайте и проверьте часовой пояс.
- Столбцы первичного ключа нельзя исключить с помощью `table.<table_name>.exclude_columns`.

## Связанные документы {#related-documents}

- [OceanBase CDC с автоматическим созданием таблиц](./continuous-load-oceanbase-database.md)
- [Синхронизация изменений схемы OceanBase](./schema-change-oceanbase.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
