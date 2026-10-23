---
{
    "title": "ALTER JOB",
    "language": "ru",
    "description": "Пользователь может изменить задание. Изменять можно только задания в состоянии PAUSE и только задания типа Streaming."
}
---

## Описание {#description}

Пользователь может изменить задание. Изменять можно только задания в состоянии PAUSE и только задания типа Streaming.

## Синтаксис {#syntax}

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command> 
```

## Обязательные параметры {#required-parameters}

**1. `<job_name>`**
> Изменяет имя задания.

## Необязательные параметры {#optional-parameters}

**1. `<job_properties>`**
> Изменяет свойства задания.

**1. `<Insert_Command>`**
> Изменяет SQL-оператор, выполняемый заданием.


## Требования к управлению доступом {#access-control-requirements}

Пользователь, выполняющий эту SQL-команду, должен иметь как минимум следующие права:

| Право | Объект | Тип задания | Примечания |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | База данных (DB) | Streaming | Права **LOAD** позволяют выполнять эту операцию |

## Примеры {#examples}

- Изменить переменную сеанса для задания my_job

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    ```
- Изменить SQL-оператор для задания my_job

   ```SQL
    Alter Job my_job
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

- Одновременно изменить свойства и SQL-оператор задания my_job.

    ```SQL
    Alter Job my_job
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
    )
    ``` 

- Изменить прогресс синхронизации задания my_job

    ```sql
        Alter JOB my_job
        PROPERTIES(
            'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
        )
    ```
