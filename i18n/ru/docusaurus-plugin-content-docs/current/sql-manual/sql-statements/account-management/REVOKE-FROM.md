---
{
    "title": "REVOKE FROM",
    "language": "ru",
    "description": "Команда REVOKE выполняет следующие функции:"
}
---

## Описание {#description}

Команда REVOKE выполняет следующие функции:

1. Отзывает указанную привилегию у пользователя или роли.
2. Отзывает указанную роль, ранее назначенную пользователю.

**Связанные команды**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## Синтаксис {#syntax}

**Отзыв указанной привилегии у пользователя или роли**

```sql
REVOKE <privilege_list> 
ON { <priv_level> 
   | RESOURCE <resource_name> 
   | WORKLOAD GROUP <workload_group_name> 
   | COMPUTE GROUP <compute_group_name> 
   | STORAGE VAULT <storage_vault_name> 
   } 
FROM { <user_identity> | ROLE <role_name> }
```

**Отзыв указанной роли, ранее назначенной пользователю**

```sql
REVOKE <role_list> FROM <user_identity> 
```

## Обязательные параметры {#required-parameters}

**1. `<privilege_list>`**

Список отзываемых привилегий, разделённых запятыми. Поддерживаются следующие привилегии:

- NODE_PRIV: Права на операции с узлами кластера
- ADMIN_PRIV: Привилегии администратора
- GRANT_PRIV: Права на предоставление привилегий
- SELECT_PRIV: Права на выполнение запросов
- LOAD_PRIV: Права на импорт данных
- ALTER_PRIV: Права на изменение
- CREATE_PRIV: Права на создание
- DROP_PRIV: Права на удаление
- USAGE_PRIV: Права на использование
- SHOW_VIEW_PRIV: Права на просмотр определения представления

**2. `<priv_level>`**

Задаёт область действия привилегий. Поддерживаются следующие форматы:

- *.*.*: Все Catalog, базы данных и таблицы
- catalog_name.*.*: Все базы данных и таблицы в указанном Catalog
- catalog_name.db.*: Все таблицы в указанной базе данных
- catalog_name.db.tbl: Конкретная таблица в указанной базе данных

**3. `<resource_name>`**

Задаёт имя ресурса. Поддерживаются подстановочные символы `%` (соответствует любой строке) и `_` (соответствует любому одиночному символу).

**4. `<workload_group_name>`**

Задаёт имя группы рабочих нагрузок. Поддерживаются подстановочные символы `%` (соответствует любой строке) и `_` (соответствует любому одиночному символу).

**5. `<compute_group_name>`**

Задаёт имя вычислительной группы. Поддерживаются подстановочные символы `%` (соответствует любой строке) и `_` (соответствует любому одиночному символу).

**6. `<storage_vault_name>`**

Задаёт имя хранилища. Поддерживаются подстановочные символы `%` (соответствует любой строке) и `_` (соответствует любому одиночному символу).


**7. `<user_identity>`**

Задаёт идентификатор пользователя. Пользователь должен быть создан с помощью оператора CREATE USER. Часть идентификатора пользователя, обозначающая хост, может быть доменным именем. Для доменных имён отзыв привилегий может происходить с задержкой до 1 минуты.

**8. `<role_name>`**

Задаёт имя роли. Роль должна существовать.

**9. `<role_list>`**

Список отзываемых ролей, разделённых запятыми. Все указанные роли должны существовать.

Начиная с 4.1.5, имя объекта, для которого задаются привилегии, может содержать не более трёх компонентов: `db`, `db.table` или `catalog.db.table`, включая соответствующие формы с подстановочными символами. Имена с более чем тремя компонентами отклоняются; лишние префиксы больше не игнорируются без уведомления.

## Требования к правам доступа {#access-control-requirements}

Пользователи, выполняющие эту команду SQL, должны иметь как минимум следующие привилегии:

| Привилегия | Объект | Примечания                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | Пользователь или роль   | Только пользователи или роли с привилегией GRANT_PRIV могут выполнять операцию REVOKE. |

Начиная с 4.1.5, пользователю без прав `ADMIN` для предоставления или отзыва привилегий на столбцы требуются как существующая привилегия `GRANT`, так и соответствующая привилегия на таблицу либо соответствующая привилегия на каждый из перечисленных столбцов. Одной привилегии `GRANT` недостаточно, чтобы предоставлять или отзывать привилегии на столбцы, которыми сам пользователь не обладает.

## Примеры {#examples}

Подготовка: создайте пользователей, роли, базу данных и группу рабочих нагрузок, у которых в приведённых ниже примерах отзываются привилегии или роли, и выполните необходимые команды `GRANT`, чтобы каждая операция `REVOKE` имела смысл (нельзя отозвать привилегию, которая никогда не предоставлялась):

```sql
CREATE DATABASE db1;
CREATE USER jack@'192.%' IDENTIFIED BY 'jack_pwd';
CREATE USER jack@'%' IDENTIFIED BY 'jack_pwd';
CREATE ROLE role1;
CREATE ROLE role2;
CREATE ROLE my_role;
CREATE WORKLOAD GROUP g1 PROPERTIES("max_cpu_percent"="10");

GRANT SELECT_PRIV ON db1.* TO 'jack'@'192.%';
GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'192.%';
GRANT 'role1','role2' TO 'jack'@'192.%';
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
GRANT USAGE_PRIV ON STORAGE VAULT '%' TO 'jack'@'%';
```

- Отозвать у пользователя привилегию SELECT на конкретную базу данных:

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```

- Отозвать у пользователя привилегию на использование конкретного ресурса:

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```

- Отозвать роли у пользователя:

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```

- Отозвать у пользователя привилегию на использование конкретной группы рабочих нагрузок:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```

- Отозвать у пользователя привилегию на использование всех групп рабочих нагрузок:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```

- Отозвать у пользователя привилегию на использование всех вычислительных групп:

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```

- Отозвать у роли привилегию на использование вычислительной группы:

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```

- Отозвать у пользователя привилегию на использование всех хранилищ:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```

- Отозвать у роли привилегию на использование хранилища:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```

- Отозвать у роли привилегию на использование всех хранилищ:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
