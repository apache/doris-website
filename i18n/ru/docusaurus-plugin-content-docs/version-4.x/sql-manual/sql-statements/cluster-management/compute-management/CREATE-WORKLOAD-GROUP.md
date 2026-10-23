---
{
    "title": "CREATE WORKLOAD GROUP | Управление вычислительными ресурсами",
    "language": "ru",
    "description": "Этот оператор используется для создания группы рабочих нагрузок. Группы рабочих нагрузок позволяют изолировать ресурсы cpu и памяти на одном be.",
    "sidebar_label": "CREATE WORKLOAD GROUP"
}
---

# CREATE WORKLOAD GROUP {#create-workload-group}

## Описание {#description}

Этот оператор используется для создания группы рабочих нагрузок. Группы рабочих нагрузок позволяют изолировать ресурсы cpu и памяти на одном be.

## Синтаксис {#syntax}

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
[FOR <compute_group>]
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## Параметры {#parameters}

1. `<compute_group>`

    Задаёт вычислительную группу, к которой привязана группа рабочих нагрузок.

    - **Облачный режим (с разделением хранения и вычислений)**: предложение `FOR <compute_group>` **необходимо указывать явно**. Если оно не указано, возникает ошибка: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **Необлачный режим (с совмещением хранения и вычислений)**: предложение `FOR <compute_group>` необязательно. Здесь значение фактически указывает на группу ресурсов (Tag), а не на вычислительную группу. Общий с облачным режимом синтаксис используется исключительно для единообразия. Если предложение не указано, используется группа ресурсов по умолчанию (`default`).

2. `<property>`

    Формат `<property>`: `<key>` = `<value>`. Возможные значения `<key>` описаны в разделе [Группа рабочих нагрузок](../../../../admin-manual/workload-management/workload-group.md).


## Примеры {#examples}

1. Создание группы рабочих нагрузок с именем g1 (необлачный режим: привязка к группе ресурсов по умолчанию):

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```

2. Создание группы рабочих нагрузок с именем g1, привязанной к `compute_group_a` (в облачном режиме это предложение обязательно):

   ```sql
    create workload group if not exists g1 for compute_group_a
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
