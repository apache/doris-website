---
{
    "title": "Сопоставление типов данных",
    "language": "ru",
    "description": "Сопоставление типов данных для CDC в Doris Streaming Job: как типы исходной базы PostgreSQL сопоставляются с типами столбцов Doris при автоматическом создании таблиц и как преобразуются значения при записи в Doris."
}
---

<!-- Knowledge type: Reference / data type mapping -->

В таблице ниже показано, как каждый тип столбца в исходной базе PostgreSQL сопоставляется с типом столбца Doris. Для обоих способов синхронизации используется одно и то же сопоставление; различается лишь то, кто создаёт целевую таблицу:

- **Синхронизация с автоматическим созданием таблиц**: Doris считывает схему источника и автоматически создаёт целевую таблицу с указанными типами столбцов Doris.
- **Синхронизация с SQL-сопоставлением**: вы самостоятельно создаёте целевую таблицу, выбирая совместимый тип Doris для каждого столбца.

В обоих случаях значения записываются по одним и тем же правилам сопоставления. Сведения о неподдерживаемых типах см. в разделе [Ограничения](./continuous-load-overview.md#limitations).

## Из PostgreSQL в Doris {#postgresql-to-doris}

| Тип PostgreSQL | Тип Doris | Примечания |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | Точность ограничена 38; масштаб по умолчанию равен 9, если не указан |
| `bpchar(n)` (т. е. `CHAR(n)`) | `CHAR` / `VARCHAR` | Длина увеличивается в 3 раза для UTF-8; при `> 255` используется `VARCHAR` |
| `varchar` / `text` | `STRING` | Тип PostgreSQL `varchar` сопоставляется с `STRING` (длина не задаётся) |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | Масштаб 0–6; `timestamptz` приводится к часовому поясу сервера |
| `time` / `timetz` / `interval` | `STRING` | `timetz` сохраняет смещение, нормализованное по UTC |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Строка в кодировке Base64 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| Геометрические типы (`point`, `line`, `polygon`, …) | `STRING` | Сериализуются в строку GeoJSON (`type` / `coordinates` / `srid`) |
| Типы массивов (например, `int4[]`, `text[]`) | `ARRAY<T>` | Только одномерные |
| Прочие / пользовательские типы | `STRING` | |
