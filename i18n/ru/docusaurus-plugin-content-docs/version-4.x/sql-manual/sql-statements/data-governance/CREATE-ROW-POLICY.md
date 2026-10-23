---
{
    "title": "CREATE ROW POLICY",
    "language": "ru",
    "description": "Создаёт политику безопасности на уровне строк для таблицы, чтобы ограничить набор строк, возвращаемых указанным пользователям или ролям."
}
---

## Описание {#description}

Создаёт политику безопасности на уровне строк для таблицы. Политика ограничивает строки, доступные указанным пользователям или ролям, с помощью предиката фильтрации, который применяется к запросам к таблице.

## Синтаксис {#syntax}

```sql
CREATE ROW POLICY [ IF NOT EXISTS ] <policy_name> 
ON <table_name> 
AS { RESTRICTIVE | PERMISSIVE } 
TO { <user_name> | ROLE <role_name> } 
USING (<filter>);
```
## Обязательные параметры {#required-parameters}

**<policy_name>**

> Имя политики безопасности на уровне строк

**<table_name>**

> Имя таблицы

**<filter_type>**

> RESTRICTIVE объединяет набор политик с помощью AND, а PERMISSIVE объединяет набор политик с помощью OR



> Эквивалентно условию фильтрации в запросе, например: id=1

## Необязательные параметры {#optional-parameters}

**<user_name>**

> Имя пользователя; политику нельзя создать для пользователей root и admin

**<role_name>**

> Имя роли

## Требования к управлению доступом {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен обладать как минимум следующими привилегиями:

| Привилегия                | Объект | Примечания |
| ------------------------ | ------ | ----- |
| ADMIN_PRIV или GRANT_PRIV | Глобальный |       |

## Примеры {#examples}

1. Создание набора политик безопасности на уровне строк

  ```sql
  CREATE ROW POLICY test_row_policy_1 ON test.table1 
  AS RESTRICTIVE TO test USING (c1 = 'a');
  CREATE ROW POLICY test_row_policy_2 ON test.table1 
  AS RESTRICTIVE TO test USING (c2 = 'b');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c3 = 'c');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c4 = 'd');
  ```

  При выполнении запроса к table1 переписанный SQL выглядит так:

  ```sql
  SELECT * FROM (SELECT * FROM table1 WHERE (c1 = 'a' AND c2 = 'b') AND (c3 = 'c' OR c4 = 'd'))
  ```
