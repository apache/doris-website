---
{
    "title": "Функция SEARCH",
    "language": "ru",
    "description": "Функция SEARCH — единая точка входа в полнотекстовый поиск, предоставляемая Apache Doris 4.0. Она описывает условия запроса с помощью краткого выражения DSL и эффективно выполняет поиск термов, фраз, логических комбинаций, подстановочных символов и регулярных выражений на основе инвертированного индекса."
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

Функция `SEARCH` — единая точка входа в полнотекстовый поиск, предоставляемая Apache Doris начиная с версии 4.0. Она описывает условия запроса с помощью краткого DSL (предметно-ориентированного языка) и эффективно выполняет их на основе инвертированного индекса.

`SEARCH` — предикатная функция, возвращающая логическое значение. Она может использоваться как условие фильтрации в предложении `WHERE`. Функция принимает строку SEARCH DSL, описывающую правила сопоставления текста, и передаёт сопоставимые условия для выполнения в инвертированный индекс.

**Типичные сценарии использования:**

- Выполнение поиска термов, фраз и логических комбинаций в текстовых полях
- Выполнение объединённого поиска по нескольким столбцам
- Использование подстановочных символов или регулярных выражений для сопоставления с шаблоном
- Выполнение структурированного текстового поиска по подстолбцам VARIANT
- Поддержание совместимости со стилем синтаксиса query_string Lucene/Elasticsearch

## Синтаксис {#syntax}

### Основные формы вызова {#basic-invocation-forms}

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**Описание параметров:**

| Параметр | Обязателен | Описание |
| --- | --- | --- |
| `<search_expression>` | Да | Выражение запроса SEARCH DSL (строковый литерал) |
| `<default_field>` | Нет | Имя столбца, автоматически применяемое, если термы в DSL явно не указывают поле |
| `<default_operator>` | Нет | Логический оператор по умолчанию для выражений с несколькими термами. Принимаются только `and` или `or` (без учёта регистра). Значение по умолчанию — `or` |

**Примечания по использованию:**

- **Позиция:** используется в предложении `WHERE` как предикат, участвующий в фильтрации строк
- **Тип возвращаемого значения:** BOOLEAN, допускающий значения только TRUE или FALSE (TRUE при совпадении, FALSE в противном случае)

Если указан `default_field`, Doris автоматически подставляет это поле для простых термов или функций. Например:

- `SEARCH('foo bar', 'tags', 'and')` эквивалентно `SEARCH('tags:ALL(foo bar)')`
- `SEARCH('foo bar', 'tags')` разворачивается в `tags:ANY(foo bar)`

Явно указанные в DSL логические операции имеют наивысший приоритет и переопределяют оператор по умолчанию.

### Параметр options (формат JSON) {#options-parameter-json-format}

Второй параметр также может быть строкой JSON для расширенной настройки:

```sql
SEARCH('<search_expression>', '<options_json>')
```

**Поддерживаемые параметры:**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `default_field` | string | Имя столбца по умолчанию для термов без явно указанного поля |
| `default_operator` | string | Оператор по умолчанию для выражений с несколькими термами (`and` или `or`) |
| `mode` | string | `standard` (по умолчанию) или `lucene` |
| `minimum_should_match` | integer | Минимальное число совпадений предложений SHOULD (только режим Lucene) |
| `fields` | array of strings | Необязательные целевые столбцы для термов без явно указанных полей; взаимоисключается с непустым `default_field` |
| `type` | string | Необязательное разворачивание по нескольким полям: `best_fields` (по умолчанию) или `cross_fields`; не выбирает алгоритм оценки или сортировки |

**Пример:**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL и двузначное сопоставление {#null-and-three-valued-logic}

**Версия:** приведённые ниже правила двузначного сопоставления, примеры с NULL/NOT и поведение ошибки индекса VARIANT применяются начиная с Doris 4.2.

`SEARCH` возвращает BOOLEAN без значения NULL: TRUE при совпадении и FALSE при несовпадении. Обычный терм не сопоставляется со значением NULL или с путём VARIANT, отсутствие которого подтверждено данными хранения. SEARCH не распространяет UNKNOWN.

В стандартном режиме `AND` пересекает множества совпадений, `OR` объединяет их, а `NOT` берёт дополнение относительно строк, видимых запросу. Поэтому и `SEARCH('NOT a:hit')`, и `NOT SEARCH('a:hit')` включают строки с NULL. Режим Lucene использует то же правило для NULL и несовпадений, сохраняя собственные правила разбора логических выражений, описанные ниже. Вычисление `score()` или использование кэша запросов не меняет полный набор совпадений; сортировка и LIMIT могут изменить возвращаемые строки.

Обычные SQL-сравнения и операторы `MATCH` сохраняют трёхзначную логику SQL. Для входного значения NULL выражения `a != 'hit'` и `NOT (a MATCH_ANY 'hit')` дают UNKNOWN и отбрасываются предложением `WHERE`. Внешнее SQL-выражение по-прежнему может дать UNKNOWN из-за других допускающих NULL операндов.

#### Пример: NULL и NOT {#example-null-and-not}

Выполните примеры в базе данных, где у вас есть привилегии CREATE, INSERT и SELECT. Один бакет и одна реплика ниже используются для небольшой демонстрационной таблицы.

```sql
CREATE TABLE search_null_demo (
    id INT,
    a VARCHAR(16) NULL,
    INDEX idx_a(a) USING INVERTED PROPERTIES("parser"="unicode")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO search_null_demo VALUES (1, 'hit'), (2, 'miss'), (3, NULL);
```

```sql
SELECT id FROM search_null_demo WHERE SEARCH('a:hit') ORDER BY id;
```

```text
id
1
```

```sql
SELECT id FROM search_null_demo WHERE SEARCH('NOT a:hit') ORDER BY id;
```

```text
id
2
3
```

```sql
SELECT id FROM search_null_demo WHERE NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
3
```

Чтобы также исключить строки с NULL, добавьте явный фильтр `IS NOT NULL`:

```sql
SELECT id FROM search_null_demo
WHERE a IS NOT NULL AND NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
```

Для этих трёх строк условие SQL `a != 'hit'` и условие текстового поиска `NOT (a MATCH_ANY 'hit')` также возвращают только id 2.

#### VARIANT: NULL, отсутствующие пути и недоступные индексы {#variant-null-missing-paths-and-unavailable-indexes}

Обычный терм VARIANT, например `v.a:hit`, подчиняется тому же правилу:

| Значение, записанное в `v` | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}` (путь `a` отсутствует) | FALSE | TRUE |
| SQL NULL (весь столбец VARIANT имеет значение NULL) | FALSE | TRUE |

Для объектов, хранящихся вне массивов, элементы JSON со значением `null` удаляются, поэтому чтение такого пути возвращает SQL NULL, как и для отсутствующего элемента. Это отличается от значения JSON `null`, вычисленного внутри выражения; см. [семантику NULL в VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#null-semantics).

Используйте `parse_to_variant` для вставки объектов JSON. В следующей таблице режим документов отключён, поэтому в примере используются материализованные подпути с исполняемыми индексами.

```sql
CREATE TABLE search_variant_null_demo (
    id INT,
    v VARIANT<PROPERTIES("variant_enable_doc_mode"="false")>,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser"="unicode")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO search_variant_null_demo VALUES
    (1, parse_to_variant('{"a":"hit"}')),
    (2, parse_to_variant('{"a":"miss"}')),
    (3, parse_to_variant('{"a":null}')),
    (4, parse_to_variant('{}')),
    (5, NULL);
```

```sql
SELECT id FROM search_variant_null_demo WHERE SEARCH('v.a:hit') ORDER BY id;
```

```text
id
1
```

```sql
SELECT id FROM search_variant_null_demo WHERE SEARCH('NOT v.a:hit') ORDER BY id;
```

```text
id
2
3
4
5
```

`NOT SEARCH('v.a:hit')` возвращает те же идентификаторы. Если путь отсутствует во всех строках, `SEARCH('v.absent:hit')` не возвращает строк, а `SEARCH('NOT v.absent:hit')` возвращает все пять строк. Чтобы оставить только строки с ненулевым значением целевого пути, добавьте за пределами SEARCH условие `v['a'] IS NOT NULL`.

**Отсутствующий путь и недоступный индекс — разные состояния.** Если путь содержит данные, но требуемый инвертированный индекс нельзя выполнить, SEARCH сообщает об ошибке `SEARCH index unavailable for Variant field 'v.a'`, в том числе для отрицательных запросов. Примеры включают исторические rowset, для которых после CREATE INDEX индекс ещё не построен, или путь, сохранённый только в хранилище документов без исполняемого листового индекса. SEARCH не считает такие состояния пустым множеством совпадений и автоматически не переходит к сканированию. Убедитесь, что требуемый индекс пути доступен для всех запрашиваемых данных, либо извлеките путь и выполните запрос с помощью обычного SQL.

## Использование SEARCH по сценариям {#using-search-by-scenario}

### Сценарий 1: Сопоставление одного терма {#scenario-1-single-term-match}

**Сценарий использования:** поиск документов, содержащих определённый терм в поле.

- **Синтаксис:** `column:term`
- **Семантика:** сопоставление терма с токенизированным результатом столбца. Регистрозависимость зависит от свойства индекса `lower_case`
- **Рекомендация по индексу:** создайте для столбца инвертированный индекс с подходящими `parser`/`analyzer`

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### Сценарий 2: OR-сопоставление нескольких термов (ANY) {#scenario-2-multi-term-or-match-any}

**Сценарий использования:** совпадение происходит, если найден любой терм из списка кандидатов, например при сопоставлении тегов или объединённом поиске ключевых слов.

- **Синтаксис:** `column:ANY(term1 term2 ...)`
- **Семантика:** токенизированный результат столбца содержит любой терм из списка (семантика OR). Порядок не имеет значения, повторяющиеся термы игнорируются
- **Рекомендация по индексу:** создайте для столбца токенизированный инвертированный индекс (например, `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### Сценарий 3: AND-сопоставление нескольких термов (ALL) {#scenario-3-multi-term-and-match-all}

**Сценарий использования:** должны быть найдены все термы, например при строгой фильтрации по теме.

- **Синтаксис:** `column:ALL(term1 term2 ...)`
- **Семантика:** токенизированный результат столбца одновременно содержит все термы из списка (семантика AND). Порядок не имеет значения, повторяющиеся термы игнорируются
- **Рекомендация по индексу:** создайте для столбца токенизированный инвертированный индекс (например, `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### Сценарий 4: Запрос с логической комбинацией {#scenario-4-boolean-combination-query}

**Сценарий использования:** несколько условий нужно объединить с помощью AND/OR/NOT, например «должно содержаться A и не должно содержаться B».

- **Синтаксис:** `(expr) AND/OR/NOT (expr)`
- **Семантика:** объединение подвыражений внутри SEARCH с помощью `AND`, `OR` и `NOT`
- **Рекомендация по индексу:** по возможности размещайте сопоставимые условия внутри SEARCH для проталкивания в индекс. Для дополнительной фильтрации используйте другие условия WHERE

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### Сценарий 5: Сложные вложенные выражения {#scenario-5-complex-nested-expressions}

**Сценарий использования:** использование скобок для управления приоритетом логических операций и построения многоуровневых вложенных условий фильтрации.

- **Синтаксис:** используйте скобки для группировки выражений, например `(expr1 OR expr2) AND expr3`
- **Семантика:** управление приоритетом логических операций с помощью скобок. Поддерживается многоуровневая вложенность
- **Рекомендация по индексу:** та же, что и для запросов с логическими комбинациями

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### Сценарий 6: Совместимость с синтаксисом Lucene/Elasticsearch {#scenario-6-luceneelasticsearch-syntax-compatibility}

**Сценарий использования:** миграция с Elasticsearch или написание выражений в соответствии с семантикой Lucene query_string.

Режим Lucene эмулирует поведение query_string в Elasticsearch/Lucene. Логические операторы работают как модификаторы слева направо, а не как традиционная булева алгебра.

**Основные отличия от стандартного режима:**

- AND/OR/NOT — модификаторы, воздействующие на соседние термы
- Приоритет операторов определяется слева направо
- Внутри используются MUST/SHOULD/MUST_NOT (аналогично перечислению Occur в Lucene)
- Чистый запрос NOT добавляет условие совпадения со всеми документами и исключает совпавшие строки

**Включение режима Lucene:**

```sql
-- Basic Lucene mode
SELECT * FROM docs
WHERE SEARCH('apple AND banana',
             '{"default_field":"title","mode":"lucene"}');

-- Use minimum_should_match
SELECT * FROM docs
WHERE SEARCH('apple AND banana OR cherry',
             '{"default_field":"title","mode":"lucene","minimum_should_match":1}');
```

**Сравнение поведения:**

| Запрос | Стандартный режим | Режим Lucene |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b (оба MUST) |
| `a OR b` | a ∪ b | a b (оба SHOULD, min=1) |
| `NOT a` | ¬a | Все документы, кроме a (`-a`) |
| `a AND NOT b` | a ∩ ¬b | +a -b (MUST a, MUST_NOT b) |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c (только a — MUST) |

> **Примечание:** в режиме Lucene `a AND b OR c` разбирается слева направо: оператор OR изменяет статус `b` с MUST на SHOULD. Используйте `minimum_should_match`, чтобы потребовать совпадения предложений SHOULD.

### Сценарий 7: Поиск фразы {#scenario-7-phrase-query}

**Сценарий использования:** поиск непрерывной упорядоченной фразы, например требование, чтобы «machine learning» встречалось именно в таком порядке.

- **Синтаксис:** `column:"quoted phrase"`
- **Семантика:** сопоставление непрерывных упорядоченных термов в соответствии с анализатором столбца. Вся фраза должна быть заключена в двойные кавычки
- **Рекомендация по индексу:** целевой столбец должен использовать токенизированный инвертированный индекс с позиционной информацией (настраивается с помощью `parser`)

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### Сценарий 8: Объединённый поиск по нескольким столбцам {#scenario-8-combined-search-across-multiple-columns}

**Сценарий использования:** один запрос охватывает несколько полей, например возвращает строки, совпавшие по заголовку, тегам или автору.

- **Синтаксис:** `column1:term OR column2:ANY(...) OR ...`
- **Семантика:** сопоставление по нескольким столбцам в одном выражении. Каждый столбец использует собственную конфигурацию индекса и токенизатора
- **Рекомендация по индексу:** создайте подходящий инвертированный индекс для каждого участвующего столбца

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### Сценарий 9: Запрос с подстановочными символами {#scenario-9-wildcard-query}

**Сценарий использования:** сопоставление по префиксу, суффиксу или вхождению, например поиск всех имён, начинающихся с «Chris».

- **Синтаксис:** `column:prefix*`, `column:*mid*`, `column:?ingle`
- **Семантика:** `*` сопоставляет строку любой длины, а `?` — один символ
- **Рекомендация по индексу:** подходит для нетокенизированных индексов. Также может использоваться для токенизированных индексов с включённым `lower_case`, чтобы получить регистронезависимое сопоставление

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### Сценарий 10: Запрос с регулярным выражением {#scenario-10-regular-expression-query}

**Сценарий использования:** использование регулярных выражений в стиле Lucene для сопоставления со сложными шаблонами.

- **Синтаксис:** `column:/regex/`
- **Семантика:** сопоставление с использованием регулярных выражений в стиле Lucene; шаблон заключается в косые черты
- **Рекомендация по индексу:** поддерживаются только нетокенизированные инвертированные индексы

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### Сценарий 11: Строгое равенство (EXACT) {#scenario-11-strict-equality-match-exact}

**Сценарий использования:** точное сопоставление полного исходного значения столбца. С учётом регистра, без токенизации.

- **Синтаксис:** `column:EXACT(text)`
- **Семантика:** точное сопоставление с полным значением столбца. С учётом регистра. Частичные термы не сопоставляются
- **Рекомендация по индексу:** также создайте для столбца нетокенизированный инвертированный индекс (без задания `parser`) для ускорения EXACT

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### Сценарий 12: Запрос к подстолбцу VARIANT {#scenario-12-variant-subcolumn-query}

**Сценарий использования:** поиск по определённому подпути внутри полуструктурированного поля VARIANT.

- **Синтаксис:** `variant_col.sub.path:term`
- **Семантика:** доступ к подстолбцу VARIANT по точечному пути для сопоставления. Поведение сопоставления определяется конфигурацией индекса и анализатора столбца VARIANT
- **Поддерживаемые возможности:** логические комбинации, `ANY`/`ALL`, вложенные пути. Несуществующие подстолбцы не дают совпадений

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## Полный пример {#complete-example}

Следующий комплексный пример показывает, как создать на одном столбце токенизированный и нетокенизированный индексы и объединить запросы EXACT, ANY/ALL, фразовые запросы и запросы с подстановочными символами.

### Создание таблицы и базовых индексов {#create-the-table-and-base-indexes}

```sql
-- Build both tokenized and non-tokenized inverted indexes
CREATE TABLE t (
    id INT,
    content STRING,
    INDEX idx_untokenized(content) USING INVERTED,
    INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);
```

### Сравнение запросов EXACT и токенизированных запросов {#comparing-exact-and-tokenized-queries}

```sql
-- Strict equality match (uses the non-tokenized index)
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- EXACT does not match partial terms
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL use the tokenized index
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- Compare EXACT and ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;
```

### Комбинированные условия и сокращённые формы {#combined-conditions-and-simplified-forms}

```sql
-- Combined conditions
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- Simplified form using a default field and default operator
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- Automatically expands to tags:ALL(deep learning)

-- Use a phrase and a wildcard together
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
ORDER BY id;
```

### Пример поиска по столбцу VARIANT {#variant-column-search-example}

```sql
-- A VARIANT column with an inverted index
CREATE TABLE test_variant_search_subcolumn (
    id BIGINT,
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="2048")>,
    INDEX idx_properties (properties) USING INVERTED PROPERTIES (
        "parser" = "unicode",
        "lower_case" = "true",
        "support_phrase" = "true"
    )
);

-- Single-term query
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL queries
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- OR query across different subcolumns
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```

## Экранирование символов {#escape-characters}

Используйте обратную косую черту (`\`) для экранирования специальных символов в DSL:

| Экранирование | Описание | Пример |
| --- | --- | --- |
| `\ ` | Литерал пробела (объединяет термы) | `title:First\ Value` сопоставляется с «First Value» |
| `\(` `\)` | Литерал скобок | `title:hello\(world\)` сопоставляется с «hello(world)» |
| `\:` | Литерал двоеточия | `title:key\:value` сопоставляется с «key:value» |
| `\\` | Литерал обратной косой черты | `title:path\\to\\file` сопоставляется с «path\to\file» |

**Примеры:**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **Примечание:** в SQL-строке обратные косые черты нужно экранировать дважды. Использование `\\` в SQL создаёт одну `\` в DSL.

## Текущие ограничения {#current-limitations}

- Предложения диапазона и списка (например, `field:[a TO b]` и `field:IN(...)`) по-прежнему откатываются к обычному сопоставлению термов. Вместо этого используйте обычные SQL-фильтры диапазона или `IN`.

В качестве альтернативы можно использовать стандартные операторы или операторы текстового поиска:

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## Пример параметров для нескольких полей {#multi-field-options-example}

Параметры `fields` и `type` доступны в Doris 4.1.0. В режиме `standard` вариант `best_fields` копирует полный запрос в каждый столбец и объединяет копии с помощью OR. Вариант `cross_fields` разворачивает каждый терм по столбцам. Различие между сопоставлением в одном и разных столбцах ниже использует `AND` или `default_operator="and"`; его нельзя предполагать для оператора OR по умолчанию. В режиме `lucene` разворачивание выполняется по предложениям, поэтому это сравнение AND для стандартного режима не описывает поведение Lucene.

Подготовьте следующие данные в базе данных, где у вас есть привилегии CREATE, INSERT и SELECT:

```sql
CREATE TABLE search_multifield (
    id INT,
    title STRING,
    content STRING,
    INDEX title_idx(title) USING INVERTED PROPERTIES ("parser"="unicode", "lower_case"="true"),
    INDEX content_idx(content) USING INVERTED PROPERTIES ("parser"="unicode", "lower_case"="true")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
INSERT INTO search_multifield VALUES
(1, 'Alice', 'Smith'),
(2, 'Alice Smith', 'other'),
(3, 'Bob', 'Smith');
```

```sql
SELECT id FROM search_multifield
WHERE SEARCH('Alice Smith',
  '{"fields":["title","content"],"type":"best_fields","default_operator":"and"}')
ORDER BY id;
```

```text
id
2
```

```sql
SELECT id FROM search_multifield
WHERE SEARCH('Alice Smith',
  '{"fields":["title","content"],"type":"cross_fields","default_operator":"and"}')
ORDER BY id;
```

```text
id
1
2
```

Запрос Lucene, содержащий только отрицательные предложения, добавляет условие совпадения со всеми документами и исключает отрицательные термы:

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
