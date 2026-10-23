---
{
    "title": "DROP WORKLOAD POLICY",
    "language": "ru",
    "description": "Удаление политики рабочей нагрузки"
}
---

## Описание {#description}

Удаление политики рабочей нагрузки

## Синтаксис {#syntax}

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```
## Обязательные параметры {#required-parameters}

**<workload_policy_name>**

Имя политики рабочей нагрузки

## Требования к правам доступа {#access-control-requirements}

Необходимы как минимум права `ADMIN_PRIV`

## Примеры {#examples}

1. Удаление политики рабочей нагрузки с именем cancel_big_query

  ```sql
  drop workload policy if exists cancel_big_query
  ```
