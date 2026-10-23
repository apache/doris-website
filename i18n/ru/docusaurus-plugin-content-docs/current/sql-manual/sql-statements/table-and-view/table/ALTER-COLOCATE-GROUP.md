---
{
    "title": "ALTER COLOCATE GROUP",
    "language": "ru",
    "description": "Эта инструкция используется для изменения свойств группы колокации."
}
---

## Описание {#description}

Эта инструкция используется для изменения свойств группы колокации.

## Синтаксис {#syntax}

```sql
ALTER COLOCATE GROUP  [<database>.] <group_name>
SET (
    <property_list>
);
```
## Обязательные параметры {#required-parameters}

**1. `<group_name>`**

Укажите имя группы колокации, которую нужно изменить.

**2.`<property_list>`**

`property_list` задаёт свойства `colocation group`; в настоящее время поддерживается изменение только `replication_num` и `replication_allocation`. После изменения этих двух свойств `colocation group` одновременно приведите свойства `default.replication_allocation`, `dynamic.replication_allocation` и replication_allocation существующих разделов таблиц этой группы к тем же значениям.

## Необязательные параметры {#optional-parameters}

**1. `<database>`**

Укажите базу данных, к которой относится изменяемая `colocate group`.

Примечание:
1. Если группа колокации глобальная, то есть её имя начинается с __global__, она не относится ни к одной базе данных.

## Требования к правам доступа {#access-control-requirements}
Требуются права `ADMIN`.

## Примеры {#examples}

1. Изменение количества реплик глобальной группы. При создании таблицы задайте `"colocate_with" = "__global__foo"`.

```sql
ALTER COLOCATE GROUP __global__foo
SET (
    "replication_num"="1"
    );
```

2. Изменение количества реплик неглобальной группы. При создании таблицы задайте "colocate_with" = "bar"; таблица должна относиться к базе данных example_db.
 ```sql 
ALTER COLOCATE GROUP example_db.bar
SET (
    "replication_num"="1"
    );
```
