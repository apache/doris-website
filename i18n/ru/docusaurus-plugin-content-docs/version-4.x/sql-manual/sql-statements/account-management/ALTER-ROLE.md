---
{
    "title": "ALTER ROLE",
    "language": "ru",
    "description": "Оператор ALTER ROLE используется для изменения роли."
}
---

## Описание {#description}

Оператор `ALTER ROLE` используется для изменения роли.

## Синтаксис {#syntax}

```sql
 ALTER ROLE <role_name> COMMENT <comment>;
```

## Обязательные параметры {#required-parameters}

**1. `<role_name>`**

> Имя роли. 

## Необязательные параметры {#optional-parameters}

**1. `<comment>`**

> Комментарий к роли.

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен обладать как минимум следующими привилегиями:

| Привилегия    | Объект    | Примечания |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER или ROLE    | Эту операцию могут выполнять только пользователи или роли с правами ADMIN_PRIV  |

## Пример {#example}

- Изменение комментария к роли

```sql
ALTER ROLE role1 COMMENT "this is my first role";
```
