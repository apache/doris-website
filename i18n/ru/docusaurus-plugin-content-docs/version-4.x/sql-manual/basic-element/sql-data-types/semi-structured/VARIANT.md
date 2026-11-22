---
{
    "title": "VARIANT",
    "language": "ru",
    "description": "Тип VARIANT предназначен для хранения полуструктурированных данных JSON. Он может содержать различные примитивные типы (целые числа, строки, логические значения и т. д.), одномерные массивы и вложенные объекты. При записи Doris выводит структуру и типы путей подполей на основе JSON-путей и выполняет Subcolumnization для часто используемых путей, предоставляя их как независимые столбцовые подстолбцы для гибкости и производительности."
}
---

## VARIANT {#variant}

## Обзор {#overview}

Тип VARIANT предназначен для хранения полуструктурированных данных JSON. Он может содержать различные примитивные типы (целые числа, строки, логические значения и т. д.), одномерные массивы и вложенные объекты. При записи Doris выводит структуру и типы путей подполей на основе JSON-путей и выполняет Subcolumnization для часто используемых путей, предоставляя их как независимые столбцовые подстолбцы для гибкости и производительности.

:::tip Почему VARIANT
`VARIANT` хорошо подходит, когда структура документов со временем изменяется, но запросы по-прежнему сосредоточены на небольшом наборе часто используемых путей.

- Часто используемые пути участвуют в Subcolumnization, поэтому получают преимущества столбцовой производительности, отсечения файлов и векторизованного выполнения.
- Для ключевых путей можно использовать индексы уровня пути и полнотекстовый поиск, сохраняя преимущества отсечения разреженного индекса Doris.
- Оптимизации широких столбцов позволяют автоматической Subcolumnization оставаться практичной при масштабе в 10k подстолбцов. Когда количество путей, участвующих в Subcolumnization, приближается к 10 000, требования к оборудованию быстро растут, поэтому DOC mode обычно является более безопасной отправной точкой.

Если вам всё ещё нужно выбрать между поведением по умолчанию, разреженными столбцами, DOC mode и Schema Template, начните с [руководства по рабочим нагрузкам VARIANT](./variant-workload-guide). Эта страница служит справочником по синтаксису, правилам типов, индексам, ограничениям и конфигурации.
:::

## Использование VARIANT {#using-variant}

### Синтаксис создания таблицы {#create-table-syntax}

Объявите столбец VARIANT при создании таблицы:

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```

Имя столбца VARIANT верхнего уровня не может содержать точку (`.`), даже если оно заключено в обратные кавычки: например, `` `v.x` VARIANT `` является недопустимым. Это ограничение применяется к `CREATE TABLE` и `ALTER TABLE`; оно не ограничивает имена полей JSON внутри значения VARIANT.

`ADD COLUMN` (включая пакетное добавление), `MODIFY COLUMN` и `RENAME COLUMN` также должны использовать имя столбца VARIANT верхнего уровня без точек. Например, следующая инструкция отклоняется:

```sql
ALTER TABLE ${table_name} ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

Ограничьте определённые пути с помощью Schema Template (см. раздел «Расширенные типы»):

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT <
        'id' : INT,            -- restrict path id to INT
        'message*' : STRING,   -- restrict message* prefix to STRING
        'tags*' : ARRAY<TEXT>  -- restrict tags* prefix to ARRAY<TEXT>
    >
)
PROPERTIES("replication_num" = "1");
```

### Синтаксис запросов {#query-syntax}

```sql
-- Access nested fields (returns VARIANT; explicit or implicit CAST is required for aggregation/comparison)
SELECT v['properties']['title'] FROM ${table_name};

-- CAST to a concrete type before aggregation
SELECT CAST(v['properties']['title'] AS STRING) AS title
FROM ${table_name}
GROUP BY title;

-- Query arrays
SELECT *
FROM ${table_name}
WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
```

## Примитивные типы {#primitive-types}

VARIANT автоматически выводит типы подстолбцов. Поддерживаются следующие типы:

<table>
<tr><td>Поддерживаемые типы<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL (эквивалентен JSON null)<br/></td></tr>
<tr><td>BigInt (64 bit)<br/>Double<br/></td></tr>
<tr><td>String (Text)<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant (вложенный объект)<br/></td></tr>
<tr><td>Array&lt;T&gt; (только одномерный)<br/></td></tr>
</table>

Простой пример INSERT:

```sql
INSERT INTO vartab VALUES
  (1, 'null'),
  (2, NULL),
  (3, 'true'),
  (4, '-17'),
  (5, '123.12'),
  (6, '1.912'),
  (7, '"A quote"'),
  (8, '[-1, 12, false]'),
  (9, '{ "x": "abc", "y": false, "z": 10 }'),
  (10, '"2021-01-01"');
```

Совет: нестандартные типы JSON, например дата и время, сохраняются как строки, если не предоставлен Schema Template. Для повышения эффективности вычислений рассмотрите возможность извлечения их в статические столбцы или объявления их типов через Schema Template.

## Расширенные типы (Schema Template) {#extended-types-schema-template}

Помимо примитивных типов, VARIANT поддерживает следующие расширенные типы через Schema Template:

- Number (расширенный)
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt; (T может быть любым из перечисленных выше типов, только одномерный)

Примечание: предопределённую Schema можно указать только при создании таблицы. ALTER в настоящее время не поддерживается (в будущих версиях может появиться поддержка добавления новых определений подстолбцов, но изменение типа существующего подстолбца не поддерживается).

Пример:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'tz_val': TIMESTAMPTZ,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");

INSERT INTO test_var_schema VALUES (1, '{
    "large_int_val" : "123222222222222222222222",
    "string_val" : "Hello World",
    "decimal_val" : 1.11111111,
    "datetime_val" : "2025-05-16 11:11:11",
    "tz_val" : "2025-05-16 11:11:11+08:00",
    "ip_val" : "127.0.0.1"
}');

SELECT variant_type(v1) FROM test_var_schema;

+---------------------------------------------------------------------------------------------------------------------------------------------------+
| variant_type(v1)                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
| {"datetime_val":"datetimev2","decimal_val":"decimal128i","ip_val":"ipv4","large_int_val":"largeint","string_val":"string","tz_val":"timestamptz"} |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
```

`{"date": 2020-01-01}` и `{"ip": 127.0.0.1}` являются недопустимыми текстами JSON; правильный формат: `{"date": "2020-01-01"}` и `{"ip": "127.0.0.1"}`.

После указания Schema, если значение JSON конфликтует с объявленным типом и не может быть преобразовано, оно сохраняется как NULL. Например:

```sql
INSERT INTO test_var_schema VALUES (1, '{
  "decimal_val" : "1.11111111",
  "ip_val" : "127.xxxxxx.xxxx",
  "large_int_val" : "aaabbccc"
}');

-- Only decimal_val remains
SELECT * FROM test_var_schema;

+------+-----------------------------+
| id   | v1                          |
+------+-----------------------------+
|    1 | {"decimal_val":1.111111110} |
+------+-----------------------------+
```

Schema определяет только тип сохраняемого хранилища. Во время выполнения запроса эффективный тип зависит от фактических данных во время выполнения:

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

Сопоставление с подстановочными знаками и порядок:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- If enumString1 matches both patterns, the first matching pattern in definition order (STRING) is used
```

Если имя столбца содержит `*` и нужно сопоставлять его по буквальному имени (а не как префикс с подстановочным знаком), используйте:

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

Сопоставленные подпути по умолчанию участвуют в Subcolumnization и предоставляются как столбцы. Если совпадает слишком много путей и образуется чрезмерное количество столбцов, рассмотрите включение `variant_enable_typed_paths_to_sparse` (см. раздел «Конфигурация»).

## Конфликты типов и правила продвижения {#type-conflicts-and-promotion-rules}

Когда на одном пути появляются несовместимые типы (например, одно и то же поле встречается и как целое число, и как строка), тип повышается до JSONB, чтобы избежать потери информации:

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```

Правила продвижения:

| Исходный тип    | Текущий тип  | Итоговый тип   |
| -------------- | ------------- | ------------ |
| `TinyInt`      | `BigInt`      | `BigInt`     |
| `TinyInt`      | `Double`      | `Double`     |
| `TinyInt`      | `String`      | `JSONB`      |
| `TinyInt`      | `Array`       | `JSONB`      |
| `BigInt`       | `Double`      | `JSONB`      |
| `BigInt`       | `String`      | `JSONB`      |
| `BigInt`       | `Array`       | `JSONB`      |
| `Double`       | `String`      | `JSONB`      |
| `Double`       | `Array`       | `JSONB`      |
| `Array<Double>`| `Array<String>`| `Array<Jsonb>` |

Если нужны строгие типы (для стабильной индексации и хранения), объявите их через Schema Template.

## Индексы Variant {#variant-indexes}

### Выбор индексов {#choosing-indexes}

VARIANT поддерживает BloomFilter и Inverted Index для подпутей.
- Для фильтров с проверкой равенства/IN и высокой кардинальностью предпочтителен BloomFilter (более разреженный индекс и лучшая производительность записи).
- Для токенизации, поиска фраз и диапазонов используйте Inverted Index и задайте соответствующие свойства `parser`/`analyzer`.
- Для поиска ключевых слов по всему столбцу используйте [индекс значений VARIANT](../../../../table-design/index/inverted-index/variant-values-index.md) в Doris 4.2 или более поздней версии.

```sql
...
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```

При использовании обычного Inverted Index для столбца VARIANT все подпути наследуют одинаковые свойства индекса (например, parser):

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- All subpaths inherit the english parser
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```

### Индексация по подпути {#index-by-subpath}

В версиях 3.1.x/4.0 и более поздних можно задавать свойства индекса для определённых подпутей VARIANT и даже настраивать токенизированный и нетокенизированный Inverted Index для одного и того же пути. Для индексов, специфичных для пути, тип пути должен быть объявлен через Schema Template.

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content has both tokenized and non-tokenized inverted indexes
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```

Индексация путей с подстановочными знаками:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- global non-tokenized inverted index
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```

Примечание: версии 2.1.7+ поддерживают только свойства InvertedIndex V2 (меньше файлов, ниже IOPS записи; подходит для раздельных вычислений и хранения). В версиях 2.1.8+ автономная сборка индекса Build Index удалена.

Начиная с Doris 4.1.5 norms можно отключить свойством индекса или приведённой ниже конфигурацией BE.

Токенизированные индексы для путей VARIANT по умолчанию записывают norms BM25, что требует один байт на строку для каждого пути, включая строки без значения для этого пути. Для путей, используемых только фильтрацией, отключите norms с помощью `"norms" = "false"`. Без `field_pattern` это свойство применяется ко всем подпутям, охватываемым индексом:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

Отключение norms не влияет на фильтрацию `MATCH`, но `score()` возвращает ошибку при чтении сегмента без norms. Конфигурация BE `inverted_index_skip_norms_for_variant` отключает norms для всех путей VARIANT. Подробности см. в разделе [Длина записи и свойство norms](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property).

### Когда индексы не работают {#when-indexes-dont-work}

1. Изменения типа приводят к потере индекса: если тип подпути изменяется на несовместимый (например, INT → JSONB), индекс теряется. Исправьте это, зафиксировав типы и индексы через Schema Template.
2. Несоответствие типа запроса:
   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. Неправильно настроенный индекс: индексы применяются к подпутям, а не ко всему столбцу VARIANT.
   ```sql
   -- VARIANT itself cannot be indexed as a whole
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- If whole-JSON search is needed, store a duplicate STRING column and index it
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```

## INSERT и загрузка {#insert-and-load}

### INSERT INTO VALUES {#insert-into-values}

```sql
CREATE TABLE IF NOT EXISTS variant_tbl (
    k BIGINT,
    v VARIANT
) PROPERTIES("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, '{"a" : 123}');

select * from variant_tbl;
+------+-----------+
| k    | v         |
+------+-----------+
|    1 | {"a":123} |
+------+-----------+

-- v['a'] is a VARIANT
select v['a'] from variant_tbl;
+--------+
| v['a'] |
+--------+
| 123    |
+--------+

-- Accessing a non-existent key returns NULL
select v['a']['no_such_key'] from variant_tbl;;
+-----------------------+
| v['a']['no_such_key'] |
+-----------------------+
| NULL                  |
+-----------------------+

```

### Загрузка (Stream Load) {#load-stream-load}

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

См. также: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

После загрузки проверьте результат с помощью `SELECT count(*)` или выполните выборку `SELECT * ... LIMIT 1`. Для загрузки с высокой пропускной способностью предпочтительны сегментирование RANDOM и включение Group Commit.

## Вывод {#output}

Текст JSON, возвращаемый при чтении столбца VARIANT, не идентичен побайтно записанному тексту JSON: внутри объекта JSON ключи выводятся в отсортированном (лексикографическом) порядке независимо от порядка их появления во входном JSON.

```sql
INSERT INTO variant_tbl VALUES
  (2, '{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }');

SELECT v FROM variant_tbl WHERE k = 2;
+-----------------------------------+
| v                                 |
+-----------------------------------+
| {"a":1,"b":2,"c":{"x":10,"y":20}} |
+-----------------------------------+
```

Сортировка применяется на каждом уровне: ключи верхнего уровня становятся `a`, `b`, `c`, а ключи вложенного объекта — `x`, `y`.

## Поддерживаемые операции и правила CAST {#supported-operations-and-cast-rules}

- VARIANT нельзя напрямую сравнивать или обрабатывать с другими типами; сравнение двух VARIANT также не поддерживается.
- Для сравнения, фильтрации, агрегации и сортировки выполняйте CAST подпутей к конкретным типам (явно или неявно).

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- Сам VARIANT нельзя напрямую использовать в ORDER BY, GROUP BY, как JOIN KEY или как аргумент агрегатной функции; вместо этого выполняйте CAST подпутей.
- Строки могут неявно преобразовываться в VARIANT.

| VARIANT         | Castable | Coercible |
| --------------- | -------- | --------- |
| `ARRAY`         | ✔        | ❌        |
| `BOOLEAN`       | ✔        | ✔         |
| `DATE/DATETIME` | ✔        | ✔         |
| `FLOAT`         | ✔        | ✔         |
| `IPV4/IPV6`     | ✔        | ✔         |
| `DECIMAL`       | ✔        | ✔         |
| `MAP`           | ❌        | ❌        |
| `TIMESTAMP`     | ✔        | ✔         |
| `VARCHAR`       | ✔        | ✔         |
| `JSON`          | ✔        | ✔         |

## Широкие столбцы {#wide-columns}

Когда загружаемые данные содержат много различных ключей JSON, количество подстолбцов, создаваемых Subcolumnization, может быстро расти; при большом масштабе это может привести к раздуванию метаданных, повышению стоимости записи и слияния и замедлению запросов. Для решения проблемы «широких столбцов» (слишком большого количества подстолбцов) VARIANT предоставляет два механизма: **разреженные столбцы** и **DOC encoding**.

Рекомендации по выбору рабочей нагрузки см. в [руководстве по рабочим нагрузкам VARIANT](./variant-workload-guide). В этом разделе объясняются только механизмы и связанные с ними свойства.

Примечание: эти два механизма взаимоисключающие: включение DOC encoding отключает разреженные столбцы и наоборот.

### Разреженные столбцы {#sparse-columns}

**Принцип работы**

- Система ранжирует пути по доле значений, отличных от NULL, и разреженности: часто встречающиеся (менее разреженные) пути проходят Subcolumnization и сохраняются как независимые подстолбцы; оставшиеся редкие (разреженные) пути объединяются и сохраняются в разреженных столбцах. Максимальное число извлечённых подстолбцов задаётся `variant_max_subcolumns_count`.
- Если путь объявлен в Schema Template, по умолчанию он не перемещается в разреженные столбцы; задайте `variant_enable_typed_paths_to_sparse`, чтобы разрешить перемещение типизированных путей в разреженные столбцы.
- Разреженные столбцы поддерживают шардинг: распределение разреженных подпутей между несколькими разреженными столбцами уменьшает накладные расходы на чтение каждого столбца и повышает эффективность чтения. Используйте `variant_sparse_hash_shard_count`, чтобы указать количество физически сохраняемых разреженных столбцов.

**Справочные примечания**

- Если у большинства ключей похожие доли значений, отличных от NULL (небольшой контраст разреженности), трудно выявить действительно разреженные пути, и преимущество разреженных столбцов уменьшается.
- Значение `variant_max_subcolumns_count` по умолчанию равно `2048`, чего уже достаточно для большинства рабочих нагрузок. Не повышайте его агрессивно только ради предварительного выделения большего числа извлечённых подстолбцов; если рабочей нагрузке действительно нужна крупномасштабная Subcolumnization, предпочтителен <a href="./variant-workload-guide#doc-mode-template">DOC mode</a>. Практический верхний предел по-прежнему рекомендуется сохранять ≤ `10000`.
- `variant_sparse_hash_shard_count` можно приблизительно оценить как «количество разреженных путей / 128». Например: общее количество ключей JSON ≈ 10 000, `variant_max_subcolumns_count = 2000`, тогда разреженных путей ≈ 8000, поэтому `variant_sparse_hash_shard_count` можно начать со значения около `8000/128`.

### DOC encoding (DOC mode) {#doc-encoding-doc-mode}

**Принцип работы**

- Пути по-прежнему могут проходить Subcolumnization для запросов по пути, а исходный JSON дополнительно сохраняется как stored field для эффективного возврата полного JSON-документа.
- DOC encoding поддерживает шардинг: исходный JSON разбивается на несколько столбцов для хранения и собирается обратно при запросе полного JSON. Используйте `variant_doc_hash_shard_count`, чтобы указать количество DOC-сегментов.
- При записи небольшими пакетами Subcolumnization можно пропустить и отложить до последующих слияний. Это управляется параметром `variant_doc_materialization_min_rows`. Например, если `variant_doc_materialization_min_rows = 10000`, записи размером менее 10 000 строк сохраняют только исходный JSON и не запускают Subcolumnization для этого пакета.
- Для сверхшироких рабочих нагрузок DOC mode также является более стабильным выбором, когда масштаб Subcolumnization приближается к десяти тысячам подстолбцов. По сравнению с нетерпеливой Subcolumnization по умолчанию память compaction может уменьшиться примерно на две трети, а пропускная способность загрузки разреженных широких столбцов может увеличиться примерно в 5–10 раз.
- Когда столбец `VARIANT` очень широк и запросы часто читают весь документ, DOC mode может повысить производительность `SELECT variant_col` на порядки по сравнению с восстановлением документа из множества подстолбцов.

**Справочные примечания**

- DOC mode требует `variant_enable_doc_mode = true`.
- В DOC mode типизированные пути, объявленные через Schema Template, ограничены числовыми, строковыми типами и массивами.
- `variant_doc_hash_shard_count` можно приблизительно оценить как «общее количество ключей JSON / 128».

Полный список свойств см. в разделе «Конфигурация» ниже.

## Ограничения {#limitations}

- **Оптимизация широких таблиц**: для широких таблиц с большим количеством динамических подстолбцов (например, более 2000 столбцов), создаваемых типом `VARIANT`, настоятельно рекомендуется включить **Storage Format V3**, указав `"storage_format" = "V3"` в `PROPERTIES` таблицы. Это отделяет метаданные столбцов от Segment Footer, ускоряет открытие файлов и уменьшает накладные расходы памяти.
- Длина ключа JSON ≤ 255.
- Используйте [`PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md) и [`TRY_PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md) (поддерживаются начиная с 4.1.4), чтобы явно преобразовать строку JSON в VARIANT. Разница состоит в том, что первая функция сообщает об ошибке при неудачном разборе, а вторая возвращает NULL.
- Не может быть первичным ключом или ключом сортировки.
- Не может быть вложен в другие типы (например, `Array<Variant>`, `Struct<Variant>`).
- Вне DOC mode чтение всего столбца VARIANT сканирует все подпути. Для очень широких столбцов прямой `SELECT variant_col` обычно не рекомендуется, если DOC mode не включён. Если у столбца много подпутей, рассмотрите сохранение исходной строки JSON в дополнительном столбце STRING/JSONB для поиска по всему объекту с помощью `LIKE`:

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- Better: keep the original JSON string for whole-object matching
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

## Конфигурация {#configuration}

Начиная с 3.1+, VARIANT поддерживает свойства на уровне типа для столбцов:

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true',
          'variant_sparse_hash_shard_count' = '64'
      )
  >
);
```

<table>
<tr><td>Свойство</td><td>Описание</td></tr>
<tr><td>`variant_max_subcolumns_count`</td><td>Максимальное число путей, которые могут проходить Subcolumnization. Выше порога новые пути могут сохраняться в общей структуре данных. Значение по умолчанию: 2048 (рекомендуется), чего уже достаточно для большинства рабочих нагрузок. Не задавайте слишком большое значение. Если рабочей нагрузке действительно нужен очень большой масштаб извлечённых подстолбцов, предпочтителен <a href="./variant-workload-guide#doc-mode-template">DOC mode</a>. 0 означает отсутствие ограничения; не превышайте 10000.</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>По умолчанию типизированные пути всегда участвуют в Subcolumnization (и не учитываются в `variant_max_subcolumns_count`). При значении `true` типизированные пути также учитываются в пороге и могут быть перемещены в общую структуру.</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>Количество сегментов для разреженных столбцов. Распределяет разреженные подпути между несколькими разреженными столбцами, чтобы повысить производительность чтения. Значение по умолчанию: 1; настраивайте с учётом количества разреженных подпутей.</td></tr>
</table>

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_enable_doc_mode' = 'true',
          'variant_doc_materialization_min_rows' = '10000',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```

<table>
<tr><td>Свойство</td><td>Описание</td></tr>
<tr><td>`variant_enable_doc_mode`</td><td>Включает режим DOC encoding. При значении `true` исходный JSON сохраняется как stored field для быстрого возврата всего JSON-документа. DOC mode взаимоисключающ с разреженными столбцами. Значение по умолчанию: `false`.</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>Минимальный порог строк для запуска Subcolumnization в DOC mode. Если количество строк меньше этого значения, сохраняется только исходный JSON; после того как compaction объединит файлы и достигнет порога, выполняется Subcolumnization. Это помогает уменьшить накладные расходы при записи небольшими пакетами.</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>Количество сегментов для DOC encoding. Исходный JSON разбивается на указанное количество столбцов для хранения и собирается обратно при запросе всего JSON. Значение по умолчанию: 64; настраивайте с учётом размера JSON и параллелизма.</td></tr>
</table>

Поведение при достижении ограничений и рекомендации по настройке:

1. После превышения порога новые пути записываются в общую структуру; слияния Rowset также могут переместить некоторые пути в общую структуру.
2. Система предпочитает сохранять в Subcolumnization пути с большей долей значений, отличных от NULL, и большей частотой доступа.
3. При приближении к 10 000 путей в Subcolumnization требуется мощное оборудование (рекомендуется ≥128G RAM и ≥32C на узел). Если рабочая нагрузка уже близка к этому диапазону, сначала оцените DOC mode.
4. Настройка загрузки: соответствующим образом увеличьте клиентский `batch_size` или используйте Group Commit (при необходимости увеличьте `group_commit_interval_ms`/`group_commit_data_bytes`).
5. Если отсечение по партициям не требуется, рассмотрите сегментирование RANDOM и включение загрузки в один tablet для уменьшения усиления записи при compaction.
6. Параметры настройки BE: `max_cumu_compaction_threads` (≥8), `vertical_compaction_num_columns_per_group=500` (улучшает вертикальный compaction, но увеличивает использование памяти), `segment_cache_memory_percentage=20` (улучшает эффективность кэша метаданных).
7. Следите за Compaction Score; если он продолжает расти, compaction не успевает — уменьшите нагрузку записи.
8. Избегайте больших `SELECT *` для VARIANT; предпочитайте конкретные проекции, например `SELECT v['path']`.

Примечание: если вы видите ошибку Stream Load `[DATA_QUALITY_ERROR]Reached max column size limit 2048` (только в версиях 2.1.x и 3.0.x), это означает, что объединённая схема tablet достигла ограничения по столбцам. Можно увеличить `variant_max_merged_tablet_schema_size` (не рекомендуется выше 4096; требуется мощное оборудование).

## Проверка количества столбцов и типов {#inspect-number-of-columns-and-types}

Способ 1: используйте `variant_type` для проверки схемы каждой строки (точнее, но дороже):

```sql
SELECT variant_type(v) FROM variant_tbl;
```

Способ 2: расширенный `DESC` для отображения подпутей, извлечённых через Subcolumnization:

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

Используйте оба способа: способ 1 точнее, способ 2 эффективнее.

## Сравнение с типом JSON {#compared-with-json-type}

- Хранение: JSON сохраняется как JSONB (ориентированное на строки). VARIANT выполняет Subcolumnization при записи (выше сжатие, меньше размер).
- Запросы: JSON требует разбора. VARIANT сканирует столбцы напрямую и обычно работает значительно быстрее.

ClickBench (43 запроса):
- Хранение: VARIANT экономит около 65% пространства по сравнению с JSON.
- Запросы: VARIANT более чем в 8 раз быстрее JSON и близок к заранее определённым статическим столбцам.

**Объём хранилища**

| Тип                | Размер       |
| ------------------- | ---------- |
| Предопределённые столбцы  | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**Экономия пространства около 65%**

| Запуск             | Предопределённые | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| Первый (холодный)    | 233.79s    | 248.66s | Большинство завершились по тайм-ауту  |
| Второй (горячий)    | 86.02s     | 94.82s  | 789.24s         |
| Третий (горячий)     | 83.03s     | 92.29s  | 743.69s         |

## FAQ {#faq}

1. Отличаются ли `null` в VARIANT и SQL `NULL`?
   - Нет. Они эквивалентны.
2. Почему мой запрос или индекс не работает?
   - Проверьте, выполняется ли CAST путей к правильным типам; не был ли тип повышен до JSONB из-за конфликтов; и не ожидаете ли вы ошибочно индекс для всего VARIANT вместо индекса для подпутей.
3. Почему DECIMAL теряет точность при записи в столбец VARIANT?
   - При записи в столбец VARIANT тип подстолбца не выводится как DECIMAL — числовые значения сохраняются как DOUBLE, что может привести к потере конечных десятичных знаков. Даже объявление подпути как DECIMAL через Schema Template (например, `pm25 VARIANT<'xxx': DECIMAL(6, 2)>`) не гарантирует точность полностью, поскольку значение сначала разбирается как DOUBLE, а затем преобразуется в DECIMAL на пути записи. Если значение JSON записано как строка (например, `'{"num": "12.345"}'`) вместе с соответствующим объявлением DECIMAL в Schema Template (например, `DECIMAL(9, 3)`), строка при записи разбирается непосредственно в DECIMAL, что сохраняет точность.
