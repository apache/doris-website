---
{
    "title": "SHOW WARM UP JOB",
    "language": "ru",
    "description": "Эти команды позволяют просматривать задания прогрева в Doris."
}
---

## Описание {#description}

Эти команды позволяют просматривать задания прогрева в Doris.

## Синтаксис {#syntax}

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## Параметры {#parameters}


| Имя параметра                  | Описание                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | ID задания прогрева                                                |
## Примеры {#examples}

1. Просмотр всех заданий прогрева:

 ```sql
    SHOW WARM UP JOB;
```

2. Просмотр задания прогрева с ID 13418:

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```

## Связанные команды {#related-commands}

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)
