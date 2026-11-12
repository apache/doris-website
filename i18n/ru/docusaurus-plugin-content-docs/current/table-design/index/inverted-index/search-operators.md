---
{
    "title": "Операторы полнотекстового поиска и ускорения запросов",
    "language": "ru",
    "description": "Справочник по операторам полнотекстового поиска и ускорения запросов, поддерживаемым инвертированным индексом Apache Doris: 8 поисковых операторов, включая MATCH_ANY/ALL/PHRASE/REGEXP, охватывают поиск по ключевым словам, фразам, префиксам и регулярным выражениям, а также ускоряют структурированные запросы с условиями равенства, диапазонами и массивами."
}
---

<!-- Knowledge type: Operator reference / Usage examples -->
<!-- Applicable scenarios: Full-text search query authoring / Inverted index query acceleration -->

В этом документе представлены операторы запросов, поддерживаемые инвертированным индексом Apache Doris. Они разделены на две категории:

- **Операторы полнотекстового поиска**: для нечёткого сопоставления текстовых полей, например по ключевым словам, фразам, префиксам и регулярным выражениям.
- **Ускорение запросов с помощью инвертированного индекса**: для точной фильтрации структурированных полей, например проверки равенства, попадания в диапазон, принадлежности множеству и операций с массивами.

## Операторы полнотекстового поиска {#full-text-search-operators}

В следующей таблице перечислены все операторы полнотекстового поиска и типичные сценарии их использования:

| Оператор | Типичный сценарий | Правило сопоставления |
|------|----------|----------|
| `MATCH_ANY` | Поиск по ключевым словам с логикой «OR» | Совпадение хотя бы по одному ключевому слову |
| `MATCH_ALL` | Поиск по ключевым словам с логикой «AND» | Должны совпасть все ключевые слова |
| `MATCH_PHRASE` | Строгий поиск по фразе | Термы идут подряд и в заданном порядке |
| `MATCH_PHRASE` (с параметром slop) | Поиск по фразе с допустимыми отклонениями | Допускаются промежутки между термами |
| `MATCH_PHRASE` (строгий порядок) | Поиск по фразе с фиксированным порядком термов | Порядок термов фиксирован в пределах допустимых промежутков |
| `MATCH_PHRASE_PREFIX` | Подсказки при вводе / дополнение по префиксу | Последний терм сопоставляется по префиксу |
| `MATCH_REGEXP` | Сопоставление термов по регулярному выражению | Регулярное выражение применяется к результатам токенизации |
| `MATCH_PHRASE_EDGE` | Нечёткое сопоставление по краям фразы | Суффикс первого терма + точное совпадение средних термов + префикс последнего терма |

### Поиск по ключевым словам: MATCH_ANY / MATCH_ALL {#keyword-search-match_any--match_all}

Подходит для сценария «дано несколько ключевых слов, нужно найти документы, содержащие эти слова».

- **MATCH_ANY**: находит строки, содержащие хотя бы одно из ключевых слов.

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
    ```

- **MATCH_ALL**: находит строки, содержащие все ключевые слова одновременно.

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
    ```

### Поиск по фразам: семейство MATCH_PHRASE {#phrase-search-match_phrase-family}

Подходит для точного сопоставления фраз, когда «ключевые слова должны идти подряд или сохранять заданный порядок термов».

#### Строгое сопоставление фраз {#strict-phrase-matching}

Требует, чтобы термы шли подряд и в заданном порядке. Чтобы включить ускорение с помощью индекса, задайте `"support_phrase" = "true"` в свойствах индекса.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

#### Сопоставление фраз с параметром slop {#phrase-matching-with-slop}

Допускает до `slop` слов между ключевыми словами; порядок термов может меняться.

```sql
-- Allow up to 3 words between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

#### Сопоставление фраз со строгим порядком термов {#strict-order-phrase-matching}

Сочетание `+` с параметром slop задаёт фиксированный порядок термов.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### Сопоставление по префиксу и краям фразы {#prefix-and-edge-matching}

Подходит для таких сценариев, как «подсказки при вводе» и «нечёткое сопоставление по префиксу/суффиксу».

#### MATCH_PHRASE_PREFIX {#match_phrase_prefix}

Сопоставление фраз, при котором последнее слово сопоставляется по префиксу. Если задано только одно слово, выполняется сопоставление по префиксу этого слова.

```sql
-- The last word matches by prefix
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- A single word degenerates into a prefix match
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

#### MATCH_PHRASE_EDGE {#match_phrase_edge}

Сопоставление по краям фразы со следующими правилами:

- Первое слово сопоставляется по **суффиксу**
- Для слов в середине требуется **точное совпадение**
- Последнее слово сопоставляется по **префиксу**
- Термы должны идти подряд

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### Сопоставление по регулярному выражению: MATCH_REGEXP {#regex-matching-match_regexp}

Выполняет сопоставление по регулярному выражению для термов, полученных при токенизации.

```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

## Указание анализатора с помощью USING ANALYZER {#specifying-an-analyzer-with-using-analyzer}

Если для одного столбца созданы несколько инвертированных индексов с разными анализаторами, с помощью предложения `USING ANALYZER` можно указать анализатор, который будет использоваться при выполнении запроса.

### Синтаксис {#syntax}

```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

### Поддерживаемые операторы {#supported-operators}

Все операторы MATCH поддерживают предложение `USING ANALYZER`:

- `MATCH` / `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `MATCH_PHRASE_EDGE`
- `MATCH_REGEXP`

### Встроенные анализаторы {#built-in-analyzers}

| Имя | Описание |
|------|------|
| `none` | Точное совпадение без токенизации |
| `standard` | Стандартная токенизация |
| `chinese` | Токенизация китайского текста |

### Примеры использования {#usage-examples}

```sql
-- Use the standard analyzer (tokenizes the text)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- Use the keyword analyzer (exact match, no tokenization)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- Combined with MATCH_PHRASE
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- Use built-in analyzers
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```

### Примечания {#notes}

- Если индекс для указанного анализатора не построен, запрос автоматически выполняется без использования индекса (результаты остаются корректными, но производительность ниже).
- Если анализатор не указан, система использует любой доступный индекс.

## Ускорение запросов с помощью инвертированного индекса {#inverted-index-query-acceleration}

Помимо полнотекстового поиска, инвертированный индекс также ускоряет точную фильтрацию структурированных полей. Поддерживаются следующие операторы и функции:

| Категория | Оператор / функция |
|------|---------------|
| Равенство и принадлежность множеству | `=`, `!=`, `IN`, `NOT IN` |
| Диапазон | `>`, `>=`, `<`, `<=`, `BETWEEN` |
| Проверка на NULL | `IS NULL`, `IS NOT NULL` |
| Массив | `array_contains`, `array_overlaps` |

Примеры использования:

```sql
-- Range query
SELECT * FROM t WHERE price >= 100 AND price < 200;

-- Set query
SELECT * FROM t WHERE tags IN ('a', 'b', 'c');

-- Array query
SELECT * FROM t WHERE array_contains(attributes, 'color');
```
