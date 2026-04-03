---
{
  "title": "SHOW BROKER",
  "description": "この文は現在存在するbrokerプロセスのステータスを表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、現在存在するbrokerプロセスのステータスを表示するために使用されます。

## Syntax：

```sql
SHOW BROKER;
```
## Output
| Column         | DateType | Note                                                           |
|----------------|----------|----------------------------------------------------------------|
| Name           | varchar  | Brokerプロセス名                                               |
| Host           | varchar  | BrokerプロセスノードIP                                         |
| Port           | varchar  | BrokerプロセスノードPort                                       |
| Alive          | varchar  | BrokerプロセスノードStatus                                     |
| LastStartTime  | varchar  | Brokerプロセス最終開始時刻                                     |
| LastUpdateTime | varchar  | Brokerプロセス最終更新時刻                                     |
| ErrMsg         | varchar  | Brokerプロセスの最後の起動失敗時のエラーメッセージ             |


## アクセス制御要件
このステートメントを実行するユーザーは`ADMIN/OPERATOR`権限を持つ必要があります。

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
