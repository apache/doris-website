---
{
    "title": "Инвертированный индекс (текстовый поиск)",
    "sidebar_label": "Обзор",
    "language": "ru",
    "description": "Текстовый поиск Doris основан на инвертированных индексах и поддерживает полнотекстовый поиск, сопоставление фраз, сопоставление регулярных выражений, пользовательскую токенизацию и оценку релевантности BM25. Его можно сочетать с векторным поиском в сценариях гибридного извлечения, таких как RAG."
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

Текстовый поиск извлекает из набора данных документы, содержащие определённые термины или фразы, и ранжирует результаты по релевантности.

| Метод извлечения | Преимущество | Сценарии применения |
|----------|------|----------|
| Текстовый поиск | «Находит точно»: управляемое, объяснимое точное сопоставление, обеспечивающее детерминированное совпадение ключевых слов и условий фильтрации | Поиск по ключевым словам, сопоставление фраз, булева фильтрация |
| Векторный поиск | «Находит широко»: использует семантическое сходство для расширения диапазона полноты поиска | Семантический поиск, приблизительное сопоставление |

В приложениях генеративного ИИ, особенно в сценариях retrieval-augmented generation (RAG), текстовый и векторный поиск дополняют друг друга:

- Сочетают семантическую широту с лексической точностью
- Повышают полноту поиска, сохраняя точность и объяснимость результатов
- Вместе создают надёжную основу извлечения, предоставляющую большим языковым моделям более точный и релевантный контекст

:::caution Создание инвертированных индексов V1 запрещено начиная с 4.1.5

Для новых индексов используйте V2 или V3. Существующие таблицы V1 остаются доступными для чтения, но добавлять инвертированные индексы или обновлять формат хранения индекса на месте с помощью `ALTER TABLE` нельзя; вместо этого перестройте таблицу. FE не сможет запуститься после обновления, если его эффективная конфигурация `inverted_index_storage_format` по-прежнему имеет значение `V1`. Заранее обновите `fe.conf` и `fe_custom.conf`. См. раздел [Обновление до 4.1.5](../../../admin-manual/cluster-management/upgrade.md).

:::

## Эволюция текстового поиска в Doris {#evolution-of-text-search-in-doris}

Начиная с версии 2.0.0 Doris внедрил инвертированный индекс для поддержки высокопроизводительного полнотекстового поиска. По мере разнообразия сценариев извлечения и роста сложности запросов Doris продолжал расширять возможности текстового поиска в последующих выпусках.

| Этап | Версия | Ключевые возможности |
|------|------|----------|
| Этап основы | 2.0+ | Внедрены инвертированные индексы на уровне столбцов; добавлены базовые операторы полнотекстового поиска (`MATCH_ANY`, `MATCH_ALL`) и многоязычные токенизаторы, обеспечивающие эффективный поиск по ключевым словам в крупномасштабных наборах данных |
| Расширение функций | 2.x to 3.x | Расширена система операторов, добавлены такие расширенные операторы, как сопоставление фраз (`MATCH_PHRASE`), поиск по префиксу (`MATCH_PHRASE_PREFIX`) и сопоставление регулярных выражений (`MATCH_REGEXP`); в версии 3.1 появилась пользовательская токенизация |
| Расширение возможностей | 4.0+ | Внедрены оценка релевантности BM25 и унифицированная точка входа для запросов — функция `SEARCH`, поддерживающая ранжирование по релевантности текста и гибридное ранжирование |

Ключевые улучшения версий 4.0+ включают:

- **Оценка релевантности BM25**: функция `score()` ранжирует результаты по релевантности текста и может объединяться с оценками векторного сходства для гибридного ранжирования.
- **Функция SEARCH**: предоставляет унифицированный DSL запросов, поддерживает запросы по нескольким столбцам и комбинации булевой логики, упрощая построение сложных запросов и дополнительно повышая производительность запросов.

---

## Основные возможности текстового поиска в Doris {#core-text-search-features-in-doris}

### 1. Богатый набор текстовых операторов {#1-rich-text-operators}

Doris предоставляет набор операторов полнотекстового поиска, охватывающих различные шаблоны извлечения и удовлетворяющих потребностям от базового сопоставления ключевых слов до сложных запросов фраз.

Основные операторы, поддерживаемые текущей версией:

| Оператор | Описание | Типичные сценарии |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | Сопоставление любого термина (OR) и сопоставление всех терминов (AND) | Обычный поиск по ключевым словам |
| `MATCH_PHRASE` | Точное сопоставление фразы с поддержкой пользовательского расстояния между словами (slop) и управления порядком | Запросы близости слов |
| `MATCH_PHRASE_PREFIX` | Сопоставление префикса фразы | Автодополнение, инкрементальный поиск |
| `MATCH_REGEXP` | Сопоставление на основе регулярных выражений | Извлечение текста по шаблону |

Эти операторы можно использовать независимо или объединять с помощью функции `SEARCH()` для построения сложных логических запросов. Например:

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[Просмотреть все операторы](./search-operators.md)

---

### 2. Пользовательская токенизация (3.1+) {#2-custom-tokenization-31}

В текстовом поиске способ токенизации напрямую определяет точность и полноту извлечения. Начиная с версии 3.1 Doris поддерживает **пользовательские анализаторы**, позволяя гибко определять конвейер токенизации с учётом потребностей бизнеса.

Пользовательская токенизация обеспечивает детальный контроль над текстом за счёт объединения следующих трёх типов компонентов:

- **Фильтр символов (char_filter)**: заменяет, удаляет или нормализует символы до токенизации
- **Токенизатор (tokenizer)**: выбирает алгоритм токенизации. Поддерживаются такие типы, как `standard`, `ngram`, `edge_ngram`, `keyword` и `icu`, для обработки текста на разных языках и текстовых структур
- **Фильтр токенов (token_filter)**: например, `lowercase`, `word_delimiter` и `ascii_folding`, используемые для нормализации и уточнения результатов токенизации

```sql
-- Example: Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

-- Use the custom analyzer when creating a table
CREATE TABLE docs (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "analyzer" = "keyword_lowercase",
        "support_phrase" = "true"
    )
);
```

[Подробнее о пользовательской токенизации](./custom-analyzer.md)

---

### 3. Оценка релевантности BM25 (4.0+) {#3-bm25-relevance-scoring-40}

Doris реализует алгоритм **BM25 (Best Matching 25)** для вычисления релевантности текста, предоставляя возможности ранжирования и оценки для полнотекстового поиска.

Основные характеристики BM25:

- Вероятностная модель, основанная на частоте термина (TF), обратной частоте документа (IDF) и длине документа
- Устойчива как к коротким, так и к длинным текстам
- Стратегию взвешивания можно настраивать с помощью параметров `k1` и `b`

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[Подробнее о механизме оценки](./scoring.md)

---

### 4. Функция SEARCH: унифицированная точка входа для запросов (4.0+) {#4-search-function-unified-query-entry-point-40}

Функция `SEARCH()` предоставляет унифицированную синтаксическую точку входа для текстового извлечения, поддерживает поиск по нескольким столбцам и комбинации булевой логики, делая сложные запросы более краткими:

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[Полное руководство по функции SEARCH](./search-function.md)

---

## Быстрый старт {#quick-start}

### Шаг 1. Создайте таблицу с инвертированными индексами {#step-1-create-a-table-with-inverted-indexes}

```sql
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    category STRING,
    tags ARRAY<STRING>,
    created_at DATETIME,
    -- Text search indexes
    INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "chinese"),
    INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "chinese", "support_phrase" = "true"),
    INDEX idx_category(category) USING INVERTED,
    INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### Шаг 2. Выполните текстовые запросы {#step-2-run-text-queries}

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full-text search';

-- Boolean query with SEARCH
SELECT * FROM docs
WHERE SEARCH('title:apache AND (category:database OR tags:ANY(sql nosql))');

-- Relevance-based ranking
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time analytics OLAP'
ORDER BY relevance DESC
LIMIT 10;
```

## Гибридный поиск: текст + вектор {#hybrid-search-text--vector}

В приложениях RAG сочетание текстового поиска с векторным сходством обеспечивает более комплексное извлечение:

```sql
-- Hybrid retrieval: semantic similarity + keyword filtering
SELECT id, title, score() AS text_relevance
FROM docs
WHERE
    -- Vector filter for semantic similarity
    cosine_distance(embedding, [0.1, 0.2, ...]) < 0.3
    -- Text filter for keyword constraints
    AND SEARCH('title:search AND content:engine AND category:technology')
ORDER BY text_relevance DESC
LIMIT 10;
```

## Управление инвертированными индексами {#managing-inverted-indexes}

### Создание индекса {#create-an-index}

```sql
-- Create at table creation time
CREATE TABLE t (
    content STRING,
    INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "chinese")
);

-- Create on an existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Compute-storage integrated mode: build the index for existing data
BUILD INDEX idx_content ON docs;
```

#### Существующие данные в режиме разделения вычислений и хранения {#cloud-index-build}

В Doris 4.1.5 добавление токенизированного инвертированного индекса, например индекса с `parser="chinese"` выше, строит исторические данные с помощью задания изменения схемы. Дождитесь состояния `FINISHED`; отдельная команда `BUILD INDEX` для этого индекса не требуется:

```sql
SHOW ALTER TABLE COLUMN WHERE TableName = 'docs';
```

Для нетокенизированных инвертированных индексов (`parser="none"`) и индексов NGram BloomFilter значение `enable_add_index_for_new_data=false` по умолчанию также приводит к построению исторических данных посредством изменения схемы. Установите его в `true`, если хотите сначала добавить индекс для новых данных, а исторические данные заполнить отдельно. Выполните следующий пример в сеансе с доступной вычислительной группой:

```sql
CREATE TABLE cloud_index_example (
    id INT,
    tag VARCHAR(64)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO cloud_index_example VALUES (1, 'doris'), (2, 'database');
SET enable_add_index_for_new_data = true;
CREATE INDEX idx_tag ON cloud_index_example(tag)
USING INVERTED PROPERTIES("parser" = "none");
BUILD INDEX ON cloud_index_example;
SHOW BUILD INDEX WHERE TableName = 'cloud_index_example';
```

Построение выполняется асинхронно. Дождитесь, пока `SHOW BUILD INDEX` сообщит `FINISHED`, прежде чем ожидать, что исторические строки будут использовать индекс. В облачном синтаксисе имя индекса не указывается: команда `BUILD INDEX idx_tag ON cloud_index_example` отклоняется. Эти инструкции для Doris 4.1.5 описывают существующие форматы индексов этой версии, а не отдельный путь построения SNII в более новых ядрах.

### Удаление индекса {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### Просмотр индексов {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## Часто задаваемые вопросы {#inverted-index-faq}

### Поддерживает ли Doris 4.1.5 токенизацию японского языка и исправление опечаток? {#does-doris-415-support-japanese-tokenization-and-typo-tolerance}

Doris 4.1.5 не поддерживает встроенный токенизатор Kuromoji. Оцените анализатор `icu` или `unicode` на репрезентативном японском тексте и проверьте его вывод с помощью `TOKENIZE()`; их сегментация отличается от морфологического анализа Kuromoji. Перед выбором более нового анализатора сверьтесь с документацией точно развёрнутого выпуска.

[Операторы поиска](./search-operators.md) поддерживают сопоставление по префиксу, регулярным выражениям и фразам с параметром slop. Они не выполняют исправление написания на основе расстояния редактирования: ошибочно написанный термин автоматически не расширяется до близких терминов словаря.

## Дополнительные материалы {#further-reading}

### Основная документация {#core-documentation}

- [Операторы текстового поиска](./search-operators.md): полный справочник операторов и ускорение запросов
- [Функция SEARCH](./search-function.md): унифицированный синтаксис DSL запросов и примеры
- [Оценка релевантности](./scoring.md): алгоритм ранжирования по релевантности и его использование

### Расширенные темы {#advanced-topics}

- [Пользовательский анализатор](./custom-analyzer.md): создание токенизаторов и фильтров для конкретной предметной области
- [Векторный поиск](../vector-index/overview.md): использование векторных представлений для поиска семантического сходства
