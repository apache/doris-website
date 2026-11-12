---
{
    "title": "SHOW SNAPSHOT",
    "language": "ru",
    "description": "Этот оператор позволяет просматривать резервные копии, уже имеющиеся в репозитории."
}
---

## Описание {#description}

Этот оператор позволяет просматривать резервные копии, уже имеющиеся в репозитории.

## Синтаксис {#syntax}

```sql
SHOW SNAPSHOT ON `<repo_name>`
[WHERE SNAPSHOT = "<snapshot_name>" [AND TIMESTAMP = "<backup_timestamp>"]];
```

## Параметры {#parameters}

**1.`<repo_name>`**

Имя репозитория, выбранного для резервного копирования.

**2.`<snapshot_name>`**

Имя резервной копии.

**3.`<backup_timestamp>`**

Временная метка резервной копии.

## Возвращаемое значение {#return-value}

| Столбец | Описание |
| -- | -- |
| Snapshot | Имя резервной копии |
| Timestamp | Соответствует временной версии резервной копии |
| Status | Соответствует временной версии резервной копии |
| Database | Имя базы данных, которой изначально принадлежали данные резервной копии |
| Details | Каталог данных и файловая структура всей резервной копии в формате JSON |

## Примеры {#example}

1. Просмотр существующих резервных копий в репозитории example_repo

```sql
SHOW SNAPSHOT ON example_repo;
```

2. Просмотр только резервной копии с именем backup1 в репозитории example_repo:

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1";
```

3. Просмотр подробных сведений о резервной копии с именем backup1 в репозитории example_repo с временной версией "2018-05-05-15-34-26":

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1" AND TIMESTAMP = "2018-05-05-15-34-26";
```
