---
{
    "title": "SHOW BROKER",
    "language": "zh-CN",
    "description": "该语句用于查看当前存在的 broker 进程状态。"
}
---

## 描述

该语句用于查看当前存在的 broker 进程状态。

## 语法：

```sql
SHOW BROKER;
```


## 输出字段
| 列名             | 类型      | 说明                   |
|----------------|---------|----------------------|
| Name           | varchar | Broker 进程名称          |
| Host           | varchar | Broker 进程所在节点 IP     |
| Port           | varchar | Broker 进程所在节点 Port   |
| Alive          | varchar | Broker 进程状态          |
| LastStartTime  | varchar | Broker 进程上次启动时间      |
| LastUpdateTime | varchar | Broker 进程上次更新时间      |
| ErrMsg         | varchar | Broker 进程上次启动失败的错误信息 |


## 权限控制
执行该语句的用户需要具备 `ADMIN/OPERATOR` 的权限

## 示例
1. 查看当前存在的 broker 进程状态
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