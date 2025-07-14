---
{
    "title": "MINIO",
    "language": "zh-CN"
}
---

本文档介绍访问 MINIO 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问华为云 OBS。**

## 参数总览

参数同 [s3](./s3.md)

但需额外添加如下参数：

```
"use_path_style" = "true"
```

### 配置示例

```
"s3.endpoint" = "play.min.io:9000",  
"s3.region" = "us-east-1",
"s3.access_key" = "admin",
"s3.secret_key" = "password",
"use_path_style" = "true"
```
