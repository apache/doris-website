---
{
    "title": "Parquet | Формат файла",
    "language": "ru",
    "description": "Как импортировать файлы Parquet в Apache Doris? Поддерживаются Stream Load, Broker Load и S3/HDFS TVF. В этом документе приведены полные примеры.",
    "keywords": [
        "импорт Parquet в Doris",
        "формат файла Parquet",
        "Stream Load Parquet",
        "Broker Load Parquet",
        "S3 TVF",
        "HDFS TVF",
        "импорт из столбцового хранилища"
    ],
    "sidebar_label": "Parquet"
}
---

<!-- Knowledge type: Operating procedure / File format reference -->
<!-- Applicable scenarios: Data import / File format adaptation -->

В этом документе описано, как импортировать файлы данных в формате Parquet в Apache Doris, и приведены готовые к использованию примеры для каждого способа импорта.

## Сценарии использования {#applicable-scenarios}

Parquet — столбцовый формат хранения, который часто используется для офлайн-хранилищ данных и больших объёмов данных, сохраняемых в объектном хранилище. Parquet хорошо подходит в качестве источника импорта в следующих сценариях:

- Массовый импорт исторических данных из объектных хранилищ или распределённых файловых систем, таких как S3 или HDFS.
- Отправка файлов Parquet, созданных локально или на сервере, через Stream Load.
- Массовая загрузка файлов Parquet из удалённых хранилищ через Broker Load.
- Выполнение запросов по мере необходимости к данным Parquet в объектном хранилище или HDFS с помощью табличных функций (TVF) с последующей записью результатов в Doris.

## Поддерживаемые способы импорта {#supported-import-methods}

В следующей таблице перечислены способы импорта, поддерживающие формат Parquet, и типичные сценарии их использования:

| Способ импорта | Сценарии использования | Ссылка на документацию |
| --- | --- | --- |
| Stream Load | Отправка локальных или серверных файлов в реальном времени или пакетами | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | Массовый импорт из удалённых хранилищ (HDFS, объектные хранилища) | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | Прямые запросы к файлам Parquet в S3 с записью в целевую таблицу | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | Прямые запросы к файлам Parquet в HDFS с записью в целевую таблицу | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## Примеры использования {#usage-examples}

В этом разделе приведён минимальный рабочий пример для каждого способа импорта. Замените заполнители в примерах (такие как `<user>`, `<fe_host>` и `bucket`) значениями из вашей среды.

### 1. Импорт Parquet с помощью Stream Load {#1-importing-parquet-with-stream-load}

Чтобы отправить локальный файл Parquet напрямую в таблицу Doris через интерфейс HTTP, явно укажите `format: parquet` в заголовке запроса.

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

Примечания:

- `-H "format: parquet"`: указывает, что импортируемый файл имеет формат Parquet.
- `-T example.parquet`: задаёт локальный файл Parquet для загрузки.
- `example_db` и `example_table` в URL — это целевая база данных и целевая таблица соответственно.

### 2. Импорт Parquet с помощью Broker Load {#2-importing-parquet-with-broker-load}

Этот способ подходит для массовой загрузки файлов Parquet из объектных хранилищ или HDFS. Используйте `FORMAT AS "parquet"`, чтобы указать формат файла.

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.parquet")
    INTO TABLE example_table
    FORMAT AS "parquet"
)
WITH S3 
(
    ...
);
```

Примечания:

- `DATA INFILE`: задаёт путь к файлу Parquet в удалённом хранилище. Поддерживаются такие протоколы, как `s3://` и `hdfs://`.
- `FORMAT AS "parquet"`: указывает, что исходный файл имеет формат Parquet.
- `WITH S3 (...)`: задаёт учётные данные, необходимые для доступа к объектному хранилищу, такие как `endpoint`, `access_key` и `secret_key`.

### 3. Импорт Parquet с помощью TVF {#3-importing-parquet-with-tvf}

Используйте табличную функцию (TVF) вместе с `INSERT INTO ... SELECT`, чтобы напрямую читать удалённые файлы Parquet и записывать данные в целевую таблицу. Этот способ подходит для импорта по мере необходимости и сохранения результатов разового анализа.

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.parquet",
    "format" = "parquet",
    ...
);
```

Примечания:

- `S3(...)`: табличная функция. Параметры должны включать `uri` и `format`. При необходимости добавьте другие параметры, например данные для аутентификации.
- Замените `S3` на `HDFS`, чтобы читать файлы Parquet в HDFS.
- `SELECT *` можно заменить списком столбцов или запросом с условиями фильтрации, чтобы импортировать только нужные данные.

## Часто задаваемые вопросы {#faq}

**Вопрос 1: Нужно ли явно указывать формат файла при импорте Parquet?**

Да. В Stream Load он задаётся через заголовок запроса `format: parquet`; в Broker Load — через `FORMAT AS "parquet"`; в TVF — через параметр `"format" = "parquet"`.

**Вопрос 2: Поддерживается ли импорт Parquet из HDFS?**

Да. Можно использовать Broker Load (с путём `hdfs://` в `DATA INFILE`) или HDFS TVF.

**Вопрос 3: Чем импорт с помощью TVF отличается от Broker Load?**

Broker Load — асинхронное задание массового импорта, которое подходит для больших пакетов данных и задач по расписанию. TVF выполняется синхронно через `INSERT INTO ... SELECT`, что подходит для импорта по мере необходимости и сценариев, в которых перед загрузкой данных требуется фильтрация, агрегация или другая обработка.
