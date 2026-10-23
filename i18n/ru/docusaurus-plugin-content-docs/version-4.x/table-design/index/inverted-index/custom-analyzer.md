---
{
    "title": "Пользовательский анализатор",
    "language": "ru",
    "description": "Пользовательские анализаторы Doris объединяют фильтры символов, токенизаторы и фильтры токенов для гибкого управления стратегиями сегментации текста, повышая релевантность и точность поиска по инвертированным индексам.",
    "keywords": [
        "пользовательский анализатор",
        "токенизатор инвертированного индекса",
        "tokenizer",
        "token_filter",
        "char_filter",
        "edge_ngram",
        "word_delimiter",
        "USING ANALYZER",
        "индекс с несколькими анализаторами",
        "ik_smart",
        "ik_max_word",
        "max_ngram_diff"
    ]
}
---

<!-- Knowledge type: Feature overview + Configuration parameters + Operating procedures -->
<!-- Applicable scenarios: Inverted index text tokenization customization / Multilingual search / Auto-completion / Exact match -->

Пользовательский анализатор объединяет **фильтр символов (char_filter)**, **токенизатор** и **фильтр токенов (token_filter)**, позволяя точно определить, как текст разбивается на поисковые термы в соответствии с бизнес-задачами. Он позволяет преодолеть ограничения встроенных анализаторов и напрямую влияет на релевантность поиска и точность анализа данных.

![Схема пользовательского анализатора](/images/analyzer.png)

### Сценарии применения {#applicable-scenarios}

| Сценарий | Рекомендуемая комбинация |
| --- | --- |
| Поиск по тексту на нескольких языках | Токенизатор `icu` + фильтр `icu_normalizer` |
| Поиск по префиксу телефонного номера или кода | Токенизатор `edge_ngram` |
| Разбиение сложного английского текста (camelCase, дефисы и т. д.) | Токенизатор `standard` + фильтр `word_delimiter` |
| Автодополнение / подсказки при вводе | Токенизатор `edge_ngram` + фильтр `lowercase` |
| Точное совпадение (сохранение исходного терма) | Токенизатор `keyword` + фильтр `lowercase` / `asciifolding` |

---

## Основные компоненты {#core-components}

Пользовательский анализатор состоит из объектов четырёх типов, которые последовательно применяются к исходному тексту:

```
Original text ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► Terms
```

| Компонент | Назначение | Количество |
| --- | --- | --- |
| `char_filter` | Предварительная обработка символов перед токенизацией (например, замена и нормализация) | 0 ~ N |
| `tokenizer` | Разбиение текста на термы | 1 |
| `token_filter` | Обработка полученных термов (например, приведение к нижнему регистру или преобразование символов в ASCII) | 0 ~ N |
| `analyzer` | Объединение перечисленных компонентов в полный конвейер токенизации | 1 |

---

## Создание пользовательского анализатора {#creating-a-custom-analyzer}

### 1. Фильтр символов (char_filter) {#1-character-filter-char_filter}

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
    "type" = "char_replace"
    -- See below for other parameters
);
```

Поддерживаемые типы фильтров символов:

- **`char_replace`**: заменяет указанные символы целевыми символами перед токенизацией.
    - `char_filter_pattern`: список символов для замены
    - `char_filter_replacement`: символ замены (по умолчанию: пробел)

- **`icu_normalizer`**: предварительно обрабатывает текст с помощью нормализации ICU.
    - `name`: форма нормализации (по умолчанию `nfkc_cf`). Варианты: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
    - `mode`: режим нормализации (по умолчанию `compose`). Варианты: `compose`, `decompose`
    - `unicode_set_filter`: задаёт набор символов для нормализации (например, `[a-z]`)

### 2. Токенизатор {#2-tokenizer}

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
    "type" = "standard"
);
```

Поддерживаемые типы токенизаторов:

| Тип | Описание | Основные параметры |
| --- | --- | --- |
| `standard` | Стандартная токенизация (по правилам сегментации текста Unicode), подходит для большинства языков | Нет |
| `ngram` | Разбивает текст на N-граммы | `min_gram`, `max_gram`, `max_ngram_diff`, `token_chars` |
| `edge_ngram` | Генерирует N-граммы с начала слова | `min_gram`, `max_gram`, `token_chars` |
| `keyword` | Выдаёт весь текст как один терм, часто используется вместе с token_filter | Нет |
| `char_group` | Разбивает текст по заданным символам | `tokenize_on_chars` |
| `basic` | Простая токенизация английского текста, цифр, китайского текста и Unicode | `extra_chars` |
| `icu` | Многоязычная токенизация ICU с поддержкой сложных систем письма | Нет |
| `ik_smart` | Умная токенизация китайского текста IK с предпочтением целых слов; доступна для пользовательских анализаторов начиная с 4.1.5 | Нет |
| `ik_max_word` | Детальная токенизация китайского текста IK, формирующая больше потенциально перекрывающихся термов; доступна для пользовательских анализаторов начиная с 4.1.5 | Нет |

Описание параметров:

- `min_gram`: минимальная длина (по умолчанию 1)
- `max_gram`: максимальная длина (по умолчанию 2)
- `token_chars`: категории символов, которые нужно сохранять (по умолчанию: сохранять все). Варианты: `letter`, `digit`, `whitespace`, `punctuation`, `symbol`
- `tokenize_on_chars`: список символов или категория. Поддерживаемые категории: `whitespace`, `letter`, `digit`, `punctuation`, `symbol`, `cjk`
- `extra_chars`: дополнительные символы ASCII, по которым выполняется разбиение (например, `[]().`)

#### Ограничения диапазона N-грамм (начиная с 4.1.5) {#ngram-range-limits-since-415}

Начиная с 4.1.5 токенизатор `ngram` поддерживает параметр `max_ngram_diff`, позволяющий увеличить прежнее ограничение разницы между максимальной и минимальной длиной граммы, равное `1`. При создании проверяются следующие условия:

| Параметр | Значение по умолчанию | Ограничения |
| --- | --- | --- |
| `min_gram` | `1` | Положительное целое число, не превышающее `max_gram`; не более `1024` для нового токенизатора `ngram`. |
| `max_gram` | `2` | Положительное целое число, не меньшее `min_gram`; не более `1024` для нового токенизатора `ngram`. |
| `max_ngram_diff` | `1` | Целое число от `0` до `255`; должно выполняться условие `max_gram - min_gram <= max_ngram_diff`. Значение `0` допускает только N-граммы фиксированной длины. |

Например, при `min_gram=1` и `max_gram=8` значение `max_ngram_diff` должно быть не меньше `7`. Если его не указать, создание завершится ошибкой `The difference between max_gram and min_gram in NGram Tokenizer must be less than or equal to: [ 1 ] but was [7]`. Полный пример использования см. в [примере 5](#example-5-expand-the-ngram-length-range-since-415).

Эти ограничения и параметр `max_ngram_diff` применяются только к `ngram`. Токенизатор `edge_ngram` не принимает этот параметр; в примерах поиска по телефонному номеру и автодополнения сохраняются собственные настройки `min_gram` и `max_gram`. Чем шире диапазон, тем больше термов создаётся для каждой позиции во входном тексте. Выбирайте диапазон в соответствии с требованиями к поиску, чтобы избежать ненужного увеличения индекса.

### 3. Фильтр токенов {#3-token-filter}

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
    "type" = "word_delimiter"
);
```

Поддерживаемые типы фильтров токенов:

| Тип | Назначение |
| --- | --- |
| `word_delimiter` | Разбивает текст по символам, не являющимся буквами или цифрами, и может выполнять нормализацию |
| `ascii_folding` | Преобразует символы вне ASCII в их эквиваленты ASCII |
| `lowercase` | Приводит текст токена к нижнему регистру |
| `icu_normalizer` | Обрабатывает токены с помощью нормализации ICU |

#### Особенности word_delimiter {#word_delimiter-details}

Поведение по умолчанию:

1. Использует символы, не являющиеся буквами или цифрами, в качестве разделителей (например: `Super-Duper` преобразуется в `Super`, `Duper`)
2. Удаляет разделители в начале и конце токена (например: `XL---42+'Autocoder'` преобразуется в `XL`, `42`, `Autocoder`)
3. Разбивает текст при смене регистра (например: `PowerShot` преобразуется в `Power`, `Shot`)
4. Разбивает текст на границе между буквами и цифрами (например: `XL500` преобразуется в `XL`, `500`)
5. Удаляет показатель притяжательной формы английского языка `'s` (например: `Neil's` преобразуется в `Neil`)

Необязательные параметры:

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `generate_number_parts` | `true` | Выводить ли числовые части |
| `generate_word_parts` | `true` | Выводить ли словесные части |
| `protected_words` | Нет | Защищённые слова, которые не разбиваются |
| `split_on_case_change` | `true` | Разбивать ли текст при смене регистра |
| `split_on_numerics` | `true` | Разбивать ли текст на границе между буквами и цифрами |
| `stem_english_possessive` | `true` | Удалять ли показатель притяжательной формы английского языка `'s` |
| `type_table` | Нет | Пользовательская таблица сопоставления типов символов |

`type_table` поддерживает следующие типы сопоставления:

- `ALPHA` (буква)
- `ALPHANUM` (буква или цифра)
- `DIGIT` (цифра)
- `LOWER` (строчная буква)
- `SUBWORD_DELIM` (разделитель, не являющийся буквой или цифрой)
- `UPPER` (прописная буква)

Пример: `["+ => ALPHA", "- => ALPHA"]` трактует `+` и `-` как буквы, поэтому по ним не выполняется разбиение.

#### Параметры icu_normalizer {#icu_normalizer-parameters}

- `name`: форма нормализации (по умолчанию `nfkc_cf`). Варианты: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
- `unicode_set_filter`: задаёт набор символов для нормализации

### 4. Анализатор {#4-analyzer}

Объединяет перечисленные компоненты в полный конвейер токенизации:

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
    "tokenizer" = "x_tokenizer",            -- A single tokenizer
    "token_filter" = "x_filter1, x_filter2" -- One or more token_filters, executed in order
);
```

---

## Использование пользовательского анализатора в таблице {#using-a-custom-analyzer-in-a-table}

Укажите созданный пользовательский анализатор в поле `analyzer` свойств индекса `PROPERTIES`:

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

Примечания:

1. Пользовательский анализатор задаётся в свойствах индекса `PROPERTIES` через `analyzer`.
2. Единственное свойство, которое можно использовать вместе с `analyzer`, это `support_phrase`.

---

## Несколько индексов с разными анализаторами для одного столбца {#multiple-analyzer-indexes-on-a-single-column}

Doris поддерживает создание нескольких инвертированных индексов с разными токенизаторами для одного столбца, что позволяет искать одни и те же данные с разными стратегиями токенизации.

### Сценарии использования {#use-cases}

- **Поддержка нескольких языков**: используйте токенизаторы для разных языков в одном текстовом столбце.
- **Баланс между точностью и полнотой поиска**: используйте токенизатор keyword для точного совпадения и токенизатор standard для нечёткого поиска.
- **Автодополнение**: используйте токенизатор edge_ngram для поиска по префиксу и токенизатор standard для обычного поиска.

### Создание нескольких индексов {#creating-multiple-indexes}

```sql
-- 1. Create tokenizers with different tokenization strategies
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS std_analyzer
PROPERTIES ("tokenizer" = "standard", "token_filter" = "lowercase");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS kw_analyzer
PROPERTIES ("tokenizer" = "keyword", "token_filter" = "lowercase");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_tokenizer
PROPERTIES (
    "type" = "edge_ngram",
    "min_gram" = "1",
    "max_gram" = "20",
    "token_chars" = "letter"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS ngram_analyzer
PROPERTIES ("tokenizer" = "edge_ngram_tokenizer", "token_filter" = "lowercase");

-- 2. Create multiple indexes on the same column
CREATE TABLE articles (
    id INT,
    content TEXT,
    -- Standard tokenizer for tokenized search
    INDEX idx_content_std (content) USING INVERTED
        PROPERTIES("analyzer" = "std_analyzer", "support_phrase" = "true"),
    -- Keyword tokenizer for exact matching
    INDEX idx_content_kw (content) USING INVERTED
        PROPERTIES("analyzer" = "kw_analyzer"),
    -- edge n-gram tokenizer for auto-completion
    INDEX idx_content_ngram (content) USING INVERTED
        PROPERTIES("analyzer" = "ngram_analyzer")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");
```

### Указание анализатора при выполнении запроса {#specifying-an-analyzer-at-query-time}

Используйте предложение `USING ANALYZER`, чтобы указать, какой индекс использовать:

```sql
-- Insert test data
INSERT INTO articles VALUES
    (1, 'hello world'),
    (2, 'hello'),
    (3, 'world'),
    (4, 'hello world test');

-- Tokenized search: matches rows containing the term 'hello'
-- Returns: 1, 2, 4
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER std_analyzer ORDER BY id;

-- Exact match: matches only the exact 'hello' string
-- Returns: 2
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER kw_analyzer ORDER BY id;

-- Use edge n-gram for prefix matching
-- Returns: 1, 2, 4 (all rows starting with 'hel')
SELECT id FROM articles WHERE content MATCH 'hel' USING ANALYZER ngram_analyzer ORDER BY id;
```

Также можно напрямую использовать встроенные токенизаторы:

```sql
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
SELECT * FROM articles WHERE content MATCH 'Hello' USING ANALYZER chinese;
```

### Добавление индекса в существующую таблицу {#adding-an-index-to-an-existing-table}

```sql
-- Add a new index that uses a different tokenizer
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- Wait for the schema change to complete
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```

### Построение индекса {#building-an-index}

После добавления индекса необходимо построить его для существующих данных:

```sql
-- Build a specific index (non-cloud mode)
BUILD INDEX idx_content_chinese ON articles;

-- Build all indexes (cloud mode)
BUILD INDEX ON articles;

-- Check the build progress
SHOW BUILD INDEX WHERE TableName='articles';
```

### Важные замечания {#key-notes}

1. **Идентичность токенизаторов**: два токенизатора с одинаковой конфигурацией `tokenizer` и `token_filter` считаются идентичными. Нельзя создать несколько индексов для одного столбца с идентичными токенизаторами.
2. **Выбор индекса**:
    - Если указано `USING ANALYZER`, используется индекс для указанного токенизатора, если он существует и построен.
    - Если индекс не построен, запрос выполняется без индекса (результаты корректны, но производительность ниже).
    - Если `USING ANALYZER` не указано, может использоваться любой доступный индекс.
3. **Производительность**:
    - Каждый дополнительный индекс увеличивает объём хранилища и накладные расходы на запись.
    - Выбирайте токенизаторы с учётом реальных запросов.
    - Если характер запросов предсказуем, рассмотрите возможность сократить количество индексов.

---

## Управление и обслуживание {#management-and-maintenance}

### Просмотр {#view}

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### Удаление {#delete}

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

---

## Полные примеры {#complete-examples}

### Пример 1: Поиск по префиксу телефонного номера {#example-1-phone-number-prefix-matching}

Используйте `edge_ngram` для создания всех префиксных фрагментов телефонного номера, чтобы выполнять поиск по мере ввода.

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_phone_number_tokenizer
PROPERTIES
(
    "type" = "edge_ngram",
    "min_gram" = "3",
    "max_gram" = "10",
    "token_chars" = "digit"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS edge_ngram_phone_number
PROPERTIES
(
    "tokenizer" = "edge_ngram_phone_number_tokenizer"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "edge_ngram_phone_number")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

SELECT tokenize('13891972631', '"analyzer"="edge_ngram_phone_number"');
```

Результат:

```json
[
    {"token":"138"},
    {"token":"1389"},
    {"token":"13891"},
    {"token":"138919"},
    {"token":"1389197"},
    {"token":"13891972"},
    {"token":"138919726"},
    {"token":"1389197263"}
]
```

### Пример 2: Детальная токенизация сложного английского текста {#example-2-fine-grained-tokenization-for-complex-english-text}

Используйте токенизатор `standard` вместе с `word_delimiter` для более детальной токенизации, а также нормализацию регистра и преобразование символов в ASCII.

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS word_splitter
PROPERTIES
(
    "type" = "word_delimiter",
    "split_on_numerics" = "false",
    "split_on_case_change" = "false"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS lowercase_delimited
PROPERTIES
(
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, word_splitter, lowercase"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "lowercase_delimited")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

SELECT tokenize('The server at IP 192.168.1.15 sent a confirmation to user_123@example.com, requiring a quickResponse before the deadline.', '"analyzer"="lowercase_delimited"');
```

Результат:

```json
[
    {"token":"the"},
    {"token":"server"},
    {"token":"at"},
    {"token":"ip"},
    {"token":"192"},
    {"token":"168"},
    {"token":"1"},
    {"token":"15"},
    {"token":"sent"},
    {"token":"a"},
    {"token":"confirmation"},
    {"token":"to"},
    {"token":"user"},
    {"token":"123"},
    {"token":"example"},
    {"token":"com"},
    {"token":"requiring"},
    {"token":"a"},
    {"token":"quickresponse"},
    {"token":"before"},
    {"token":"the"},
    {"token":"deadline"}
]
```

### Пример 3: Точное совпадение с сохранением исходного терма {#example-3-exact-match-with-original-term-preserved}

Используйте токенизатор `keyword`, чтобы сохранить весь текст целиком, затем примените `lowercase` и `asciifolding` для нормализации. Этот подход часто используется для точного сопоставления строк без учёта регистра.

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES
(
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "keyword_lowercase")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

SELECT tokenize('hÉllo World', '"analyzer"="keyword_lowercase"');
```

Результат:

```json
[
    {"token":"hello world"}
]
```

### Пример 4: Умная и детальная токенизация китайского текста IK (начиная с 4.1.5) {#example-4-ik-smart-and-fine-grained-chinese-tokenization-since-415}

Начиная с 4.1.5 пользовательские анализаторы могут напрямую ссылаться на встроенные токенизаторы `ik_smart` и `ik_max_word` или использовать именованный токенизатор с соответствующим значением `type`, а затем объединять его с фильтрами символов и токенов. Ни один из токенизаторов IK не имеет дополнительных параметров токенизатора. Оба используют словари из каталога `ik`, расположенного по пути, заданному параметром конфигурации BE `inverted_index_dict_path`. Все BE, участвующие в токенизации и построении индекса, должны поддерживать эти компоненты и иметь доступ к словарям для чтения.

В приведённых ниже примерах показаны прямые ссылки и именованные токенизаторы. Для создания этих компонентов требуется глобальная привилегия `ADMIN`. Для создания таблиц, загрузки данных и выполнения запросов также требуются соответствующие привилегии на целевую базу данных и таблицы.

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_smart
PROPERTIES ("tokenizer" = "ik_smart");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS cn_ik_max_tokenizer
PROPERTIES ("type" = "ik_max_word");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_max
PROPERTIES ("tokenizer" = "cn_ik_max_tokenizer");
```

При успешном создании возвращается `Query OK`. После синхронизации компонентов с BE сравните их вывод с помощью `TOKENIZE`. Следующие результаты получены со встроенными словарями; изменение словарей может изменить набор токенов.

```sql
SELECT TOKENIZE('中华人民共和国', '"analyzer"="cn_ik_smart"');
```

```json
[{"token":"中华人民共和国"}]
```

```sql
SELECT TOKENIZE('中华人民共和国', '"analyzer"="cn_ik_max"');
```

```json
[
    {"token":"中华人民共和国"},
    {"token":"中华人民"},
    {"token":"中华"},
    {"token":"华人"},
    {"token":"人民共和国"},
    {"token":"人民"},
    {"token":"共和国"},
    {"token":"共和"},
    {"token":"国"}
]
```

Используйте анализатор в инвертированном индексе таблицы:

```sql
CREATE TABLE ik_articles (
    id INT,
    content STRING,
    INDEX idx_content(content) USING INVERTED
        PROPERTIES("analyzer" = "cn_ik_smart")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");

INSERT INTO ik_articles VALUES (1, '中华人民共和国');

SELECT id FROM ik_articles
WHERE content MATCH '中华人民共和国' USING ANALYZER cn_ik_smart
ORDER BY id;
```

```text
+----+
| id |
+----+
|  1 |
+----+
```

Используйте `ik_smart`, когда при поиске нужно сохранять целые китайские слова, и `ik_max_word`, когда требуется больше совпадений по частям слов. Если нужна дополнительная обработка токенов, добавьте фильтры токенов через свойство анализатора `token_filter`.

### Пример 5: Расширение диапазона длин N-грамм (начиная с 4.1.5) {#example-5-expand-the-ngram-length-range-since-415}

Этот токенизатор генерирует N-граммы длиной от `1` до `8` благодаря явно заданному параметру `max_ngram_diff=7`:

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS ngram_1_8_tokenizer
PROPERTIES (
    "type" = "ngram",
    "min_gram" = "1",
    "max_gram" = "8",
    "max_ngram_diff" = "7"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS ngram_1_8_analyzer
PROPERTIES ("tokenizer" = "ngram_1_8_tokenizer");
```

После успешного создания и синхронизации с BE выполните:

```sql
SELECT TOKENIZE('abcdefgh', '"analyzer"="ngram_1_8_analyzer"');
```

```json
[
    {"token":"a"}, {"token":"ab"}, {"token":"abc"}, {"token":"abcd"},
    {"token":"abcde"}, {"token":"abcdef"}, {"token":"abcdefg"}, {"token":"abcdefgh"},
    {"token":"b"}, {"token":"bc"}, {"token":"bcd"}, {"token":"bcde"},
    {"token":"bcdef"}, {"token":"bcdefg"}, {"token":"bcdefgh"},
    {"token":"c"}, {"token":"cd"}, {"token":"cde"}, {"token":"cdef"},
    {"token":"cdefg"}, {"token":"cdefgh"},
    {"token":"d"}, {"token":"de"}, {"token":"def"}, {"token":"defg"}, {"token":"defgh"},
    {"token":"e"}, {"token":"ef"}, {"token":"efg"}, {"token":"efgh"},
    {"token":"f"}, {"token":"fg"}, {"token":"fgh"},
    {"token":"g"}, {"token":"gh"}, {"token":"h"}
]
```


---

## Ограничения {#limitations}

1. Значение `type` и параметры в `tokenizer` и `token_filter` могут указывать только на поддерживаемые в данный момент токенизаторы и фильтры токенов; в противном случае создание таблицы завершается ошибкой.
2. Удалить `analyzer` можно только в том случае, если он не используется ни одной таблицей.
3. Удалить `tokenizer` или `token_filter` можно только в том случае, если он не используется ни одним `analyzer`.
4. DDL пользовательского анализатора синхронизируется с BE через 10 секунд после выполнения; последующие операции импорта не вызывают ошибок.

---

## Примечания {#notes}

1. Включение нескольких компонентов в пользовательский `analyzer` может снизить производительность токенизации.
2. Функция токенизации `select tokenize` поддерживает пользовательские анализаторы и может использоваться для отладки результатов токенизации.
3. В одном индексе может использоваться только один из вариантов: предопределённый `built_in_analyzer` или пользовательский `analyzer`.
