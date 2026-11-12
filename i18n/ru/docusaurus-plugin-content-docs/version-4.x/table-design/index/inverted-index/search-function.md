---
{
    "title": "Функция SEARCH",
    "language": "ru",
    "description": "Функция SEARCH — единая точка входа для полнотекстового поиска в Apache Doris 4.0. Она описывает условия запроса с помощью лаконичного DSL-выражения и эффективно выполняет поиск по термам, фразам, булевым условиям, подстановочным знакам и регулярным выражениям на основе инвертированного индекса."
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

Функция `SEARCH` — единая точка входа для полнотекстовых поисковых запросов, доступная в Apache Doris начиная с версии 4.0. Она описывает условия запроса с помощью лаконичного DSL (предметно-ориентированного языка) и эффективно выполняет их на основе инвертированного индекса.

`SEARCH` — функция-предикат, возвращающая булево значение. Её можно использовать как условие фильтрации в предложении `WHERE`. Она принимает строку SEARCH DSL с правилами сопоставления текста и передаёт подходящие условия в инвертированный индекс для выполнения.

**Типичные сценарии использования:**

- Поиск по термам, фразам и их булевым комбинациям в текстовых полях
- Комбинированный поиск по нескольким столбцам
- Сопоставление с шаблоном с помощью подстановочных знаков или регулярных выражений
- Структурированный поиск текста в подстолбцах VARIANT
- Совместимость со стилем синтаксиса query_string в Lucene/Elasticsearch

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
| `<default_field>` | Необязательный | Имя столбца, автоматически применяемое к термам в DSL, для которых поле не указано явно |
| `<default_operator>` | Необязательный | Булев оператор по умолчанию для выражений с несколькими термами. Допускаются только `and` или `or` (без учёта регистра). По умолчанию используется `or` |

**Особенности использования:**

- **Место использования**: в предложении `WHERE` как предикат, участвующий в фильтрации строк
- **Возвращаемый тип**: BOOLEAN, не допускающий NULL (TRUE при совпадении, иначе FALSE; начиная с Doris 4.2)

Если указан `default_field`, Doris автоматически привязывает термы или функции без указания поля к этому полю. Например:

- `SEARCH('foo bar', 'tags', 'and')` эквивалентно `SEARCH('tags:ALL(foo bar)')`
- `SEARCH('foo bar', 'tags')` разворачивается в `tags:ANY(foo bar)`

Булевы операции, явно указанные в DSL, имеют наивысший приоритет и переопределяют оператор по умолчанию.

### Параметр настроек (формат JSON) {#options-parameter-json-format}

Вторым параметром также может быть строка JSON с расширенными настройками:

```sql
SEARCH('<search_expression>', '<options_json>')
```

**Поддерживаемые настройки:**

| Настройка | Тип | Описание |
| --- | --- | --- |
| `default_field` | строка | Имя столбца по умолчанию для термов без явно указанного поля |
| `default_operator` | строка | Оператор по умолчанию для выражений с несколькими термами (`and` или `or`) |
| `mode` | строка | `standard` (по умолчанию) или `lucene` |
| `minimum_should_match` | целое число | Минимальное количество совпавших условий SHOULD (только в режиме Lucene) |
| `fields` | массив строк | Необязательный список целевых столбцов для термов без явно указанных полей; нельзя использовать вместе с непустым `default_field` |
| `type` | строка | Необязательный способ развёртывания запроса по нескольким полям: `best_fields` (по умолчанию) или `cross_fields`; не выбирает алгоритм вычисления релевантности или сортировки |

**Пример:**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL и двухзначная логика сопоставления {#null-and-three-valued-logic}

**Версия:** описанные ниже правила двухзначного сопоставления, примеры с NULL/NOT и поведение при ошибках индекса VARIANT применяются начиная с Doris 4.2.

`SEARCH` возвращает BOOLEAN, не допускающий NULL: TRUE при совпадении и FALSE при его отсутствии. Обычный терм не совпадает со значением NULL или с путём VARIANT, отсутствие которого в хранилище установлено. SEARCH не передаёт UNKNOWN в результат.

В стандартном режиме `AND` вычисляет пересечение множеств совпадений, `OR` — их объединение, а `NOT` — дополнение относительно строк, видимых запросу. Поэтому и `SEARCH('NOT a:hit')`, и `NOT SEARCH('a:hit')` включают строки с NULL. Режим Lucene использует то же правило для NULL и отсутствия совпадений, сохраняя при этом собственные правила разбора булевых выражений, описанные ниже. Вычисление `score()` или использование кеша запросов не меняет полное множество совпадений; сортировка и LIMIT могут изменить набор возвращаемых строк.

Обычные сравнения SQL и операторы `MATCH` сохраняют трёхзначную логику SQL. Для входного значения NULL выражения `a != 'hit'` и `NOT (a MATCH_ANY 'hit')` дают UNKNOWN и отфильтровываются предложением `WHERE`. Внешнее SQL-выражение по-прежнему может возвращать UNKNOWN из-за других операндов, допускающих NULL.

#### Пример: NULL и NOT {#example-null-and-not}

Выполните примеры в базе данных, где у вас есть права CREATE, INSERT и SELECT. Один бакет и одна реплика в примере ниже предназначены для небольшой демонстрационной таблицы.

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

Для этих трёх строк условие SQL `a != 'hit'` и условие текстового поиска `NOT (a MATCH_ANY 'hit')` также возвращают только строку с id 2.

#### VARIANT: NULL, отсутствующие пути и недоступные индексы {#variant-null-missing-paths-and-unavailable-indexes}

Обычный терм VARIANT, например `v.a:hit`, подчиняется тому же правилу:

| Значение, записанное в `v` | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}` (путь `a` отсутствует) | FALSE | TRUE |
| SQL NULL (весь столбец VARIANT имеет значение NULL) | FALSE | TRUE |

В хранимых объектах вне массивов поля со значением JSON `null` удаляются, поэтому чтение такого пути возвращает SQL NULL, как и при отсутствии поля. Это отличается от значения JSON `null`, вычисленного внутри выражения; см. [руководство по VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md).

Для вставки объектов JSON используйте `parse_to_variant`. В следующей таблице режим doc отключён, поэтому пример использует материализованные подпути с индексами, пригодными для выполнения запросов.

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

`NOT SEARCH('v.a:hit')` возвращает те же идентификаторы. Если путь отсутствует во всех строках, `SEARCH('v.absent:hit')` не возвращает строк, а `SEARCH('NOT v.absent:hit')` возвращает все пять строк. Чтобы оставить только строки со значением, отличным от NULL, по целевому пути, добавьте `v['a'] IS NOT NULL` вне SEARCH.

**Отсутствующий путь и недоступный индекс — разные состояния.** Если путь содержит данные, но необходимый инвертированный индекс нельзя использовать для выполнения запроса, SEARCH сообщает `SEARCH index unavailable for Variant field 'v.a'`, в том числе для запросов с отрицанием. Например, это происходит с ранее созданными наборами строк, для которых индекс ещё не построен после CREATE INDEX, или с путём, сохранённым только в хранилище doc без пригодного для выполнения запросов индекса конечного поля. SEARCH не считает такие состояния пустым множеством совпадений и не переходит автоматически к сканированию. Убедитесь, что необходимый индекс пути доступен для всех запрашиваемых данных, или запрашивайте извлечённый путь с помощью обычного SQL.

## Использование SEARCH в различных сценариях {#using-search-by-scenario}

### Сценарий 1: поиск по одному терму {#scenario-1-single-term-match}

**Назначение:** поиск документов, содержащих определённый терм в поле.

- **Синтаксис:** `column:term`
- **Семантика:** терм сопоставляется с результатом токенизации столбца. Чувствительность к регистру зависит от свойства индекса `lower_case`
- **Рекомендация по индексу:** создайте инвертированный индекс для столбца с подходящим `parser`/`analyzer`

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### Сценарий 2: поиск по нескольким термам с OR (ANY) {#scenario-2-multi-term-or-match-any}

**Назначение:** совпадение засчитывается при нахождении любого терма из списка, например при поиске по тегам или комбинированном поиске по ключевым словам.

- **Синтаксис:** `column:ANY(term1 term2 ...)`
- **Семантика:** результат токенизации столбца содержит любой терм из списка (семантика OR). Порядок не имеет значения, повторяющиеся термы игнорируются
- **Рекомендация по индексу:** создайте для столбца инвертированный индекс с токенизацией (например, `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### Сценарий 3: поиск по нескольким термам с AND (ALL) {#scenario-3-multi-term-and-match-all}

**Назначение:** должны быть найдены все указанные термы, например для строгой фильтрации по теме.

- **Синтаксис:** `column:ALL(term1 term2 ...)`
- **Семантика:** результат токенизации столбца одновременно содержит все термы из списка (семантика AND). Порядок не имеет значения, повторяющиеся термы игнорируются
- **Рекомендация по индексу:** создайте для столбца инвертированный индекс с токенизацией (например, `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### Сценарий 4: запрос с булевой комбинацией условий {#scenario-4-boolean-combination-query}

**Назначение:** объединение нескольких условий с помощью AND/OR/NOT, например «должно содержать A и не содержать B».

- **Синтаксис:** `(expr) AND/OR/NOT (expr)`
- **Семантика:** объединение подвыражений внутри SEARCH с помощью `AND`, `OR` и `NOT`
- **Рекомендация по индексу:** по возможности размещайте условия сопоставления внутри SEARCH, чтобы передать их выполнение индексу. Для дополнительной фильтрации используйте другие условия WHERE

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### Сценарий 5: сложные вложенные выражения {#scenario-5-complex-nested-expressions}

**Назначение:** использование скобок для управления приоритетом булевых операций и построения условий фильтрации с несколькими уровнями вложенности.

- **Синтаксис:** используйте скобки для группировки выражений, например `(expr1 OR expr2) AND expr3`
- **Семантика:** управление приоритетом булевых операций с помощью скобок. Поддерживается многоуровневая вложенность
- **Рекомендация по индексу:** такая же, как для запросов с булевой комбинацией условий

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### Сценарий 6: совместимость с синтаксисом Lucene/Elasticsearch {#scenario-6-luceneelasticsearch-syntax-compatibility}

**Назначение:** миграция с Elasticsearch или написание выражений с семантикой query_string в Lucene.

Режим Lucene воспроизводит поведение query_string в Elasticsearch/Lucene. Булевы операторы работают как модификаторы, применяемые слева направо, а не по правилам традиционной булевой алгебры.

**Основные отличия от стандартного режима:**

- AND/OR/NOT — модификаторы, влияющие на соседние термы
- Операторы обрабатываются слева направо
- Внутри используются MUST/SHOULD/MUST_NOT (аналогично перечислению Occur в Lucene)
- Запрос, состоящий только из NOT, добавляет условие совпадения со всеми документами и исключает совпавшие строки

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
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c (только a имеет тип MUST) |

> **Примечание:** в режиме Lucene `a AND b OR c` разбирается слева направо: оператор OR меняет тип `b` с MUST на SHOULD. Используйте `minimum_should_match`, чтобы требовать совпадения условий SHOULD.

### Сценарий 7: поиск по фразе {#scenario-7-phrase-query}

**Назначение:** поиск фразы из непрерывной последовательности термов в заданном порядке, например требование, чтобы «machine learning» встречалось именно в таком порядке.

- **Синтаксис:** `column:"quoted phrase"`
- **Семантика:** сопоставление непрерывной последовательности термов в заданном порядке в соответствии с анализатором столбца. Фразу целиком необходимо заключить в двойные кавычки
- **Рекомендация по индексу:** целевой столбец должен использовать инвертированный индекс с токенизацией и информацией о позициях (настраивается с помощью `parser`)

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### Сценарий 8: комбинированный поиск по нескольким столбцам {#scenario-8-combined-search-across-multiple-columns}

**Назначение:** один запрос охватывает несколько полей, например возвращает строки с совпадением в заголовке, тегах или имени автора.

- **Синтаксис:** `column1:term OR column2:ANY(...) OR ...`
- **Семантика:** поиск совпадений в нескольких столбцах в рамках одного выражения. Каждый столбец использует собственные настройки индекса и токенизатора
- **Рекомендация по индексу:** создайте подходящий инвертированный индекс для каждого участвующего столбца

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### Сценарий 9: запрос с подстановочными знаками {#scenario-9-wildcard-query}

**Назначение:** поиск по префиксу, суффиксу или вхождению подстроки, например поиск всех имён, начинающихся с «Chris».

- **Синтаксис:** `column:prefix*`, `column:*mid*`, `column:?ingle`
- **Семантика:** используйте `*` для сопоставления со строкой любой длины и `?` для сопоставления с одним символом
- **Рекомендация по индексу:** подходит для индексов без токенизации. Также можно использовать с индексами с токенизацией, если включён `lower_case`, чтобы выполнять сопоставление без учёта регистра

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### Сценарий 10: запрос с регулярным выражением {#scenario-10-regular-expression-query}

**Назначение:** использование регулярных выражений в стиле Lucene для сложного сопоставления с шаблоном.

- **Синтаксис:** `column:/regex/`
- **Семантика:** сопоставление с помощью регулярных выражений в стиле Lucene; шаблон заключается в косые черты
- **Рекомендация по индексу:** поддерживаются только инвертированные индексы без токенизации

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### Сценарий 11: строгое равенство (EXACT) {#scenario-11-strict-equality-match-exact}

**Назначение:** точное сопоставление с полным исходным значением столбца. С учётом регистра, без токенизации.

- **Синтаксис:** `column:EXACT(text)`
- **Семантика:** точное сопоставление с полным значением столбца. Учитывает регистр. Не сопоставляет части термов
- **Рекомендация по индексу:** для ускорения EXACT также создайте для столбца инвертированный индекс без токенизации (не задавая `parser`)

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### Сценарий 12: запрос к подстолбцу VARIANT {#scenario-12-variant-subcolumn-query}

**Назначение:** поиск по определённому подпути внутри полуструктурированного поля VARIANT.

- **Синтаксис:** `variant_col.sub.path:term`
- **Семантика:** обращение к подстолбцу VARIANT по пути с точками для поиска совпадений. Поведение сопоставления определяется настройками индекса и анализатора столбца VARIANT
- **Поддерживаемые возможности:** булевы комбинации, `ANY`/`ALL`, вложенные пути. Несуществующие подстолбцы не дают совпадений

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## Полный пример {#complete-example}

Следующий подробный пример показывает, как создать индексы с токенизацией и без неё для одного столбца и как комбинировать запросы EXACT, ANY/ALL, поиск по фразе и поиск с подстановочными знаками.

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

### Комбинированные условия и упрощённые формы {#combined-conditions-and-simplified-forms}

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

Используйте обратную косую черту (`\`) для экранирования специальных символов в DSL:

| Экранирование | Описание | Пример |
| --- | --- | --- |
| `\ ` | Буквальный пробел (соединяет термы) | `title:First\ Value` соответствует «First Value» |
| `\(` `\)` | Буквальные скобки | `title:hello\(world\)` соответствует «hello(world)» |
| `\:` | Буквальное двоеточие | `title:key\:value` соответствует «key:value» |
| `\\` | Буквальная обратная косая черта | `title:path\\to\\file` соответствует «path\to\file» |

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

- Условия диапазона и списка (например, `field:[a TO b]` и `field:IN(...)`) по-прежнему обрабатываются как обычное сопоставление термов. Вместо них используйте стандартные фильтры SQL по диапазону или `IN`.

В качестве альтернативы можно использовать стандартные операторы или операторы текстового поиска:

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## Пример настроек для нескольких полей {#multi-field-options-example}

`fields` и `type` доступны в Doris 4.1.0. В режиме `standard` значение `best_fields` копирует весь запрос для каждого поля и объединяет копии с помощью OR. Значение `cross_fields` разворачивает каждый терм по всем полям. Описанное ниже различие между совпадением в одном поле и в разных полях относится к использованию `AND` или `default_operator="and"`; его нельзя переносить на оператор OR, используемый по умолчанию. В режиме `lucene` развёртывание выполняется для каждого условия, поэтому это сравнение для AND в стандартном режиме не описывает поведение Lucene.

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
