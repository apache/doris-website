---
{
    "title": "CANCEL TASK",
    "language": "ru",
    "description": "Отмена выполняющейся задачи, созданной оператором CREATE JOB."
}
---

## Описание {#description}

Отмена выполняющейся задачи, созданной оператором CREATE JOB.

- Задача должна быть создана оператором CREATE JOB.
- Задача должна находиться в состоянии выполнения.
- Эта функция поддерживается начиная с версии 2.1.0.

## Синтаксис {#syntax}

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```
## Обязательные параметры {#required-parameters}

**<job_name>**

> Имя задания, строкового типа.

**<task_id>**

> Идентификатор задачи, целочисленного типа. Его можно получить с помощью запроса к табличной функции tasks. Например: SELECT * FROM tasks('type'='insert'). Дополнительные сведения см. в разделе «Табличная функция task».

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум права ADMIN_PRIV.

## Примеры {#examples}

Отмена фоновой задачи с jobName 'example' и taskId 378912.


```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```
