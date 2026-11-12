---
{
    "title": "Сопоставление типов данных",
    "language": "ru",
    "description": "Сопоставление типов данных для CDC в Streaming Job Doris: как типы PostgreSQL из источника сопоставляются с типами столбцов Doris при автоматическом создании таблицы и как значения преобразуются при записи в Doris."
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

В таблице ниже показано, как каждый тип столбца PostgreSQL сопоставляется с типом столбца Doris. Используется единое сопоставление для обоих методов синхронизации; различается только то, кто создаёт целевую таблицу:

- **Синхронизация с автоматическим созданием таблицы**: Doris считывает схему источника и автоматически создаёт целевую таблицу с этими типами столбцов Doris.
- **Синхронизация с сопоставлением через SQL**: вы самостоятельно создаёте целевую таблицу, используя совместимый тип Doris для каждого столбца.

В обоих случаях значения записываются согласно одному и тому же сопоставлению. Для неподдерживаемых типов см. [Ограничения](./continuous-load-overview.md#limitations).

## PostgreSQL в Doris {#postgresql-to-doris}

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
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | Точность ограничена значением 38; если scale не указан, по умолчанию используется 9 |
| `bpchar(n)` (то есть `CHAR(n)`) | `CHAR` / `VARCHAR` | Длина умножается на 3 для UTF-8; при значении `> 255` используется `VARCHAR` |
| `varchar` / `text` | `STRING` | PostgreSQL `varchar` сопоставляется с `STRING` (без указания длины) |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | Значение scale — от 0 до 6; `timestamptz` нормализуется по часовому поясу сервера |
| `time` / `timetz` / `interval` | `STRING` | `timetz` сохраняет своё смещение, нормализованное по UTC |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Строка в кодировке Base64 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| Геометрические типы (`point`, `line`, `polygon`, …) | `STRING` | Сериализуются в строку GeoJSON (`type` / `coordinates` / `srid`) |
| Типы массивов (например, `int4[]`, `text[]`) | `ARRAY<T>` | Только одномерные |
| Прочие / пользовательские типы | `STRING` | |
