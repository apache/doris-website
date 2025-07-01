---
{
    "title": "MIGRATE SINGLE TABLET TO A PARTICULAR DISK",
    "language": "zh-CN"
}
---

# MIGRATE SINGLE TABLET TO A PARTICULAR DISK
   
在BE节点上迁移单个tablet到指定磁盘

提交迁移任务：

```
curl -X GET http://be_host:webserver_port/api/tablet_migration?goal=run&tablet_id=xxx&schema_hash=xxx&disk=xxx
```

返回值就是tablet迁移任务的提交结果：

```
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```
或
```
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

查询迁移任务状态：

```
curl -X GET http://be_host:webserver_port/api/tablet_migration?goal=status&tablet_id=xxx&schema_hash=xxx
```

返回值就是tablet迁移任务执行状态：

```
    {
        status: "Success",
        msg: "migration task is running",
        dest_disk: "xxxxxx"
    }
```

或

```
    {
        status: "Success",
        msg: "migration task has finished successfully",
        dest_disk: "xxxxxx"
    }
```

或

```
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```