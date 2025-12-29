---
{
    "title": "SHOW SNAPSHOT",
    "language": "en",
    "description": "This statement is used to view backups that already exist in the repository."
}
---

## Description

This statement is used to view backups that already exist in the repository.

## Syntax

```sql
SHOW SNAPSHOT ON `<repo_name>`
[WHERE SNAPSHOT = "<snapshot_name>" [AND TIMESTAMP = "<backup_timestamp>"]];
```

## Parameters

**1.`<repo_name>`**

Back up the selected repository name.

**2.`<snapshot_name>`**

Backup name.

**3.`<backup_timestamp>`**

Backup timestamp.

## Return Value

| Column | Description |
| -- | -- |
| Snapshot | The name of the backup |
| Timestamp | corresponds to the time version of the backup |
| Status | corresponds to the time version of the backup |
| Database | The name of the database to which the backup data originally belonged |
| Details | In the form of Json, the data directory and file structure of the entire backup are displayed |

## Example

1. View the existing backups in the repository example_repo
 
```sql
SHOW SNAPSHOT ON example_repo;
```

2. View only the backup named backup1 in the repository example_repo:
 
```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1";
```

3. View the details of the backup named backup1 in the warehouse example_repo with the time version "2018-05-05-15-34-26":

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1" AND TIMESTAMP = "2018-05-05-15-34-26";
```


