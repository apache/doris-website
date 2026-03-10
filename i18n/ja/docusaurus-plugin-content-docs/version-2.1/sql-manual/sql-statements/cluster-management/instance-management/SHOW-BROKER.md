---
{
  "title": "SHOW BROKER",
  "language": "ja",
  "description": "このステートメントは、現在存在するbrokerプロセスのステータスを表示するために使用されます。"
}
---
## 説明

このステートメントは、現在存在するbrokerプロセスのステータスを表示するために使用されます。

## 構文：

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
| ErrMsg         | varchar  | Brokerプロセスの最後の起動失敗時のエラーメッセージ |


## アクセス制御要件
このステートメントを実行するユーザーは `ADMIN/OPERATOR` 権限を持つ必要があります。

## 例

1. 現在存在するbrokerプロセスのステータスを表示する

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
