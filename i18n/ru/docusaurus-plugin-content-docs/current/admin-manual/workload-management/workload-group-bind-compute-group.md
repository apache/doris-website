---
{
    "title": "Привязка Workload Group к Compute Group: изоляция ресурсов между рабочими нагрузками",
    "sidebar_label": "Привязка Workload Group к Compute Group",
    "language": "ru",
    "description": "Узнайте, как привязать Workload Group к определённой Compute Group в Apache Doris, чтобы независимо управлять квотами ресурсов для разных рабочих нагрузок в архитектурах как с разделением, так и с совмещением хранения и вычислений.",
    "keywords": ["Workload Group", "Compute Group", "Resource Group", "изоляция ресурсов", "мультитенантность", "управление ресурсами", "разделение хранения и вычислений"]
}
---

<!-- Knowledge type: Concept + Procedure -->

## Зачем привязывать Workload Group к Compute Group {#why-bind-workload-group-to-compute-group}

Doris поддерживает логическое объединение узлов BE в кластере с помощью **Compute Group**. Такие группы образуют независимые подкластеры, которые изолируют вычислительные ресурсы разных рабочих нагрузок.

В ранних версиях **действие Workload Group распространялось на все Compute Group**, поэтому разным рабочим нагрузкам приходилось использовать общий набор настроек квот ресурсов. Например:

- Рабочие нагрузки A и B создали собственные Workload Group, и сумма их квот ресурсов уже достигла 100%.
- Рабочая нагрузка A больше не могла создать ни одной Workload Group.
- Требования этих рабочих нагрузок к настройкам Workload Group существенно различались, но прежняя архитектура не позволяла управлять ими независимо для каждой нагрузки.

Для решения этой проблемы в текущей версии появился механизм **привязки Workload Group к Compute Group**, благодаря которому каждая Compute Group может иметь собственный независимый набор настроек Workload Group.

## Связь между Compute Group и Resource Group {#relationship-between-compute-group-and-resource-group}

<!-- Knowledge type: Concept definition -->

| Тип архитектуры | Соответствующее понятие | Описание |
|---------|---------|------|
| С разделением хранения и вычислений | Compute Group | Единица логического разделения на независимые подкластеры |
| С совмещением хранения и вычислений | Resource Group | Функциональный эквивалент Compute Group |

При обсуждении управления ресурсами эти два понятия можно считать логически эквивалентными. **Все описания привязки Workload Group к Compute Group в этом документе применимы к архитектурам как с разделением, так и с совмещением хранения и вычислений.**

## Как это работает {#how-it-works}

<!-- Knowledge type: Concept -->

### Устройство в ранних версиях {#design-in-earlier-versions}

Предположим, в кластере есть Compute Group A, обслуживающая рабочую нагрузку A, и Compute Group B, обслуживающая рабочую нагрузку B, а также две Workload Group, `group_a` и `group_b`, сумма квот ресурсов которых составляет 100%.

В ранних версиях `group_a` и `group_b` действовали на **всех узлах BE** независимо от границ Compute Group, как показано ниже:

![Ранние версии: Workload Group действует глобально](/images/wg_bind_cg1.png)

Это приводило к следующим последствиям:

- После создания `group_a` рабочей нагрузкой A квота ресурсов была полностью исчерпана, и создать дополнительные Workload Group было невозможно.
- Настройки Workload Group для этих двух рабочих нагрузок влияли друг на друга, затрудняя раздельное управление.

### Устройство в текущей версии {#design-in-the-current-version}

В текущей версии Workload Group можно привязать к определённой Compute Group. **Каждая Compute Group имеет собственные независимые настройки Workload Group**, как показано ниже:

![Текущая версия: изоляция Workload Group по Compute Group](/images/wg_bind_cg2.png)

## Использование {#usage}

<!-- Knowledge type: Procedure -->

:::tip Compute Group по умолчанию
В Doris предусмотрен механизм Compute Group по умолчанию: если при добавлении нового узла BE не указана его принадлежность к группе, он автоматически помещается в Compute Group по умолчанию.

| Тип архитектуры | Имя Compute Group по умолчанию |
|---------|----------------------|
| С разделением хранения и вычислений | `default_compute_group` |
| С совмещением хранения и вычислений | `default` |
:::

:::caution Поведение предложения `FOR` зависит от архитектуры
- **Облачный режим (с разделением хранения и вычислений)**: операторы CREATE / ALTER / DROP WORKLOAD GROUP **обязательно** должны явно включать предложение `FOR <compute_group>`. Если оно отсутствует, возникает ошибка: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
- **Необлачный режим (с совмещением хранения и вычислений)**: предложение `FOR <compute_group>` необязательно. Указанное в нём значение фактически обозначает группу ресурсов (Tag), а не Compute Group. Общий с облачным режимом синтаксис используется исключительно для единообразия. Если предложение не указано, используется группа ресурсов по умолчанию (`default`).
:::

### Создание Workload Group {#create-a-workload-group}

**С привязкой к определённой Compute Group:**

```sql
CREATE WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='1024');
```

**Без указания Compute Group (только в необлачном режиме, с привязкой к группе ресурсов по умолчанию):**

```sql
CREATE WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='1024');
```

### Удаление Workload Group {#drop-a-workload-group}

**Из определённой Compute Group:**

```sql
DROP WORKLOAD GROUP group_a FOR compute_group_a;
```

**Без указания Compute Group (только в необлачном режиме, удаление из группы ресурсов по умолчанию):**

```sql
DROP WORKLOAD GROUP group_a;
```

### Изменение свойств Workload Group {#alter-workload-group-properties}

**Изменение свойств Workload Group в определённой Compute Group:**

```sql
ALTER WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='2048');
```

**Без указания Compute Group (только в необлачном режиме, изменение Workload Group в группе ресурсов по умолчанию):**

```sql
ALTER WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='2048');
```

:::note
Оператор `ALTER` используется только для изменения свойств Workload Group. **С его помощью нельзя изменить привязку Workload Group к Compute Group.**
:::

### Ссылка на Workload Group в Workload Policy {#referencing-a-workload-group-from-a-workload-policy}

Поскольку Workload Group принадлежит Compute Group, значение свойства `workload_group` в операторах [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY) / [ALTER WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY) должно соответствовать следующим правилам:

- **Облачный режим (с разделением хранения и вычислений)**: требуется полностью квалифицированное имя вида `<compute_group>.<workload_group>`, например:

    ```sql
    CREATE WORKLOAD POLICY p1 CONDITIONS(query_time > 3000) ACTIONS(cancel_query)
    PROPERTIES('workload_group'='compute_group_a.wg1');
    ```

- **Необлачный режим (с совмещением хранения и вычислений)**: допускаются как `<workload_group>` (группа ресурсов по умолчанию), так и `<resource_group>.<workload_group>`.

## Примечания {#notes}

<!-- Knowledge type: Constraints and limitations -->

1. **Привязку нельзя изменить**: при создании Workload Group закрепляется за определённой Compute Group и не может быть перенесена в другую Compute Group.

2. **Поведение при обновлении**: при обновлении с ранней версии до текущей система на основе существующих Workload Group автоматически создаёт для каждой Compute Group новые Workload Group с прежними именами, но другими ID. Например, если в ранней версии были две Compute Group и одна `group_a`, то после обновления у каждой Compute Group появится собственная новая Workload Group с именем `group_a`, а исходная `group_a`, не принадлежавшая ни одной Compute Group, будет автоматически удалена.

3. **Управление привилегиями не меняется**: проверка привилегий для Workload Group по-прежнему выполняется по имени Workload Group, а подход к управлению остаётся таким же, как в ранних версиях.

4. **Жизненный цикл Workload Group `normal`**: в Doris есть Workload Group по умолчанию с именем `normal`. При создании новой Compute Group система автоматически создаёт для неё соответствующую Workload Group `normal`; при удалении Compute Group связанная с ней Workload Group `normal` также автоматически удаляется. Жизненный цикл Workload Group `normal` полностью управляется системой и не требует ручных действий.
