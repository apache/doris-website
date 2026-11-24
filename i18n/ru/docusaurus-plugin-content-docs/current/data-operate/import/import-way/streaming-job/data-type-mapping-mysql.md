---
{
    "title": "Сопоставление типов данных",
    "language": "ru",
    "description": "Сопоставление типов данных для Doris Streaming Job CDC: как типы столбцов исходной базы MySQL сопоставляются с типами столбцов Doris при автоматическом создании таблицы и как преобразуются значения при записи в Doris."
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris — экспериментальная функция, поддерживаемая начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

В таблице ниже показано, как каждый тип столбца исходной базы MySQL сопоставляется с типом столбца Doris. Для обоих способов синхронизации используется одно и то же сопоставление. Различается только то, кто создаёт целевую таблицу:

- **Синхронизация с автоматическим созданием таблицы**: Doris считывает схему исходной таблицы и автоматически создаёт целевую таблицу с указанными типами столбцов Doris.
- **Синхронизация с SQL-сопоставлением**: вы создаёте целевую таблицу самостоятельно, выбирая совместимый тип Doris для каждого столбца.

В обоих случаях значения записываются по одним и тем же правилам сопоставления. О неподдерживаемых типах см. в разделе [Ограничения](./continuous-load-overview.md#limitations).

## Нормализация параметров JDBC URL {#jdbc-url-parameter-normalization}

При создании Streaming Job с источником данных MySQL (или использовании табличной функции `cdc_stream()`) Doris автоматически добавляет в `jdbc_url` следующие параметры, если вы не задали их явно:

| Параметр | Добавляемое значение | Результат |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` считывается как `TINYINT` (`1` / `0`), а не как `BOOLEAN` (`true` / `false`) |
| `yearIsDateType` | `false` | `YEAR` считывается как целое число, обозначающее год, а не как дата |
| `useUnicode` | `true` | Используется кодировка Unicode |
| `characterEncoding` | `utf-8` | В качестве набора символов используется UTF-8 |

Если любой из этих параметров явно задан в `jdbc_url`, Doris сохраняет указанное вами значение и не переопределяет его. `jdbc_url` для PostgreSQL не нормализуется.

:::caution Влияние обновления

Чтобы считывать `TINYINT(1)` как `BOOLEAN` или `YEAR` как дату, явно задайте соответственно `tinyInt1isBit=true` или `yearIsDateType=true` в `jdbc_url`.

:::

## Сопоставление типов MySQL и Doris {#mysql-to-doris}

| Тип MySQL | Тип Doris | Примечания |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | Сопоставляется с `TINYINT` (значения `1` / `0`). Причина описана в разделе [Нормализация параметров JDBC URL](#jdbc-url-parameter-normalization) |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | Значение считывается как целое число, обозначающее год, а не как дата; нулевой год MySQL (`0000`) сохраняется как `0` |
| `FLOAT` / `FLOAT UNSIGNED` | `FLOAT` | |
| `DOUBLE` / `DOUBLE UNSIGNED` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` / `STRING` | При точности выше 38 сопоставляется с `STRING` |
| `DECIMAL(p,s) UNSIGNED` | `DECIMAL(p+1,s)` / `STRING` | Точность увеличивается на 1; при точности выше 38 сопоставляется с `STRING` |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Сохраняется точность до микросекунд (0–6) |
| `TIMESTAMP` | `DATETIME(s)` | Приводится к часовому поясу сервера |
| `TIME` | `STRING` | Сериализуется в строку, например `12:34:56.000000` |
| `CHAR(n)` | `CHAR` / `VARCHAR` | Длина умножается на 3 для UTF-8; при значении выше 255 используется `VARCHAR` |
| `VARCHAR(n)` | `VARCHAR` / `STRING` | Длина умножается на 3 для UTF-8; при значении выше 65533 используется `STRING` |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Строка в кодировке Base64 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Строка в кодировке Base64 |
| `JSON` | `STRING` | Хранится как текст JSON |
| `ENUM` | `STRING` | Преобразуется в значение метки |
| `SET` | `STRING` | Преобразуется в метки, разделённые запятыми |
| Пространственные типы (`GEOMETRY`, `POINT`, …) и другие типы | Не поддерживаются | |
