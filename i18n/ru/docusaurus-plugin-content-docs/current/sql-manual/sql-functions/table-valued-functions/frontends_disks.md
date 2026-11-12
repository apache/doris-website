---
{
    "title": "FRONTENDS_DISKS",
    "language": "ru",
    "description": "Табличная функция frontendsdisks создаёт временную таблицу, позволяющую просматривать сведения о дисках узлов FE в текущем кластере Doris."
}
---

## Описание {#description}

Табличная функция `frontends_disks` создаёт временную таблицу, позволяющую просматривать сведения о дисках узлов FE в текущем кластере Doris. По сути, результат её работы совпадает с данными, которые выводит инструкция `show frontends disks`, однако типы полей в `frontends_disks()` указаны точнее, а таблицу, созданную TVF, можно использовать для фильтрации, соединений и других операций.

Эту функцию можно использовать в предложении `FROM`.


## Синтаксис {#syntax}
```sql
FRONTENDS_DISKS()
```

## Требования к правам доступа {#access-control-requirements}

| Привилегия  | Объект | Примечания |
| :--------- |:-------|:------|
| SELECT_PRIV | internal.information_schema | По умолчанию все пользователи имеют права доступа к этой базе данных |


## Возвращаемое значение {#return-value}

Просмотр полей, возвращаемых функцией frontends_disks()

```sql
desc function frontends_disks();
```
```text
+------------+------+------+-------+---------+-------+
| Field      | Type | Null | Key   | Default | Extra |
+------------+------+------+-------+---------+-------+
| Name       | text | No   | false | NULL    | NONE  |
| Host       | text | No   | false | NULL    | NONE  |
| DirType    | text | No   | false | NULL    | NONE  |
| Dir        | text | No   | false | NULL    | NONE  |
| Filesystem | text | No   | false | NULL    | NONE  |
| Capacity   | text | No   | false | NULL    | NONE  |
| Used       | text | No   | false | NULL    | NONE  |
| Available  | text | No   | false | NULL    | NONE  |
| UseRate    | text | No   | false | NULL    | NONE  |
| MountOn    | text | No   | false | NULL    | NONE  |
+------------+------+------+-------+---------+-------+
```

Описание полей:

| Поле         | Тип     | Описание                                                                                    |
|--------------|---------|---------------------------------------------------------------------------------------------|
| `Name`       | TEXT    | Уникальный идентификатор узла frontend (FE).                                                 |
| `Host`       | TEXT    | IP-адрес или имя хоста узла frontend.                                                        |
| `DirType`    | TEXT    | Тип каталога (например, `meta`, `log`, `audit-log`, `temp`, `deploy`).                        |
| `Dir`        | TEXT    | Путь к каталогу на диске для указанного типа каталога.                                       |
| `Filesystem` | TEXT    | Тип файловой системы.                                                                       |
| `Capacity`   | TEXT    | Общий объём диска.                                                                          |
| `Used`       | TEXT    | Объём занятого дискового пространства.                                                       |
| `Available`  | TEXT    | Объём дискового пространства, доступного для использования.                                  |
| `UseRate`    | TEXT    | Доля занятого дискового пространства в процентах.                                           |
| `MountOn`    | TEXT    | Точка монтирования диска в файловой системе.                                                 |


## Пример {#example}
```sql
select * from frontends_disks();
```
```text
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| Name                                    | Host       | DirType   | Dir                                                       | Filesystem   | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | meta      | /mnt/disk2/doris/fe/doris-meta | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | log       | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | audit-log | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | temp      | /mnt/disk2/doris/fe/temp_dir   | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | deploy    | /mnt/disk2/doris/fe            | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
```
