---
{
    "title": "SHOW PRIVILEGES",
    "language": "ru",
    "description": "Оператор SHOW PRIVILEGES выводит список привилегий, доступных в данный момент в системе баз данных."
}
---

## Описание {#description}

Оператор `SHOW PRIVILEGES` выводит список привилегий, доступных в данный момент в системе баз данных. Он помогает пользователям ознакомиться с типами привилегий, поддерживаемых системой, и получить сведения о каждой из них.

## Синтаксис {#syntax}

```sql
SHOW PRIVILEGES
```

## Возвращаемое значение {#return-value}

  | Столбец | Описание |
  | -- | -- |
  | Privilege | Название привилегии |
  | Context | Область применения |
  | Comment | Описание |

## Требования к управлению доступом {#access-control-requirements}

Для выполнения этой команды SQL пользователю не требуются специальные привилегии.

## Примеры {#examples}

Просмотр всех привилегий

```sql
SHOW PRIVILEGES
```

```text
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Privilege   | Context                                               | Comment                                       |
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Node_priv   | GLOBAL                                                | Privilege for cluster node operations         |
| Admin_priv  | GLOBAL                                                | Privilege for admin user                      |
| Grant_priv  | GLOBAL,CATALOG,DATABASE,TABLE,RESOURCE,WORKLOAD GROUP | Privilege for granting privilege              |
| Select_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for select data in tables           |
| Load_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for loading data into tables        |
| Alter_priv  | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for alter database or table         |
| Create_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for creating database or table      |
| Drop_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for dropping database or table      |
| Usage_priv  | RESOURCE,WORKLOAD GROUP                               | Privilege for using resource or workloadGroup |
+-------------+-------------------------------------------------------+-----------------------------------------------+
```
