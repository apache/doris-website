---
{
    "title": "ALTER SQL_BLOCK_RULE",
    "language": "ru",
    "description": "Эта инструкция используется для изменения правила блокировки SQL."
}
---

## Описание {#description}

Эта инструкция используется для изменения правила блокировки SQL.

## Синтаксис {#syntax}


```sql
ALTER SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## Обязательные параметры {#required-parameters}

**1. `<rule_name>`**

> Имя правила.

**2. `<property>`**

Подробности см. в описании [CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md).

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Право   | Объект | Примечания |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | Глобальный уровень |             |

## Пример {#example}

1. Изменить SQL и включить правило


  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```
