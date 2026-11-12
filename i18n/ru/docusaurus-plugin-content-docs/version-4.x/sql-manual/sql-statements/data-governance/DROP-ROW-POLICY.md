---
{
    "title": "DROP ROW POLICY",
    "language": "ru",
    "description": "Удаление политики безопасности строк. Подробнее о политиках безопасности строк см. в главе «Политики безопасности»"
}
---

## Описание {#description}

Удаление политики безопасности строк. Подробнее о политиках безопасности строк см. в главе «Политики безопасности»


## Синтаксис {#syntax}

```sql
DROP ROW POLICY <policy_name> on <table_name>
  [ FOR { <user_name> | ROLE <role_name> } ];
```

## Обязательные параметры {#required-parameters}
**<policy_name>**

> Имя политики безопасности строк

**<table_name>**

> Имя таблицы

# Необязательные параметры (Необязательные параметры) {#optional-parameters-optional-parameters}

**<user_name>**

> Имя пользователя

**<role_name>**

> Имя роли

# Требования к управлению доступом (Требования к управлению доступом) {#access-control-requirements-access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие привилегии:

| Привилегия                  | Объект | Примечания |
| :------------------------- | :----- | :---- |
| ADMIN_PRIV или *GRANT_PRIV* | Глобальный |       |

# Примеры (Примеры) {#examples-examples}

1. Удаление *политики безопасности строк policy1* для *db1.table1*

  ```sql
  DROP ROW POLICY policy1 ON db1.table1
  ```

1. Удаление политики безопасности строк policy1 для db1.table1, применяемой к пользователю user1

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR user1
  ```

1. Удаление политики безопасности строк policy1 для db1.table1, применяемой к роли role1

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR role role1
  ```
