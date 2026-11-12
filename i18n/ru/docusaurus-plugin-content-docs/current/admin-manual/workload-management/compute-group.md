---
{
    "title": "Управление Compute Group: создание, предоставление прав доступа и масштабирование",
    "sidebar_label": "Compute Group",
    "language": "ru",
    "description": "В архитектуре с разделением хранения и вычислений Compute Group обеспечивает физическую изоляцию рабочих нагрузок и поддерживает создание групп, предоставление прав доступа, переключение между группами и эластичное масштабирование.",
    "keywords": ["Compute Group", "storage-compute separation", "compute cluster", "workload isolation", "elastic scaling", "workload management", "Compute Cluster", "BE management", "default compute group"]
}
---

<!-- Knowledge type: concept + procedure -->
<!-- Applicable scenario: workload isolation and resource management in the storage-compute separation architecture -->

**Compute Group** (в версиях до 3.0.2 называлась «Compute Cluster») — это механизм физической изоляции разных рабочих нагрузок в архитектуре с разделением хранения и вычислений. Compute Group состоит из одного или нескольких узлов BE. Несколько Compute Group обращаются к одним и тем же данным через общий слой хранения.

![compute_group](/images/compute_group_workload_management.png)

**Основные характеристики**:

- Узлы BE не хранят состояние локально, а данные находятся в общем хранилище.
- Несколько Compute Group используют одни и те же данные без дополнительных реплик.
- Добавление или удаление Compute Group не требует переноса данных: достаточно прогрева кеша при выполнении запросов.

По сравнению с Resource Group, Compute Group обладает следующими преимуществами:

| Критерий | Compute Group | Resource Group |
|------|--------------|----------------|
| Стоимость хранения | Данные находятся в общем хранилище. Число Compute Group не ограничено количеством реплик, а стоимость не растёт с увеличением числа групп. | При добавлении реплик стоимость хранения растёт линейно. |
| Гибкость масштабирования | Добавление новой Compute Group требует только прогрева кеша, без переноса данных. | Добавление реплики требует переноса большого объёма данных. |
| Полнота изоляции | Общий слой хранения гарантирует наличие нескольких реплик. Сбой узла BE в одной Compute Group не влияет на загрузку данных. | Сбой узла BE может привести к сбою загрузки данных. |

:::caution Примечание
В версиях до 3.0.2 Compute Group называлась Compute Cluster.
:::

## Просмотр Compute Group {#view-compute-groups}

<!-- Knowledge type: procedure -->

Просмотрите все Compute Group в текущем warehouse:

```sql
SHOW COMPUTE GROUPS;
```

## Добавление Compute Group {#add-a-compute-group}

<!-- Knowledge type: procedure -->

Используйте команду [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND), чтобы добавить узел BE и указать Compute Group, к которой он относится.

**С указанием Compute Group**:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**Без указания Compute Group** (по умолчанию узел присоединяется к `default_compute_group`):

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## Управление правами доступа к Compute Group {#manage-compute-group-access-permissions}

<!-- Knowledge type: procedure -->

### Предоставление права доступа {#grant-access-permission}

Предоставьте пользователю право использовать указанную Compute Group:

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

### Отзыв права доступа {#revoke-access-permission}

Отзовите у пользователя право использовать указанную Compute Group:

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## Настройка Compute Group по умолчанию {#set-the-default-compute-group}

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: read/write errors when a user has not configured a default Compute Group -->

### Настройка и просмотр Compute Group по умолчанию {#set-and-view-the-default-compute-group}

| Операция | Команда | Необходимые права |
|------|------|---------|
| Задать Compute Group по умолчанию для текущего пользователя | `SET PROPERTY 'default_compute_group' = '{clusterName}';` | Дополнительные права не требуются |
| Задать Compute Group по умолчанию для другого пользователя | `SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';` | Требуются права администратора |
| Просмотреть Compute Group по умолчанию для текущего пользователя | `SHOW PROPERTY;` | Дополнительные права не требуются |
| Просмотреть Compute Group по умолчанию для другого пользователя | `SHOW PROPERTY FOR {user};` | Требуются соответствующие права на просмотр |

Значение поля `default_compute_group` в возвращаемом результате указывает текущую Compute Group по умолчанию.

### Описание прав {#permission-description}

**Администратор** (например, `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`):

- Может задавать Compute Group по умолчанию для себя и других пользователей.
- Может просматривать `PROPERTY` для себя и других пользователей.

**Обычный пользователь** (например, `CREATE USER jack1 IDENTIFIED BY '123456'`):

- Может задавать Compute Group по умолчанию только для себя.
- Может просматривать только собственные `PROPERTY`.
- Не может выполнять `SHOW COMPUTE GROUPS` (для этой операции требуется право `GRANT ADMIN`).

### Часто задаваемые вопросы {#faq}

#### Вопрос: при чтении или записи данных возникает ошибка {#q-an-error-occurs-when-performing-data-reads-or-writes}
Текущий пользователь не настроил Compute Group по умолчанию. Выполните `use @cluster`, чтобы указать Compute Group для текущего сеанса, или используйте `SET PROPERTY`, чтобы задать значение по умолчанию.

#### Вопрос: Compute Group по умолчанию задана, но при чтении и записи по-прежнему возникают ошибки {#q-a-default-compute-group-has-been-set-but-reads-and-writes-still-report-errors}
Ранее указанная Compute Group была удалена. Выполните `use @cluster`, чтобы указать её заново, или используйте `SET PROPERTY`, чтобы обновить настройку по умолчанию.

## Автоматический выбор Compute Group по умолчанию {#automatic-selection-of-the-default-compute-group}

<!-- Knowledge type: concept -->

Если пользователь явно не задал Compute Group по умолчанию, система автоматически выбирает группу, которая соответствует следующим условиям:

- Содержит узлы BE в состоянии Active.
- Текущий пользователь имеет право её использовать.

В пределах одного сеанса Compute Group по умолчанию остаётся неизменной. При переходе к новому сеансу система автоматически выполняет повторный выбор в следующих случаях:

| Условие повторного выбора | Изменение выбора |
|----------|------------|
| Пользователь теряет право использовать ранее выбранную Compute Group | Всегда меняется |
| Добавлена или удалена Compute Group | Всегда меняется |
| В ранее выбранной Compute Group больше нет узлов BE в состоянии Active | Может измениться |

## Переключение между Compute Group {#switch-compute-groups}

<!-- Knowledge type: procedure -->

В архитектуре с разделением хранения и вычислений можно указать базу данных и Compute Group в одном операторе:

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

Если имя базы данных или Compute Group содержит зарезервированное ключевое слово, заключите соответствующее имя в обратные кавычки (`` ` ``).

## Масштабирование Compute Group {#compute-group-scaling}

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: elastic scaling, workload adjustment -->

Для эластичного масштабирования Compute Group добавляйте или удаляйте узлы BE:

- **Увеличение числа узлов**: `ALTER SYSTEM ADD BACKEND` добавляет новый узел BE в указанную Compute Group.
- **Уменьшение числа узлов**: `ALTER SYSTEM DECOMMISSION BACKEND` выводит узел BE из эксплуатации в Compute Group.

Подробные инструкции см. в разделе [Эксплуатация в режиме разделения хранения и вычислений](../../install/choosing-deployment-mode).
