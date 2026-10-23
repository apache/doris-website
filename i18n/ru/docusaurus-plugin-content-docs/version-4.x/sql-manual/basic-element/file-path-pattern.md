---
{
    "title": "Шаблон пути к файлу",
    "language": "ru",
    "description": "Шаблоны путей к файлам и подстановочные символы, поддерживаемые Doris для доступа к файлам в удалённых системах хранения, таких как S3, HDFS и другие объектные хранилища."
}
---

## Описание {#description}

При доступе к файлам в удалённых системах хранения (S3, HDFS и других объектных хранилищах, совместимых с S3) Doris поддерживает гибкие шаблоны путей к файлам, включая подстановочные символы и выражения диапазонов. В этом документе описаны поддерживаемые форматы путей и синтаксис сопоставления с шаблонами.

Эти шаблоны путей поддерживаются в:
- [S3 TVF](../sql-functions/table-valued-functions/s3)
- [HDFS TVF](../sql-functions/table-valued-functions/hdfs)
- [Broker Load](../../data-operate/import/import-way/broker-load-manual)
- INSERT INTO SELECT из TVF

## Поддерживаемые форматы URI {#supported-uri-formats}

### URI в стиле S3 {#s3-style-uris}

| Стиль | Формат | Пример |
|-------|--------|---------|
| Стиль клиента AWS (Hadoop S3) | `s3://bucket/path/to/file` | `s3://my-bucket/data/file.csv` |
| Стиль S3A | `s3a://bucket/path/to/file` | `s3a://my-bucket/data/file.csv` |
| Стиль S3N | `s3n://bucket/path/to/file` | `s3n://my-bucket/data/file.csv` |
| Стиль виртуального хоста | `https://bucket.endpoint/path/to/file` | `https://my-bucket.s3.us-west-1.amazonaws.com/data/file.csv` |
| Стиль с указанием бакета в пути | `https://endpoint/bucket/path/to/file` | `https://s3.us-west-1.amazonaws.com/my-bucket/data/file.csv` |

### URI других облачных хранилищ {#other-cloud-storage-uris}

| Провайдер | Схема | Пример |
|----------|--------|---------|
| Alibaba Cloud OSS | `oss://` | `oss://my-bucket/data/file.csv` |
| Tencent Cloud COS | `cos://`, `cosn://` | `cos://my-bucket/data/file.csv` |
| Baidu Cloud BOS | `bos://` | `bos://my-bucket/data/file.csv` |
| Huawei Cloud OBS | `obs://` | `obs://my-bucket/data/file.csv` |
| Google Cloud Storage | `gs://` | `gs://my-bucket/data/file.csv` |
| Azure Blob Storage | `azure://` | `azure://container/data/file.csv` |

### URI HDFS {#hdfs-uris}

| Стиль | Формат | Пример |
|-------|--------|---------|
| Стандартный | `hdfs://namenode:port/path/to/file` | `hdfs://namenode:8020/user/data/file.csv` |
| Режим HA | `hdfs://nameservice/path/to/file` | `hdfs://my-ha-cluster/user/data/file.csv` |

## Шаблоны с подстановочными символами {#wildcard-patterns}

Для путей к файлам Doris использует сопоставление с шаблонами в стиле glob. Поддерживаются следующие подстановочные символы:

### Основные подстановочные символы {#basic-wildcards}

| Шаблон | Описание | Пример | Совпадения |
|---------|-------------|---------|---------|
| `*` | Соответствует нулю или более символам в пределах одного сегмента пути | `*.csv` | `file.csv`, `data.csv`, `a.csv` |
| `?` | Соответствует ровно одному символу | `file?.csv` | `file1.csv`, `fileA.csv`, но не `file10.csv` |
| `[abc]` | Соответствует любому одному символу из указанных в скобках | `file[123].csv` | `file1.csv`, `file2.csv`, `file3.csv` |
| `[a-z]` | Соответствует любому одному символу из диапазона | `file[a-c].csv` | `filea.csv`, `fileb.csv`, `filec.csv` |
| `[!abc]` | Соответствует любому одному символу, НЕ указанному в скобках | `file[!0-9].csv` | `filea.csv`, `fileb.csv`, но не `file1.csv` |

### Раскрытие диапазонов (шаблоны в фигурных скобках) {#range-expansion-brace-patterns}

Doris поддерживает раскрытие числовых диапазонов с помощью шаблонов в фигурных скобках `{start..end}`:

| Шаблон | Результат раскрытия | Совпадения |
|---------|-----------|---------|
| `{1..3}` | `{1,2,3}` | `1`, `2`, `3` |
| `{01..05}` | `{1,2,3,4,5}` | `1`, `2`, `3`, `4`, `5` (ведущие нули НЕ сохраняются) |
| `{3..1}` | `{1,2,3}` | `1`, `2`, `3` (поддерживаются диапазоны в обратном порядке) |
| `{a,b,c}` | `{a,b,c}` | `a`, `b`, `c` (перечисление) |
| `{1..3,5,7..9}` | `{1,2,3,5,7,8,9}` | Сочетание диапазонов и отдельных значений |

:::caution Примечание
- Doris пытается найти как можно больше файлов, соответствующих шаблону. Недопустимые части выражений в фигурных скобках пропускаются без предупреждения, а допустимые части всё равно раскрываются. Например, `file_{a..b,-1..3,4..5}` соответствует `file_4` и `file_5` (недопустимое выражение `a..b` и отрицательный диапазон `-1..3` пропускаются, а `4..5` раскрывается как обычно).
- Если весь диапазон отрицательный (например, `{-1..2}`), он пропускается. Если он сочетается с допустимыми диапазонами (например, `{-1..2,1..3}`), раскрывается только допустимый диапазон `1..3`.
- При использовании значений через запятую вместе с диапазонами допускаются только числа. Например, в `{1..4,a}` нечисловое значение `a` игнорируется, и результатом будет `{1,2,3,4}`.
- Шаблоны, содержащие только перечисление, например `{a,b,c}` (без диапазонов `..`), передаются непосредственно для сопоставления glob и работают ожидаемым образом.
:::

### Комбинирование шаблонов {#combining-patterns}

В одном пути можно комбинировать несколько шаблонов:

```
s3://bucket/data_{1..3}/file_*.csv
```

Этому шаблону соответствуют:
- `s3://bucket/data_1/file_a.csv`
- `s3://bucket/data_1/file_b.csv`
- `s3://bucket/data_2/file_a.csv`
- ... и так далее

## Примеры {#examples}

### Примеры S3 TVF {#s3-tvf-examples}

**Выбор всех файлов CSV в каталоге:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/*.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**Выбор файлов по числовому диапазону:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/data_{1..10}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**Выбор файлов в каталогах, разделённых по датам:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/year=2024/month=*/day=*/data.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

:::caution Каталоги с ведущими нулями
Для имён каталогов с ведущими нулями, таких как `month=01`, `month=02`, используйте подстановочные символы (`*`) вместо шаблонов диапазонов. Шаблон `{01..12}` раскрывается в `{1,2,...,12}`, что не соответствует `month=01`.
:::

**Выбор пронумерованных частей файлов (например, результата работы Spark):**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/output/part-{00000..00099}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

### Примеры Broker Load {#broker-load-examples}

**Загрузка всех файлов CSV, соответствующих шаблону:**

```sql
LOAD LABEL db.label_wildcard
(
    DATA INFILE("s3://my-bucket/data/file_*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "https://s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**Загрузка файлов с раскрытием числового диапазона:**

```sql
LOAD LABEL db.label_range
(
    DATA INFILE("s3://my-bucket/exports/data_{1..5}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "https://s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**Загрузка из HDFS с подстановочными символами:**

```sql
LOAD LABEL db.label_hdfs_wildcard
(
    DATA INFILE("hdfs://namenode:8020/user/data/2024-*/*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

**Загрузка из HDFS с числовым диапазоном:**

```sql
LOAD LABEL db.label_hdfs_range
(
    DATA INFILE("hdfs://namenode:8020/data/file_{1..3,5,7..9}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

### Примеры INSERT INTO SELECT {#insert-into-select-examples}

**Вставка данных из S3 с подстановочными символами:**

```sql
INSERT INTO my_table (col1, col2, col3)
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/part-*.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

## Рекомендации по производительности {#performance-considerations}

### Используйте конкретные префиксы {#use-specific-prefixes}

Doris извлекает из шаблона пути самый длинный префикс без подстановочных символов, чтобы оптимизировать операции получения списка файлов в S3/HDFS. Чем конкретнее префикс, тем быстрее находятся файлы.

```sql
-- Good: specific prefix reduces listing scope
"uri" = "s3://bucket/data/2024/01/15/*.csv"

-- Less optimal: broad wildcard at early path segment
"uri" = "s3://bucket/data/**/file.csv"
```

### Предпочитайте шаблоны диапазонов для известных последовательностей {#prefer-range-patterns-for-known-sequences}

Если вы знаете точную нумерацию файлов, используйте шаблоны диапазонов вместо подстановочных символов:

```sql
-- Better: explicit range
"uri" = "s3://bucket/data/part-{0001..0100}.csv"

-- Less optimal: wildcard matches unknown files
"uri" = "s3://bucket/data/part-*.csv"
```

### Избегайте рекурсивных подстановочных шаблонов с большой глубиной {#avoid-deep-recursive-wildcards}

Рекурсивные шаблоны с большой глубиной, такие как `**`, могут замедлять получение списка файлов в больших бакетах:

```sql
-- Avoid when possible
"uri" = "s3://bucket/**/*.csv"

-- Prefer explicit path structure
"uri" = "s3://bucket/data/year=*/month=*/day=*/*.csv"
```

## Устранение неполадок {#troubleshooting}

| Проблема | Причина | Решение |
|-------|-------|----------|
| Файлы не найдены | Ни один файл не соответствует шаблону | Проверьте путь и синтаксис шаблона; сначала проверьте доступ к одному файлу |
| Медленное получение списка файлов | Слишком широкий шаблон или слишком много файлов | Используйте более конкретный префикс; ограничьте область действия подстановочных символов |
| Ошибка недопустимого URI | Некорректный синтаксис пути | Проверьте схему URI и формат имени бакета |
| Доступ запрещён | Проблема с учётными данными или правами доступа | Проверьте учётные данные S3/HDFS и политики бакета |

### Проверка шаблонов путей {#testing-path-patterns}

Перед запуском крупной задачи загрузки проверьте шаблон с помощью запроса с ограничением числа строк:

```sql
-- Test if files exist and match pattern
SELECT * FROM S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
) LIMIT 1;
```

Используйте `DESC FUNCTION`, чтобы проверить схему файлов, соответствующих шаблону:

```sql
DESC FUNCTION S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
);
```
