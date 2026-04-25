---
{
    "title": "SHOW WARM UP JOB",
    "language": "en",
    "description": "这些命令用于在 Doris 中显示预热作业。"
}
---

## 描述

这些命令用于在 Doris 中显示预热作业。

## 语法

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## 参数

| 参数                  | 说明                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | 预热作业的 ID                                                |
## 示例

1. 查看所有预热作业

 ```sql
    SHOW WARM UP JOB;
```

2. 查看 id 为 13418 的预热作业

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```

## 参考

 - [管理文件缓存](../../../../compute-storage-decoupled/file-cache)
 - [WARMUP COMPUTE GROUP](./WARM-UP.md)

