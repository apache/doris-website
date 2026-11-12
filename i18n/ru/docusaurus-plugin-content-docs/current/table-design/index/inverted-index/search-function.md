---
{
    "title": "Функция SEARCH",
    "language": "ru",
    "description": "Функция SEARCH — единая точка входа для полнотекстового поиска в Apache Doris 4.0. Она позволяет описывать условия запроса с помощью краткого выражения DSL и эффективно выполнять поиск по термам, фразам, логическим условиям, шаблонам с подстановочными знаками и регулярным выражениям на основе инвертированного индекса."
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

Функция `SEARCH` служит единой точкой входа для полнотекстовых поисковых запросов в Apache Doris начиная с версии 4.0. Она позволяет описывать условия запроса с помощью краткого выражения DSL (предметно-ориентированного языка) и эффективно выполнять их на основе инвертированного индекса.

`SEARCH` представляет собой функцию-предикат, которая возвращает логическое значение. Её можно использовать как условие фильтрации в предложении `WHERE`. Она принимает строку SEARCH DSL, описывающую правила сопоставления текста, и передаёт подходящие условия на выполнение инвертированному индексу.

**Типичные сценарии использования:**

- Поиск по термам, фразам и логическим комбинациям в текстовых полях
- Комбинированный поиск по нескольким столбцам
- Сопоставление по шаблону с помощью подстановочных знаков или регулярных выражений
- Структурированный текстовый поиск по подстолбцам VARIANT
- Сохранение совместимости со стилем синтаксиса query_string в Lucene/Elasticsearch

## Синтаксис {#syntax}

### Основные формы вызова {#basic-invocation-forms}

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**Описание параметров:**

| Параметр | Обязательность | Описание |
| --- | --- | --- |
| `<search_expression>` | Обязательный | Выражение запроса SEARCH DSL (строковый литерал) |
| `<default_field>` | Необязательный | Имя столбца, которое автоматически применяется, когда для термов в DSL явно не указано поле |
| `<default_operator>` | Необязательный | Логический оператор по умолчанию для выражений с несколькими термами. Допускаются только `and` или `or` (без учёта регистра). По умолчанию используется `or` |

**Примечания по использованию:**

- **Место использования**: в предложении `WHERE` как предикат, участвующий в фильтрации строк
- **Тип возвращаемого значения**: BOOLEAN, не допускающий NULL (TRUE при совпадении, иначе FALSE)

Если указан `default_field`, Doris автоматически привязывает термы или функции без указания поля к этому полю. Например:

- `SEARCH('foo bar', 'tags', 'and')` эквивалентно `SEARCH('tags:ALL(foo bar)')`
- `SEARCH('foo bar', 'tags')` разворачивается в `tags:ANY(foo bar)`

Логические операции, явно указанные в DSL, имеют наивысший приоритет и переопределяют оператор по умолчанию.

### Параметр опций (формат JSON) {#options-parameter-json-format}

Второй параметр также может быть строкой JSON для расширенной настройки:

```sql
SEARCH('<search_expression>', '<options_json>')
```

**Поддерживаемые опции:**

| Опция | Тип | Описание |
| --- | --- | --- |
| `default_field` | string | Имя столбца по умолчанию для термов, у которых поле не указано явно |
| `default_operator` | string | Оператор по умолчанию для выражений с несколькими термами (`and` или `or`) |
| `mode` | string | `standard` (по умолчанию) или `lucene` |
| `minimum_should_match` | integer | Минимальное число совпавших условий SHOULD (только в режиме Lucene) |
| `fields` | массив строк | Необязательные целевые столбцы для термов без явно указанных полей; нельзя использовать вместе с непустым `default_field` |
| `type` | string | Необязательный способ развёртывания запроса на несколько полей: `best_fields` (по умолчанию) или `cross_fields`; не выбирает алгоритм оценки релевантности или сортировки |

**Пример:**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL и двузначная логика сопоставления {#null-and-three-valued-logic}

**Версия:** описанные ниже правила двузначного сопоставления, примеры NULL/NOT и поведение при ошибках индекса VARIANT применяются начиная с Doris 4.2.

`SEARCH` возвращает BOOLEAN, не допускающий NULL: TRUE при совпадении и FALSE при отсутствии совпадения. Обычный терм не совпадает со значением NULL или с путём VARIANT, для которого установлено отсутствие в хранилище. SEARCH не распространяет UNKNOWN.

В стандартном режиме `AND` вычисляет пересечение множеств совпадений, `OR` объединяет их, а `NOT` вычисляет дополнение относительно строк, видимых запросу. Поэтому и `SEARCH('NOT a:hit')`, и `NOT SEARCH('a:hit')` включают строки с NULL. В режиме Lucene действует то же правило для NULL и отсутствия совпадения, при этом сохраняются собственные правила разбора логических выражений, описанные ниже. Вычисление `score()` или использование кеша запросов не меняет полное множество совпадений; сортировка и LIMIT могут изменить набор возвращаемых строк.

Обычные сравнения SQL и операторы `MATCH` сохраняют трёхзначную логику SQL. Для входного значения NULL выражения `a != 'hit'` и `NOT (a MATCH_ANY 'hit')` дают UNKNOWN и отфильтровываются предложением `WHERE`. Внешнее выражение SQL по-прежнему может возвращать UNKNOWN из-за других операндов, допускающих NULL.

#### Пример: NULL и NOT {#example-null-and-not}

Выполняйте примеры в базе данных, где у вас есть права CREATE, INSERT и SELECT. Один бакет и одна реплика в примере ниже предназначены для небольшой демонстрационной таблицы.

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

В сохраняемых объектах вне массивов поля JSON со значением `null` удаляются, поэтому чтение такого пути возвращает SQL NULL, как и для отсутствующего поля. Это отличается от JSON `null`, вычисленного внутри выражения; см. [Семантика NULL в VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#null-semantics).

Для вставки объектов JSON используйте `parse_to_variant`. В следующей таблице отключён doc mode, поэтому пример использует материализованные подпути с индексами, доступными для выполнения запросов.

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

`NOT SEARCH('v.a:hit')` возвращает те же идентификаторы. Если путь отсутствует во всех строках, `SEARCH('v.absent:hit')` не возвращает ни одной строки, а `SEARCH('NOT v.absent:hit')` возвращает все пять строк. Чтобы оставить только строки со значением, отличным от NULL, по целевому пути, добавьте `v['a'] IS NOT NULL` вне SEARCH.

**Отсутствующий путь и недоступный индекс являются разными состояниями.** Если путь содержит данные, но необходимый инвертированный индекс нельзя использовать для выполнения запроса, SEARCH сообщает `SEARCH index unavailable for Variant field 'v.a'`, в том числе для запросов с отрицанием. Примеры: ранее созданные rowset, для которых индекс ещё не построен после CREATE INDEX, или путь, сохранённый только в doc storage без доступного индекса конечного узла. SEARCH не считает эти состояния пустым множеством совпадений и не переходит автоматически к сканированию. Убедитесь, что необходимый индекс пути доступен для всех запрашиваемых данных, либо извлеките путь и выполните запрос к нему с помощью обычного SQL.

## Использование SEARCH по сценариям {#using-search-by-scenario}

### Сценарий 1: совпадение по одному терму {#scenario-1-single-term-match}

**Сценарий использования:** поиск документов, содержащих определённый терм в поле.

- **Синтаксис:** `column:term`
- **Семантика:** сопоставление терма с результатом токенизации столбца. Учёт регистра при сопоставлении зависит от свойства индекса `lower_case`
- **Рекомендации по индексу:** создайте инвертированный индекс для столбца с подходящим `parser`/`analyzer`

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### Сценарий 2: совпадение по нескольким термам с OR (ANY) {#scenario-2-multi-term-or-match-any}

**Сценарий использования:** совпадение происходит при нахождении любого терма из списка, например при сопоставлении тегов или комбинированном поиске по ключевым словам.

- **Синтаксис:** `column:ANY(term1 term2 ...)`
- **Семантика:** результат токенизации столбца содержит любой терм из списка (семантика OR). Порядок не имеет значения, повторяющиеся термы игнорируются
- **Рекомендации по индексу:** создайте для столбца инвертированный индекс с токенизацией (например, `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### Сценарий 3: совпадение по нескольким термам с AND (ALL) {#scenario-3-multi-term-and-match-all}

**Сценарий использования:** должны совпасть все указанные термы, например для строгого отбора по тематике.

- **Синтаксис:** `column:ALL(term1 term2 ...)`
- **Семантика:** результат токенизации столбца одновременно содержит все термы из списка (семантика AND). Порядок не имеет значения, повторяющиеся термы игнорируются
- **Рекомендации по индексу:** создайте для столбца инвертированный индекс с токенизацией (например, `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### Сценарий 4: запрос с логической комбинацией условий {#scenario-4-boolean-combination-query}

**Сценарий использования:** несколько условий нужно объединить с помощью AND/OR/NOT, например «должно содержать A и не содержать B».

- **Синтаксис:** `(expr) AND/OR/NOT (expr)`
- **Семантика:** объединение подвыражений внутри SEARCH с помощью `AND`, `OR` и `NOT`
- **Рекомендации по индексу:** по возможности помещайте условия, поддерживающие поиск по индексу, внутрь SEARCH, чтобы передать их на выполнение индексу. Для дополнительной фильтрации используйте другие условия WHERE

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### Сценарий 5: сложные вложенные выражения {#scenario-5-complex-nested-expressions}

**Сценарий использования:** управление приоритетом логических операций и построение многоуровневых вложенных условий фильтрации с помощью скобок.

- **Синтаксис:** используйте скобки для группировки выражений, например `(expr1 OR expr2) AND expr3`
- **Семантика:** управление приоритетом логических операций с помощью скобок. Поддерживается многоуровневая вложенность
- **Рекомендации по индексу:** те же, что и для запросов с логической комбинацией условий

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### Сценарий 6: совместимость с синтаксисом Lucene/Elasticsearch {#scenario-6-luceneelasticsearch-syntax-compatibility}

**Сценарий использования:** миграция с Elasticsearch или необходимость писать выражения с семантикой Lucene query_string.

Режим Lucene воспроизводит поведение query_string в Elasticsearch/Lucene. Логические операторы работают как модификаторы, применяемые слева направо, а не по правилам традиционной булевой алгебры.

**Основные отличия от стандартного режима:**

- AND/OR/NOT являются модификаторами, влияющими на соседние термы
- Операторы обрабатываются слева направо
- Внутри используются MUST/SHOULD/MUST_NOT (аналогично перечислению Occur в Lucene)
- Запрос только с NOT добавляет условие совпадения со всеми документами и исключает совпавшие строки

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
| `NOT a` | ¬a | Совпадение со всеми документами, кроме a (`-a`) |
| `a AND NOT b` | a ∩ ¬b | +a -b (MUST a, MUST_NOT b) |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c (только a имеет статус MUST) |

> **Примечание:** в режиме Lucene выражение `a AND b OR c` разбирается слева направо: оператор OR меняет статус `b` с MUST на SHOULD. Используйте `minimum_should_match`, чтобы требовать совпадения условий SHOULD.

### Сценарий 7: фразовый запрос {#scenario-7-phrase-query}

**Сценарий использования:** поиск непрерывной последовательности термов в заданном порядке, например требование, чтобы «machine learning» встречалось именно в таком порядке.

- **Синтаксис:** `column:"quoted phrase"`
- **Семантика:** сопоставление соседних термов в заданном порядке с учётом анализатора столбца. Вся фраза должна быть заключена в двойные кавычки
- **Рекомендации по индексу:** целевой столбец должен использовать инвертированный индекс с токенизацией и сведениями о позициях термов (настраивается с помощью `parser`)

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### Сценарий 8: комбинированный поиск по нескольким столбцам {#scenario-8-combined-search-across-multiple-columns}

**Сценарий использования:** один запрос охватывает несколько полей, например возвращает строки с совпадениями в заголовке, тегах или имени автора.

- **Синтаксис:** `column1:term OR column2:ANY(...) OR ...`
- **Семантика:** сопоставление по нескольким столбцам в одном выражении. Каждый столбец применяет собственную конфигурацию индекса и токенизатора
- **Рекомендации по индексу:** создайте подходящий инвертированный индекс для каждого участвующего столбца

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### Сценарий 9: запрос с подстановочными знаками {#scenario-9-wildcard-query}

**Сценарий использования:** сопоставление по префиксу, суффиксу или вхождению подстроки, например поиск всех имён, начинающихся с «Chris».

- **Синтаксис:** `column:prefix*`, `column:*mid*`, `column:?ingle`
- **Семантика:** используйте `*` для сопоставления со строкой любой длины и `?` для сопоставления с одним символом
- **Рекомендации по индексу:** подходит для индексов без токенизации. Можно также использовать с индексами с токенизацией и включённым `lower_case` для сопоставления без учёта регистра

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### Сценарий 10: запрос с регулярным выражением {#scenario-10-regular-expression-query}

**Сценарий использования:** сложное сопоставление по шаблону с помощью регулярных выражений в стиле Lucene.

- **Синтаксис:** `column:/regex/`
- **Семантика:** сопоставление с помощью регулярных выражений в стиле Lucene; шаблон заключается в косые черты
- **Рекомендации по индексу:** поддерживаются только инвертированные индексы без токенизации

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### Сценарий 11: строгое равенство (EXACT) {#scenario-11-strict-equality-match-exact}

**Сценарий использования:** точное сопоставление с полным исходным значением столбца. С учётом регистра, без токенизации.

- **Синтаксис:** `column:EXACT(text)`
- **Семантика:** точное сопоставление с полным значением столбца. Учитывает регистр. Не даёт совпадений по части терма
- **Рекомендации по индексу:** для ускорения EXACT также создайте инвертированный индекс без токенизации для столбца (без настройки `parser`)

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### Сценарий 12: запрос к подстолбцу VARIANT {#scenario-12-variant-subcolumn-query}

**Сценарий использования:** поиск по определённому подпути в полуструктурированном поле VARIANT.

- **Синтаксис:** `variant_col.sub.path:term`
- **Семантика:** обращение к подстолбцу VARIANT через путь с точками для сопоставления. Поведение сопоставления определяется конфигурацией индекса и анализатора столбца VARIANT
- **Поддерживаемые возможности:** логические комбинации, `ANY`/`ALL`, вложенные пути. Несуществующие подстолбцы не дают совпадений

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## Полный пример {#complete-example}

Следующий подробный пример показывает, как создать для одного столбца индексы с токенизацией и без неё, а также как сочетать EXACT, ANY/ALL, фразовые запросы и запросы с подстановочными знаками.

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

### Сравнение EXACT и запросов с токенизацией {#comparing-exact-and-tokenized-queries}

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
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
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

Для экранирования специальных символов в DSL используйте обратную косую черту (`\`):

| Экранирование | Описание | Пример |
| --- | --- | --- |
| `\ ` | Пробел как обычный символ (объединяет термы) | `title:First\ Value` соответствует «First Value» |
| `\(` `\)` | Скобки как обычные символы | `title:hello\(world\)` соответствует «hello(world)» |
| `\:` | Двоеточие как обычный символ | `title:key\:value` соответствует «key:value» |
| `\\` | Обратная косая черта как обычный символ | `title:path\\to\\file` соответствует «path\to\file» |

**Примеры:**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **Примечание:** в строке SQL обратные косые черты нужно экранировать удвоением. Использование `\\` в SQL даёт одну `\` в DSL.

## Текущие ограничения {#current-limitations}

- Условия диапазонов и списков (например, `field:[a TO b]` и `field:IN(...)`) пока обрабатываются как обычное сопоставление термов. Вместо них используйте обычные фильтры SQL по диапазону или `IN`.

В качестве альтернативы можно использовать стандартные операторы или операторы текстового поиска:

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## Пример опций для нескольких полей {#multi-field-options-example}

`fields` и `type` доступны в Doris 4.1.0. В режиме `standard` вариант `best_fields` копирует весь запрос для каждого поля и объединяет копии через OR. `cross_fields` разворачивает каждый терм по всем полям. Приведённое ниже различие между сопоставлением в пределах одного поля и по нескольким полям относится к использованию `AND` или `default_operator="and"`; его нельзя переносить на оператор OR, используемый по умолчанию. В режиме `lucene` развёртывание выполняется отдельно для каждого условия, поэтому это сравнение для AND в стандартном режиме не описывает поведение Lucene.

Подготовьте следующие данные в базе данных, где у вас есть права CREATE, INSERT и SELECT:

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

Запрос Lucene, содержащий только отрицательные условия, добавляет условие совпадения со всеми документами и исключает отрицательные термы:

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
