---
{
    "title": "Инвертированный индекс (текстовый поиск)",
    "sidebar_label": "Обзор",
    "language": "ru",
    "description": "Текстовый поиск в Doris основан на инвертированных индексах и поддерживает полнотекстовый поиск, сопоставление фраз, сопоставление по регулярным выражениям, пользовательскую токенизацию и оценку релевантности BM25. Его можно сочетать с векторным поиском для гибридного поиска в таких сценариях, как RAG."
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

Текстовый поиск находит в наборе данных документы, содержащие заданные термины или фразы, и ранжирует результаты по релевантности.

| Метод поиска | Преимущество | Сценарии применения |
|----------|------|----------|
| Текстовый поиск | «Найти точно»: управляемое и объяснимое точное сопоставление, обеспечивающее предсказуемое нахождение ключевых слов и соблюдение условий фильтрации | Поиск по ключевым словам, сопоставление фраз, булева фильтрация |
| Векторный поиск | «Искать шире»: использует семантическое сходство для расширения охвата поиска | Семантический поиск, приближённое сопоставление |

В приложениях на основе генеративного ИИ, особенно в сценариях генерации с дополнением на основе поиска (RAG), текстовый и векторный поиск дополняют друг друга:

- Сочетают семантический охват с лексической точностью
- Повышают полноту поиска, обеспечивая точность и объяснимость результатов
- Вместе создают надёжную основу поиска, предоставляя большим языковым моделям более точный и релевантный контекст

:::caution Создание инвертированных индексов V1 запрещено начиная с версии 4.1.5

Для новых индексов используйте V2 или V3. Существующие таблицы V1 по-прежнему доступны для чтения, но добавлять инвертированные индексы или обновлять формат хранения индекса на месте с помощью `ALTER TABLE` нельзя; вместо этого пересоздайте таблицу. После обновления FE не сможет запуститься, если фактическое значение его параметра `inverted_index_storage_format` останется `V1`. Заранее обновите `fe.conf` и `fe_custom.conf`. См. [Обновление до 4.1.5](../../../admin-manual/cluster-management/upgrade.md).

:::

## Развитие текстового поиска в Doris {#evolution-of-text-search-in-doris}

В версии 2.0.0 в Doris появился инвертированный индекс для высокопроизводительного полнотекстового поиска. По мере расширения сценариев поиска и усложнения запросов Doris продолжал развивать возможности текстового поиска в последующих выпусках.

| Этап | Версия | Основные возможности |
|------|------|----------|
| Базовый этап | 2.0+ | Добавлены инвертированные индексы на уровне столбцов, базовые операторы полнотекстового поиска (`MATCH_ANY`, `MATCH_ALL`) и токенизаторы для разных языков, обеспечивающие эффективный поиск по ключевым словам в больших наборах данных |
| Расширение функциональности | от 2.x до 3.x | Расширен набор операторов: добавлены сопоставление фраз (`MATCH_PHRASE`), префиксный поиск (`MATCH_PHRASE_PREFIX`) и сопоставление по регулярным выражениям (`MATCH_REGEXP`); в версии 3.1 появилась пользовательская токенизация |
| Развитие возможностей | 4.0+ | Добавлены оценка релевантности BM25 и функция `SEARCH` как единая точка входа для запросов, обеспечивающие ранжирование по релевантности текста и гибридное ранжирование |

Основные улучшения в 4.0+:

- **Оценка релевантности BM25**: функция `score()` ранжирует результаты по релевантности текста; её оценки можно сочетать с оценками векторного сходства для гибридного ранжирования.
- **Функция SEARCH**: предоставляет единый DSL для запросов с поддержкой поиска по нескольким столбцам и сочетаний булевых условий, упрощая построение сложных запросов и дополнительно повышая их производительность.

---

## Основные возможности текстового поиска в Doris {#core-text-search-features-in-doris}

### 1. Широкий набор операторов текстового поиска {#1-rich-text-operators}

Doris предоставляет набор операторов полнотекстового поиска, охватывающих различные способы поиска: от простого сопоставления ключевых слов до сложных запросов по фразам.

Основные операторы, поддерживаемые в текущей версии:

| Оператор | Описание | Типичные сценарии |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | Совпадение с любым термином (OR) и со всеми терминами (AND) | Обычный поиск по ключевым словам |
| `MATCH_PHRASE` | Точное сопоставление фразы с возможностью настроить slop и порядок слов | Поиск слов с учётом расстояния между ними |
| `MATCH_PHRASE_PREFIX` | Сопоставление по префиксу фразы | Автодополнение, поиск по мере ввода |
| `MATCH_REGEXP` | Сопоставление на основе регулярных выражений | Поиск текста по шаблону |

Эти операторы можно использовать отдельно или объединять с помощью функции `SEARCH()` для построения сложных логических запросов. Например (здесь используется таблица `docs`, созданная в разделе [Быстрый старт](#quick-start) ниже):

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[Все операторы](./search-operators.md)

---

### 2. Пользовательская токенизация (3.1+) {#2-custom-tokenization-31}

В текстовом поиске способ токенизации напрямую определяет точность и полноту поиска. Начиная с версии 3.1 Doris поддерживает **пользовательские анализаторы**, позволяющие гибко настраивать конвейер токенизации под задачи бизнеса.

Пользовательская токенизация позволяет детально управлять обработкой текста, комбинируя компоненты следующих трёх типов:

- **Символьный фильтр (char_filter)**: заменяет, удаляет или нормализует символы до токенизации
- **Токенизатор (tokenizer)**: задаёт алгоритм токенизации. Поддерживает такие типы, как `standard`, `ngram`, `edge_ngram`, `keyword` и `icu`, для обработки текстов на разных языках и с разной структурой
- **Фильтр токенов (token_filter)**: например, `lowercase`, `word_delimiter` и `ascii_folding`, используемые для нормализации и дополнительной обработки результатов токенизации

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

Doris реализует алгоритм **BM25 (Best Matching 25)** для вычисления релевантности текста, предоставляя возможности ранжирования и оценки результатов полнотекстового поиска.

Основные характеристики BM25:

- Вероятностная модель, основанная на частоте термина (TF), обратной частоте документов (IDF) и длине документа
- Хорошо работает как с короткими, так и с длинными текстами
- Стратегия взвешивания настраивается с помощью параметров `k1` и `b`

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[Подробнее о механизме оценки](./scoring.md)

---

### 4. Функция SEARCH: единая точка входа для запросов (4.0+) {#4-search-function-unified-query-entry-point-40}

Функция `SEARCH()` предоставляет единый синтаксис текстового поиска, поддерживает поиск по нескольким столбцам и сочетания булевых условий, позволяя компактнее записывать сложные запросы:

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

### Шаг 1: создайте таблицу с инвертированными индексами {#step-1-create-a-table-with-inverted-indexes}

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
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES ("replication_num" = "1");
```

### Шаг 2: выполните текстовые запросы {#step-2-run-text-queries}

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

## Гибридный поиск: текстовый + векторный {#hybrid-search-text--vector}

В приложениях RAG сочетание текстового поиска с векторным сходством позволяет находить более полный набор результатов:

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

-- Build the index for existing data
BUILD INDEX idx_content ON docs;
```

### Удаление индекса {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### Просмотр индексов {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## Дополнительные материалы {#further-reading}

### Основная документация {#core-documentation}

- [Операторы текстового поиска](./search-operators.md): полный справочник операторов и ускорение запросов
- [Функция SEARCH](./search-function.md): синтаксис единого DSL для запросов и примеры
- [Оценка релевантности](./scoring.md): алгоритм ранжирования по релевантности и его использование

### Углублённое изучение {#advanced-topics}

- [Пользовательский анализатор](./custom-analyzer.md): создание токенизаторов и фильтров для конкретных предметных областей
- [Векторный поиск](../vector-index/overview.md): использование векторов эмбеддингов для поиска по семантическому сходству
