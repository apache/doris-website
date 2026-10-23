---
{
    "title": "Анализ данных Hugging Face",
    "language": "ru",
    "description": "Узнайте, как использовать Apache Doris для выполнения запросов и анализа наборов данных Hugging Face напрямую с помощью SQL. Поддерживаются форматы CSV, Parquet и JSON без скачивания файлов, что позволяет быстро импортировать данные для машинного обучения."
}
---

[Hugging Face](https://huggingface.co/) — популярная централизованная платформа, где пользователи могут хранить модели машинного обучения, наборы данных и другие ресурсы, делиться ими и совместно работать над их созданием. Репозитории [Hugging Face Dataset](https://huggingface.co/datasets) могут содержать файлы данных в различных форматах, таких как CSV, Parquet и JSONL.

Doris позволяет напрямую обращаться к данным из наборов Hugging Face и анализировать их с помощью SQL, используя [табличную функцию HTTP](../sql-manual/sql-functions/table-valued-functions/http.md).

:::note
Эта возможность поддерживается начиная с версии 4.0.2.
:::

## Возможности {#features}

| Возможность | Описание |
|---------|-------------|
| Протокол доступа | Доступ к Hugging Face Dataset по протоколу HTTP |
| Определение типов | Поддерживается автоматическое определение типов |
| Поддерживаемые форматы файлов | CSV, JSON, Parquet, ORC |
| Операции с данными | Поддерживаются `CREATE TABLE AS SELECT` и `INSERT INTO ... SELECT` |

Параметры совпадают с параметрами файловой табличной функции (File Table Valued Function).

## Синтаксис URI {#uri-syntax}

Формат URI для доступа к наборам данных Hugging Face:

```
hf://datasets/<owner>/<repo>[@<branch>]/<path>
```

| Компонент | Описание | Обязательный |
|-----------|-------------|----------|
| `owner` | Владелец набора данных | Да |
| `repo` | Имя репозитория набора данных | Да |
| `branch` | Имя ветки, по умолчанию `main` | Нет |
| `path` | Путь к файлу, поддерживает подстановочные символы | Да |

**Описание подстановочных символов:**

| Подстановочный символ | Описание | Пример |
|----------|-------------|---------|
| `*` | Соответствует любой последовательности символов в пределах одного уровня каталогов | `*/*.parquet` соответствует всем файлам Parquet в подкаталогах первого уровня |
| `**` | Рекурсивно охватывает несколько уровней каталогов | `**/*.parquet` соответствует файлам Parquet на всех уровнях |
| `[...]` | Соответствует любому одному символу из указанного набора | `test-0000[0-9].parquet` соответствует файлам от test-00000 до test-00009 |

## Сценарии использования {#use-cases}

### Сценарий 1: Быстрое выполнение запросов к данным {#case-1-quick-data-query}

Выполняйте запросы к общедоступным наборам данных Hugging Face напрямую с помощью SQL без скачивания файлов.

**Пример:** Запрос данных CSV из репозитория `fka/awesome-chatgpt-prompts`:

```sql
SELECT COUNT(*) FROM
HTTP(
    "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
    "format" = "csv"
);
```

> Соответствующий файл данных: https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

**Пример:** Запрос файлов Parquet из репозитория `stanfordnlp/imdb` с использованием подстановочных символов для выбора нескольких файлов:

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> Соответствующий файл данных: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### Сценарий 2: Импорт данных в локальные таблицы {#case-2-import-data-to-local-tables}

Импортируйте наборы данных Hugging Face в таблицы Doris для последующего анализа.

**Способ 1:** Используйте `CREATE TABLE AS SELECT`, чтобы создать новую таблицу и импортировать данные:

```sql
CREATE TABLE hf_table AS
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
    "format" = "json"
);
```

> Соответствующий файл данных: https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

**Способ 2:** Используйте `INSERT INTO ... SELECT`, чтобы вставить данные в существующую таблицу:

```sql
INSERT INTO hf_table
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> Соответствующий файл данных: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### Сценарий 3: Доступ к закрытым наборам данных {#case-3-access-private-datasets}

Для доступа к наборам данных, требующим авторизации, необходимо добавить в запрос аутентификацию по токену.

**Порядок действий:**

1. Войдите в свою учётную запись Hugging Face и получите токен доступа (начинается с `hf_`).
2. Передайте токен через свойство `http.header.Authorization` в SQL.

**Пример:**

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
    "format" = "parquet",
    "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
) LIMIT 1\G
```
