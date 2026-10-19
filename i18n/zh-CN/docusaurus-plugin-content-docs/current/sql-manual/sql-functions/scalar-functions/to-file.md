---
{
    "title": "TO_FILE",
    "language": "zh-CN",
    "description": "使用 S3 resource 查询远端文件元数据，返回 FILE。"
}
---

## 描述

使用 S3 resource 查询远端文件元数据，返回 FILE。URI 为 NULL 时返回 NULL，不发起远端请求；resource 仍须存在，调用者仍须拥有 USAGE 权限。

## 语法

```sql
TO_FILE(<resource_name>, <uri>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<resource_name>` | 必填，非 NULL 字符串字面量，指定已有 S3 resource。调用者须有 USAGE 权限。resource 提供 S3 兼容存储的连接配置和访问凭据。 |
| `<uri>` | 必填，CHAR/VARCHAR/STRING 表达式或 NULL。支持 `s3://bucket/key` 或路径式 `http(s)://host/bucket/key`。完整对象 key 按原值使用，不做编码或解码。 |

## 返回值

返回可为 NULL 的 `FILE`。URI 非 NULL 时，远端元数据访问失败会使查询报错，不会转换为 NULL。

| 字段 | 返回内容 |
| --- | --- |
| uri | 原始输入 URI，按原值保存。 |
| offset | NULL。 |
| size | 远端长度，单位为字节；0 表示合法的空文件。 |
| content_type | 合法的远端 MIME 类型，缺失或非法时根据完整原始对象 key 中的文件名推断，默认 `application/octet-stream`。 |
| checksum | 使用 HEAD 返回的 ETag；去掉一对外层双引号后保存为 `ETAG:<etag>`，与 LIST_FILE 一致。转换后为空或缺失时为 NULL。不获取 SHA/CRC 摘要值。 |
| inline | NULL；函数不下载文件正文。 |

## 示例

### S3 兼容存储

由具有 resource 管理权限的用户创建 resource，使用实际存储服务的 endpoint、region、bucket 和凭据替换示例配置。bucket 和文件需要事先存在；其他调用者须有该 resource 的 USAGE 权限。

```sql
CREATE RESOURCE 'file_test_s3_resource' PROPERTIES (
    "type" = "s3",
    "s3.endpoint" = "<endpoint>",
    "s3.region" = "<region>",
    "s3.bucket" = "linrrzqqq",
    "s3.root.path" = "",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>"
);
```

成功执行后创建 resource。以下示例读取 `doris-file-type-test/my-github-avatar.jpg`，大小及其他元数据以实际对象为准。

```sql
SELECT ELEMENT_AT(f, 'uri') AS uri, ELEMENT_AT(f, 'size') AS size
FROM (SELECT TO_FILE('file_test_s3_resource', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg') AS f) t;
```

```text
+----------------------------------------------------------+--------+
| uri                                                      | size   |
+----------------------------------------------------------+--------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg | 158663 |
+----------------------------------------------------------+--------+
```

```sql
SELECT TO_FILE('file_test_s3_resource', NULL) AS res;
```
```text
+------+
| res  |
+------+
| NULL |
+------+
```