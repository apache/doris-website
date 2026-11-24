---
{
    "title": "Сопоставление типов данных",
    "language": "ru",
    "description": "Сопоставление типов данных для Doris Streaming Job CDC: как типы PostgreSQL в источнике сопоставляются с типами столбцов Doris при автоматическом создании таблицы и как преобразуются значения при записи в Doris."
}
---

:::caution Экспериментальная функция

Непрерывная загрузка в Doris — экспериментальная функция, поддерживаемая начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

В таблице ниже показано, как каждый тип столбца PostgreSQL в источнике сопоставляется с типом столбца Doris. Для обоих способов синхронизации используется одно и то же сопоставление. Различается только то, кто создаёт целевую таблицу:

- **Синхронизация с автоматическим созданием таблицы**: Doris считывает схему источника и автоматически создаёт целевую таблицу со столбцами указанных типов Doris.
- **Синхронизация с SQL-сопоставлением**: вы сами создаёте целевую таблицу, выбирая для каждого столбца совместимый тип Doris.

В обоих случаях значения записываются по одному и тому же правилу сопоставления. Сведения о неподдерживаемых типах см. в разделе [Ограничения](./continuous-load-overview.md#limitations).

## Сопоставление типов PostgreSQL и Doris {#postgresql-to-doris}

| Тип PostgreSQL | Тип Doris | Примечания |
| --- | --- | --- |
| `bool` / `boolean` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` / `bit varying` | `STRING` | Строка в кодировке Base64 |
| `int2` / `smallint` / `smallserial` | `SMALLINT` | |
| `int4` / `integer` / `serial` | `INT` | |
| `int8` / `bigint` / `bigserial` | `BIGINT` | |
| `float4` / `real` | `FLOAT` | |
| `float8` / `double precision` | `DOUBLE` | |
| `numeric(p,s)` / `decimal(p,s)` | `DECIMAL(p,s)` / `STRING` | При точности выше 38 сопоставляется с `STRING` |
| `bpchar(n)` (то есть `CHAR(n)`) | `CHAR` / `VARCHAR` | Длина умножается на 3 для UTF-8; если она превышает 255, используется `VARCHAR` |
| `varchar` / `text` | `STRING` | Тип PostgreSQL `varchar` сопоставляется с `STRING` (без указания длины) |
| `date` | `DATE` | |
| `timestamp` / `timestamp without time zone` / `timestamptz` / `timestamp with time zone` | `DATETIME(s)` | Точность 0–6; значения `timestamptz` приводятся к часовому поясу сервера |
| `time` / `time without time zone` / `timetz` / `time with time zone` / `interval` | `STRING` | `timetz` сохраняет смещение, нормализованное к UTC |
| `uuid` | `UUID` | |
| `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Строка в кодировке Base64 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `STRING` | Хранится как текст JSON |
| `point` | `STRING` | Сериализуется в строку GeoJSON (`type` / `coordinates` / `srid`) |
| Типы массивов | `ARRAY<T>` | Поддерживаются только одномерные массивы. Поддерживаемые типы элементов: `int2`, `int4`, `int8`, `float4`, `float8`, `numeric(p,s)`, `bool`, `bpchar`, `varchar`, `text`, `date`, `timestamp`, `timestamptz`, `json`, `jsonb`, `uuid`. Для определения размерности необходимо получить образец непустого значения из источника; `bpchar[]` сопоставляется с `ARRAY<STRING>` |
| Другие типы | Не поддерживаются | |
