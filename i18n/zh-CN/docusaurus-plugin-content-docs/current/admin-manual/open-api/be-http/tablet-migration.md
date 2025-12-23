---
{
    "title": "迁移 tablet",
    "language": "zh-CN",
    "description": "在 BE 节点上迁移单个 tablet 到指定磁盘"
}
---

## 请求路径

`GET /api/tablet_migration?goal={enum}&tablet_id={int}&schema_hash={int}&disk={string}`

## 描述

在 BE 节点上迁移单个 tablet 到指定磁盘

## 请求参数

* `goal`
    - `run`：提交迁移任务
    - `status`：查询任务的执行状态

* `tablet_id`
    需要迁移的 tablet 的 id

* `schema_hash`
    schema hash

* `disk`
    目标磁盘。    

## 请求体

无

## 响应

### 提交结果

```json
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```
或
```json
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

### 执行状态

```json
    {
        status: "Success",
        msg: "migration task is running",
        dest_disk: "xxxxxx"
    }
```

或

```json
    {
        status: "Success",
        msg: "migration task has finished successfully",
        dest_disk: "xxxxxx"
    }
```

或

```json
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```

## 示例


    ```shell
    curl "http://127.0.0.1:8040/api/tablet_migration?goal=run&tablet_id=123&schema_hash=333&disk=/disk1"

    ```

