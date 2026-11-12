---
{
    "title": "CLEAN ALL QUERY STATS",
    "language": "ru",
    "description": "Эта инструкция используется для очистки статистики запросов"
}
---

## Описание {#description}

Эта инструкция используется для очистки статистики запросов

## Синтаксис {#syntax}

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```

## Обязательные параметры {#required-parameters}

**1. `ALL`**

> Используйте ALL для очистки всей статистики запросов

**2. `DATABASE`**

> Используйте DATABASE для очистки статистики запросов к базе данных

**3. `TABLE`**

> Используйте TABLE для очистки статистики запросов к таблице

## Необязательные параметры {#optional-parameters}

**1. `<db_name>`**

> Если этот параметр задан, очищается статистика соответствующей базы данных

**2. `<table_name>`**

> Если этот параметр задан, очищается статистика соответствующей таблицы


## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Привилегия | Объект   | Примечания                |
|:-----------|:---------|:--------------------------|
| ADMIN_PRIV | ALL      | Если указано ALL, требуется право ADMIN     |
| ALTER_PRIV | DATABASE | Если указана база данных, требуется право ALTER для соответствующей базы данных |
| ADMIN_PRIV | TABLE    | Если указана таблица, требуется право alter для этой таблицы     |


## Примеры {#examples}

```sql
clean all query stats
```

```sql
clean database query stats for test_query_db
```

```sql
clean table query stats from test_query_db.baseall
```
