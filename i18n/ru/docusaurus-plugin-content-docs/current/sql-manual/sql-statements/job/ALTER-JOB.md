---
{
    "title": "ALTER JOB",
    "language": "ru",
    "description": "Используйте ALTER JOB для обновления приостановленных заданий Streaming Job, изменения свойств выполнения или SQL, а также сброса позиции CDC MySQL или PostgreSQL до точно заданного смещения в формате JSON."
}
---

## Описание {#description}

Изменяет свойства выполнения, исполняемый SQL или конфигурацию Auto Table Creation Sync задания Streaming Job. Изменять можно только задания Streaming Job в состоянии `PAUSED`, при этом каждый оператор должен вносить хотя бы одно фактическое изменение.

## Синтаксис {#syntax}

```sql
ALTER JOB <job_name>
[
    PROPERTIES (<job_property>[, ...])
]
[
    <Insert_Command>
    | FROM <source_type> (<source_property>[, ...])
      TO DATABASE <target_db> (<target_property>[, ...])
]
```

## Обязательные параметры {#required-parameters}

**1. `<job_name>`**
> Имя изменяемого задания.

## Необязательные параметры {#optional-parameters}

**1. `<job_property>`**
> Изменяет свойства задания, такие как `max_interval`, `compute_group` или `session.*`, либо сбрасывает позицию CDC с помощью значения `offset` в формате JSON.

**2. `<Insert_Command>`**
> Изменяет SQL-оператор INSERT, выполняемый заданием в режиме TVF. Не используйте ключевое слово `DO` в `ALTER JOB`.

**3. `<source_property>` и `<target_property>`**
> Изменяют свойства источника или целевой стороны Auto Table Creation Sync. Тип источника данных и целевую базу данных изменить нельзя.

:::note
Auto Table Creation Sync не позволяет изменять `jdbc_url`, `database`, `schema`, `include_tables`, `exclude_tables`, свойство `offset` на стороне источника, `snapshot_split_size`, `snapshot_parallelism`, параметры сопоставления отдельных таблиц, `slot_name` или `publication_name`. Для сброса позиции CDC используйте свойство задания `offset`.

Режим CDC Stream TVF не позволяет изменять целевую таблицу, тип TVF, `type`, `jdbc_url`, `database`, `schema`, `table`, `snapshot_split_size`, `snapshot_parallelism`, `slot_name` или `publication_name`. Вы можете изменить SQL-оператор INSERT, чтобы обновить учётные данные, драйверы или другие параметры, допускающие изменение.
:::

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту SQL-команду, должен иметь как минимум следующие права:

| Право | Объект | Тип задания | Примечания |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | База данных (DB) | Streaming | Позволяет выполнить эту операцию при наличии прав **LOAD** |

## Примеры {#examples}

- Изменение переменной сеанса задания my_job

   ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    );
    ```
- Изменение SQL-оператора задания my_job

   ```sql
    ALTER JOB my_job
    INSERT INTO db1.tbl1 
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ```  

- Одновременное изменение свойств и SQL-оператора задания my_job.

    ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    INSERT INTO db1.tbl1 
    select * from S3(
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ``` 

- Изменение позиции синхронизации задания S3 my_job

```sql
ALTER JOB my_job
PROPERTIES(
    'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
);
```

- Сброс позиции задания MySQL CDC до точно заданного смещения Binlog

```sql
ALTER JOB mysql_cdc_job
PROPERTIES (
    "offset" = '{"file":"binlog.000001","pos":"154"}'
);
```

- Сброс позиции задания PostgreSQL CDC до точно заданного LSN

```sql
ALTER JOB pg_cdc_job
PROPERTIES (
    "offset" = '{"lsn":"12345678"}'
);
```

Позицию CDC можно изменить только тогда, когда задание находится в состоянии `PAUSED`. Свойство `offset` принимает только точно заданное смещение в формате JSON, как показано выше; значения `initial`, `snapshot`, `earliest` и `latest` не допускаются.
