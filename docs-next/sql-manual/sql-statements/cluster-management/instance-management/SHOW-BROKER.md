---
{
    "title": "SHOW BROKER",
    "language": "en",
    "description": "This statement is used to view the status of the currently existing broker processes."
}
---

## Description

This statement is used to view the status of the currently existing broker processes.

## Syntax：

```sql
SHOW BROKER;
```


## Output
| Column         | DateType | Note                                                           |
|----------------|----------|----------------------------------------------------------------|
| Name           | varchar  | Broker Process Name                                            |
| Host           | varchar  | Broker Process Node IP                                         |
| Port           | varchar  | Broker Process Node Port                                       |
| Alive          | varchar  | Broker Process Node Status                                     |
| LastStartTime  | varchar  | Broker Process Last Start Time                                 |
| LastUpdateTime | varchar  | Broker Process Last Update Time                                |
| ErrMsg         | varchar  | Error message of the last failed startup of the Broker process |


## Access Control Requirements
The user executing this statement needs to have the `ADMIN/OPERATOR` permission.

## Examples

1. View the status of the currently existing broker processes
    ```sql
    show broker;
    ```
    ```text
    +-------------+------------+------+-------+---------------------+---------------------+--------+
    | Name        | Host       | Port | Alive | LastStartTime       | LastUpdateTime      | ErrMsg |
    +-------------+------------+------+-------+---------------------+---------------------+--------+
    | broker_test | 10.10.10.1 | 8196 | true  | 2025-01-21 11:30:10 | 2025-01-21 11:31:40 |        |
    +-------------+------------+------+-------+---------------------+---------------------+--------+
    ```