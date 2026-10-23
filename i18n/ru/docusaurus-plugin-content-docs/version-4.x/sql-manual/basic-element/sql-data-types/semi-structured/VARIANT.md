---
{
    "title": "VARIANT",
    "language": "ru",
    "description": "Тип VARIANT хранит полуструктурированные данные JSON. Он может содержать различные примитивные типы (целые числа, строки, логические значения и т. д.), одномерные массивы и вложенные объекты. При записи Doris определяет структуру и тип подпутей на основе путей JSON и выполняет Subcolumnization для часто встречающихся путей, выделяя их в самостоятельные подстолбцы с колоночным хранением. Это обеспечивает и гибкость, и производительность."
}
---

## VARIANT {#variant}

## Обзор {#overview}

Тип VARIANT хранит полуструктурированные данные JSON. Он может содержать различные примитивные типы (целые числа, строки, логические значения и т. д.), одномерные массивы и вложенные объекты. При записи Doris определяет структуру и тип подпутей на основе путей JSON и выполняет Subcolumnization для часто встречающихся путей, выделяя их в самостоятельные подстолбцы с колоночным хранением. Это обеспечивает и гибкость, и производительность.

:::tip Зачем использовать VARIANT
`VARIANT` хорошо подходит для случаев, когда структура документов со временем меняется, но запросы по-прежнему обращаются в основном к небольшому набору часто используемых путей.

- Для часто используемых путей выполняется Subcolumnization, что даёт преимущества колоночного хранения, отсечения файлов и векторизованного выполнения.
- Для ключевых путей можно использовать индексы на уровне путей и полнотекстовый поиск, сохраняя преимущества отсечения по разреженным индексам Doris.
- Оптимизации для широких столбцов позволяют применять автоматическую Subcolumnization при масштабе в 10k подстолбцов. Когда число путей, участвующих в Subcolumnization, приближается к 10,000, требования к оборудованию быстро растут, поэтому обычно безопаснее начинать с режима DOC.

Если вам ещё предстоит выбрать между поведением по умолчанию, разреженными столбцами, режимом DOC и Schema Template, начните с [Руководства по выбору режима VARIANT для рабочей нагрузки](./variant-workload-guide). На этой странице приведена справочная информация о синтаксисе, правилах типов, индексах, ограничениях и настройках.
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

Имя столбца VARIANT верхнего уровня не может содержать точку (`.`), даже если оно заключено в обратные кавычки: например, `` `v.x` VARIANT `` недопустимо. Это ограничение распространяется на `CREATE TABLE` и `ALTER TABLE`; оно не ограничивает имена полей JSON внутри значения VARIANT.

В `ADD COLUMN` (включая пакетное добавление), `MODIFY COLUMN` и `RENAME COLUMN` также необходимо использовать имя столбца VARIANT верхнего уровня без точек. Например, следующая инструкция будет отклонена:

```sql
ALTER TABLE ${table_name} ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

Задайте ограничения для отдельных путей с помощью Schema Template (см. «Расширенные типы»):

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

VARIANT автоматически определяет типы подстолбцов. Поддерживаются следующие типы:

<table>
<tr><td>Поддерживаемые типы<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL (эквивалент JSON null)<br/></td></tr>
<tr><td>BigInt (64 бита)<br/>Double<br/></td></tr>
<tr><td>String (Text)<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant (вложенный объект)<br/></td></tr>
<tr><td>Array&lt;T&gt; (только одномерные массивы)<br/></td></tr>
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

Совет: типы, не входящие в стандарт JSON, например дата и время, хранятся как строки, если не задан Schema Template. Для повышения эффективности вычислений рассмотрите возможность вынести их в статические столбцы или объявить их типы через Schema Template.

## Расширенные типы (Schema Template) {#extended-types-schema-template}

Помимо примитивных типов, VARIANT поддерживает следующие расширенные типы через Schema Template:

- Числовые типы (расширенные)
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt; (T может быть любым из перечисленных выше типов; поддерживаются только одномерные массивы)

Примечание: предопределённую схему можно задать только при создании таблицы. ALTER пока не поддерживается (в будущих версиях может появиться возможность добавлять определения новых подстолбцов, но изменение типа существующего подстолбца не поддерживается).

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

`{"date": 2020-01-01}` и `{"ip": 127.0.0.1}` не являются корректными текстами JSON; правильный формат: `{"date": "2020-01-01"}` и `{"ip": "127.0.0.1"}`.

Если задан Schema Template, а значение JSON несовместимо с объявленным типом и не может быть преобразовано, оно сохраняется как NULL. Например:

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

Схема определяет только тип хранения данных. Во время выполнения запроса фактический тип зависит от обрабатываемых данных:

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

Сопоставление по шаблонам и порядок:

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

Если имя столбца содержит `*` и вы хотите сопоставлять его буквально (а не как шаблон по префиксу), используйте:

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

Для совпавших подпутей по умолчанию выполняется Subcolumnization, и они доступны как столбцы. Если совпадающих путей слишком много и они создают чрезмерное число столбцов, рассмотрите возможность включить `variant_enable_typed_paths_to_sparse` (см. «Настройка»).

## Конфликты типов и правила повышения типов {#type-conflicts-and-promotion-rules}

Если в одном и том же пути встречаются несовместимые типы (например, одно поле содержит то целое число, то строку), тип повышается до JSONB, чтобы избежать потери информации:

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```

Правила повышения типов:

| Исходный тип   | Текущий тип   | Итоговый тип |
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

Если вам нужны строго заданные типы (для стабильной работы индексов и хранения), объявите их через Schema Template.

## Индексы VARIANT {#variant-indexes}

### Выбор индексов {#choosing-indexes}

VARIANT поддерживает индексы BloomFilter и Inverted Index для подпутей.
- Для фильтров равенства/IN по данным с высокой кардинальностью предпочтителен BloomFilter (более разреженный индекс, выше производительность записи).
- Для поиска с токенизацией, по фразам или диапазонам используйте Inverted Index и задайте подходящие свойства `parser`/`analyzer`.

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```

После создания инвертированного индекса для столбца VARIANT все подпути наследуют одинаковые свойства индекса (например, парсер):

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

### Индексирование по подпути {#index-by-subpath}

В версиях 3.1.x/4.0 и более поздних можно задавать свойства индекса для отдельных подпутей VARIANT и даже настраивать для одного пути инвертированные индексы как с токенизацией, так и без неё. Для индексов отдельных путей необходимо объявить тип пути через Schema Template.

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

Индексирование путей по шаблону:

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

Примечание: в версиях 2.1.7+ поддерживаются только свойства InvertedIndex V2 (меньше файлов, ниже IOPS записи; подходит для архитектуры с разделением хранения и вычислений). В версиях 2.1.8+ удалена поддержка офлайн-операции Build Index.

Начиная с Doris 4.1.5, norms можно отключить с помощью свойства индекса или настройки BE, приведённых ниже.

Индексы с токенизацией для путей VARIANT по умолчанию записывают нормы BM25, расходуя один байт на строку для каждого пути, включая строки без значения по этому пути. Для путей, используемых только при фильтрации, отключите нормы с помощью `"norms" = "false"`. Без `field_pattern` это свойство применяется ко всем подпутям, охватываемым индексом:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

Отключение норм не влияет на фильтрацию `MATCH`, но `score()` возвращает ошибку при чтении сегмента без норм. Настройка BE `inverted_index_skip_norms_for_variant` отключает нормы для всех путей VARIANT. Подробнее см. в разделе [Длина записи и свойство norms](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property).

### Когда индексы не работают {#when-indexes-dont-work}

1. Изменение типа приводит к потере индекса: если тип подпути меняется на несовместимый (например, INT → JSONB), индекс теряется. Чтобы этого избежать, закрепите типы и индексы через Schema Template.
2. Несоответствие типа в запросе:
   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. Неверная настройка индекса: индексы применяются к подпутям, а не ко всему столбцу VARIANT.
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

## INSERT и загрузка данных {#insert-and-load}

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

### Загрузка данных (Stream Load) {#load-stream-load}

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

См. также: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

После загрузки проверьте результат с помощью `SELECT count(*)` или просмотрите выборку с помощью `SELECT * ... LIMIT 1`. Для высокой пропускной способности загрузки используйте распределение по бакетам RANDOM и включите Group Commit.

## Вывод {#output}

Текст JSON, возвращаемый при чтении столбца VARIANT, не совпадает побайтно с записанным текстом JSON: внутри объекта JSON ключи выводятся в отсортированном (лексикографическом) порядке независимо от порядка во входном JSON.

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

Сортировка применяется на каждом уровне: ключи верхнего уровня выводятся в порядке `a`, `b`, `c`, а ключи вложенного объекта в порядке `x`, `y`.

## Поддерживаемые операции и правила CAST {#supported-operations-and-cast-rules}

- VARIANT нельзя напрямую сравнивать с другими типами или использовать в операциях с ними; сравнение двух значений VARIANT также не поддерживается.
- Для сравнения, фильтрации, агрегации и сортировки приводите подпути к конкретным типам с помощью CAST (явно или неявно).

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- Само значение VARIANT нельзя напрямую использовать в ORDER BY, GROUP BY, в качестве JOIN KEY или аргумента агрегатной функции; вместо этого применяйте CAST к подпутям.
- Строки могут неявно преобразовываться в VARIANT.

| VARIANT         | Явное приведение | Неявное приведение |
| --------------- | -------- | --------- |
| `ARRAY`         | ✔        | ❌        |
| `BOOLEAN`       | ✔        | ✔         |
| `DATE/DATETIME` | ✔        | ✔         |
| `FLOAT`         | ✔        | ✔         |
| `IPV4/IPV6`     | ✔        | ✔         |
| `DECIMAL`       | ✔        | ✔         |
| `MAP`           | ❌        | ❌         |
| `TIMESTAMP`     | ✔        | ✔         |
| `VARCHAR`       | ✔        | ✔         |
| `JSON`          | ✔        | ✔         |

## Широкие столбцы {#wide-columns}

Если загружаемые данные содержат много различных ключей JSON, число подстолбцов, создаваемых при Subcolumnization, может быстро расти. При большом масштабе это приводит к разрастанию метаданных, увеличению затрат на запись и слияние, а также замедлению запросов. Для работы с «широкими столбцами» (чрезмерным числом подстолбцов) VARIANT предоставляет два механизма: **разреженные столбцы** и **кодирование DOC**.

Рекомендации по выбору режима для рабочей нагрузки приведены в [Руководстве по выбору режима VARIANT для рабочей нагрузки](./variant-workload-guide). В этом разделе описаны только сами механизмы и связанные с ними свойства.

Примечание: эти два механизма взаимоисключающие: включение кодирования DOC отключает разреженные столбцы, и наоборот.

### Разреженные столбцы {#sparse-columns}

**Принцип работы**

- Система ранжирует пути по доле значений, отличных от NULL, и степени разреженности: для часто встречающихся (менее разреженных) путей выполняется Subcolumnization, и они хранятся как самостоятельные подстолбцы; остальные, редко встречающиеся (разреженные) пути объединяются и хранятся в разреженных столбцах. Максимальное число выделенных подстолбцов задаётся свойством `variant_max_subcolumns_count`.
- Если путь объявлен в Schema Template, по умолчанию он не переносится в разреженные столбцы; задайте `variant_enable_typed_paths_to_sparse`, чтобы разрешить перенос типизированных путей в разреженные столбцы.
- Разреженные столбцы поддерживают шардирование: разреженные подпути распределяются между несколькими разреженными столбцами, что снижает затраты на чтение отдельного столбца и повышает эффективность чтения. Используйте `variant_sparse_hash_shard_count`, чтобы задать число физически хранимых разреженных столбцов.

**Примечания**

- Если у большинства ключей схожа доля значений, отличных от NULL (различия в разреженности невелики), выделить действительно разреженные пути сложно, и польза от разреженных столбцов снижается.
- Значение `variant_max_subcolumns_count` по умолчанию равно `2048`, чего уже достаточно для большинства рабочих нагрузок. Не стоит значительно увеличивать его лишь для того, чтобы заранее выделить больше подстолбцов; если рабочей нагрузке действительно требуется масштабная Subcolumnization, предпочтителен <a href="./variant-workload-guide#doc-mode-template">режим DOC</a>. При этом рекомендуемый практический верхний предел по-прежнему составляет ≤ `10000`.
- Значение `variant_sparse_hash_shard_count` можно приблизительно оценить как «число разреженных путей / 128». Например, если общее число ключей JSON ≈ 10,000 и `variant_max_subcolumns_count = 2000`, то число разреженных путей ≈ 8000, поэтому начальное значение `variant_sparse_hash_shard_count` можно выбрать около `8000/128`.

### Кодирование DOC (режим DOC) {#doc-encoding-doc-mode}

**Принцип работы**

- Для путей по-прежнему может выполняться Subcolumnization, обеспечивающая запросы по путям, а исходный JSON дополнительно сохраняется как хранимое поле для эффективного возврата всего документа JSON.
- Кодирование DOC поддерживает шардирование: исходный JSON разбивается на несколько столбцов для хранения и собирается заново при запросе всего JSON. Используйте `variant_doc_hash_shard_count`, чтобы задать число шардов DOC.
- При записи небольшими пакетами Subcolumnization можно пропустить и отложить до последующих слияний. Это регулируется свойством `variant_doc_materialization_min_rows`. Например, если `variant_doc_materialization_min_rows = 10000`, при записи менее 10,000 строк сохраняется только исходный JSON, а Subcolumnization для этого пакета не запускается.
- Для сверхшироких данных режим DOC также более стабилен, когда масштаб Subcolumnization приближается к десяти тысячам подстолбцов. По сравнению с немедленной Subcolumnization по умолчанию потребление памяти при компакции может снизиться примерно на две трети, а пропускная способность загрузки разреженных широких столбцов может увеличиться примерно в 5-10x.
- Если столбец `VARIANT` очень широкий и запросы часто читают документ целиком, режим DOC может повысить производительность `SELECT variant_col` на порядки по сравнению с восстановлением документа из множества подстолбцов.

**Примечания**

- Для режима DOC необходимо задать `variant_enable_doc_mode = true`.
- В режиме DOC типизированные пути, объявленные через Schema Template, могут иметь только числовые и строковые типы, а также типы массивов.
- Значение `variant_doc_hash_shard_count` можно приблизительно оценить как «общее число ключей JSON / 128».

Полный список свойств приведён ниже в разделе «Настройка».

## Ограничения {#limitations}

- **Оптимизация широких таблиц**: для широких таблиц с большим числом динамических подстолбцов (например, более 2000 столбцов), создаваемых типом `VARIANT`, настоятельно рекомендуется включить **Storage Format V3**, указав `"storage_format" = "V3"` в `PROPERTIES` таблицы. Это отделяет метаданные столбцов от Segment Footer, ускоряя открытие файлов и снижая расход памяти.
- Длина ключа JSON ≤ 255.
- Используйте [`PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md) и [`TRY_PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md) (поддерживаются начиная с 4.1.4) для явного преобразования строки JSON в VARIANT. Разница в том, что первая функция сообщает об ошибке при неудачном разборе, а вторая возвращает NULL.
- Нельзя использовать в качестве первичного ключа или ключа сортировки.
- Нельзя вкладывать в другие типы (например, `Array<Variant>`, `Struct<Variant>`).
- Вне режима DOC чтение всего столбца VARIANT сканирует все подпути. Для очень широких столбцов прямой запрос `SELECT variant_col` обычно не рекомендуется, если режим DOC не включён. Если в столбце много подпутей, рассмотрите возможность сохранять исходную строку JSON в дополнительном столбце STRING/JSONB для поиска по всему объекту, например с помощью `LIKE`:

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

## Настройка {#configuration}

Начиная с 3.1+, VARIANT поддерживает свойства уровня типа для столбцов:

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
<tr><td>`variant_max_subcolumns_count`</td><td>Максимальное число путей, для которых может выполняться Subcolumnization. При превышении порога новые пути могут сохраняться в общей структуре данных. По умолчанию: 2048 (рекомендуется), чего уже достаточно для большинства рабочих нагрузок. Не задавайте слишком большое значение. Если рабочей нагрузке действительно требуется очень большое число выделенных подстолбцов, предпочтителен <a href="./variant-workload-guide#doc-mode-template">режим DOC</a>. 0 означает отсутствие ограничения; не превышайте 10000.</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>По умолчанию типизированные пути всегда участвуют в Subcolumnization (и не учитываются в `variant_max_subcolumns_count`). При значении `true` типизированные пути также учитываются при проверке порога и могут переноситься в общую структуру.</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>Число шардов для разреженных столбцов. Распределяет разреженные подпути между несколькими разреженными столбцами для повышения производительности чтения. По умолчанию: 1; настраивайте в зависимости от числа разреженных подпутей.</td></tr>
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
<tr><td>`variant_enable_doc_mode`</td><td>Включает режим кодирования DOC. При значении `true` исходный JSON сохраняется как хранимое поле для быстрого возврата всего документа JSON. Режим DOC и разреженные столбцы взаимоисключающие. По умолчанию: `false`.</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>Минимальный порог числа строк для запуска Subcolumnization в режиме DOC. Если строк меньше этого значения, сохраняется только исходный JSON; после того как компакция объединит файлы и порог будет достигнут, выполняется Subcolumnization. Помогает снизить накладные расходы при записи небольшими пакетами.</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>Число шардов для кодирования DOC. Исходный JSON разбивается на указанное число столбцов для хранения и собирается заново при запросе всего JSON. По умолчанию: 64; настраивайте в зависимости от размера JSON и уровня параллелизма.</td></tr>
</table>

Поведение при достижении ограничений и рекомендации по настройке:

1. После превышения порога новые пути записываются в общую структуру; слияния Rowset также могут переносить некоторые пути обратно в общую структуру.
2. Система предпочитает сохранять в Subcolumnization пути с большей долей значений, отличных от NULL, и более высокой частотой обращений.
3. При числе путей в Subcolumnization, близком к 10,000, требуется мощное оборудование (рекомендуется ≥128G RAM и ≥32C на узел). Если рабочая нагрузка уже близка к этому диапазону, сначала рассмотрите режим DOC.
4. Настройка загрузки: увеличьте клиентский `batch_size` до подходящего значения или используйте Group Commit (при необходимости увеличьте `group_commit_interval_ms`/`group_commit_data_bytes`).
5. Если отсечение партиций не требуется, рассмотрите распределение по бакетам RANDOM и включение загрузки в один tablet, чтобы снизить усиление записи при компакции.
6. Параметры настройки BE: `max_cumu_compaction_threads` (≥8), `vertical_compaction_num_columns_per_group=500` (повышает эффективность вертикальной компакции, но увеличивает потребление памяти), `segment_cache_memory_percentage=20` (повышает эффективность кеша метаданных).
7. Следите за Compaction Score; если показатель продолжает расти, компакция не успевает за загрузкой: снизьте её интенсивность.
8. Избегайте больших запросов `SELECT *` к VARIANT; выбирайте конкретные проекции, например `SELECT v['path']`.

Примечание: если вы видите ошибку Stream Load `[DATA_QUALITY_ERROR]Reached max column size limit 2048` (только в 2.1.x и 3.0.x), это означает, что объединённая схема tablet достигла предельного числа столбцов. Можно увеличить `variant_max_merged_tablet_schema_size` (значения выше 4096 не рекомендуются; требуется мощное оборудование).

## Просмотр числа столбцов и их типов {#inspect-number-of-columns-and-types}

Способ 1: используйте `variant_type` для просмотра схемы каждой строки (точнее, но затратнее):

```sql
SELECT variant_type(v) FROM variant_tbl;
```

Способ 2: расширенный `DESC` для отображения подпутей, выделенных при Subcolumnization:

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

Используйте оба способа: способ 1 точнее, способ 2 эффективнее.

## Сравнение с типом JSON {#compared-with-json-type}

- Хранение: JSON хранится как JSONB (построчно). VARIANT использует Subcolumnization при записи (более высокая степень сжатия, меньший размер).
- Запросы: для JSON требуется разбор. VARIANT сканирует столбцы напрямую и обычно работает значительно быстрее.

ClickBench (43 запроса):
- Хранение: VARIANT экономит ~65% по сравнению с JSON.
- Запросы: VARIANT быстрее JSON в 8x+ и близок по скорости к предопределённым статическим столбцам.

**Объём хранения**

| Тип                 | Размер     |
| ------------------- | ---------- |
| Предопределённые столбцы | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**Экономия места ~65%**

| Запуск          | Предопределённые столбцы | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| Первый (холодный) | 233.79s    | 248.66s | Большинство запросов превысило время ожидания |
| Второй (прогретый) | 86.02s     | 94.82s  | 789.24s         |
| Третий (прогретый) | 83.03s     | 92.29s  | 743.69s         |

## Часто задаваемые вопросы {#faq}

1. Различаются ли `null` в VARIANT и SQL `NULL`?
   - Нет. Они эквивалентны.
2. Почему мой запрос или индекс не работает?
   - Проверьте, приводите ли вы пути к правильным типам с помощью CAST; не был ли тип повышен до JSONB из-за конфликтов; не ожидаете ли вы по ошибке, что индекс действует на весь VARIANT, а не на подпути.
3. Почему DECIMAL теряет точность при записи в столбец VARIANT?
   - При записи в столбец VARIANT тип подстолбца не определяется как DECIMAL: числовые значения сохраняются как DOUBLE, из-за чего могут теряться последние знаки дробной части. Даже объявление подпути как DECIMAL через Schema Template (например, `pm25 VARIANT<'xxx': DECIMAL(6, 2)>`) не гарантирует полного сохранения точности, поскольку при записи значение сначала разбирается как DOUBLE, а затем преобразуется в DECIMAL. Если значение JSON записывается как строка (например, `'{"num": "12.345"}'`) вместе с соответствующим объявлением DECIMAL в Schema Template (например, `DECIMAL(9, 3)`), при записи строка разбирается непосредственно в DECIMAL, сохраняя точность.
