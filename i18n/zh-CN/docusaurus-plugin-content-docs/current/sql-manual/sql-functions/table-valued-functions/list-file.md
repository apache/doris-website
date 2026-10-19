---
{
    "title": "LIST_FILE",
    "language": "zh-CN",
    "description": "列举 S3 对象，返回 path 和 FILE 元数据。"
}
---

## 描述

使用已有 resource 列举 S3 目录中的对象，每个文件返回一行，可只列举当前目录，也可递归子目录。此 TVF 返回元数据，不读取文件正文。空目录返回零行。

## 语法

```sql
LIST_FILE(
    "resource" = "<resource_name>",
    "uri" = "s3://<bucket>/<directory>/"
    [, "recursive" = "<true_or_false>"]
)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| resource | 必填非空字符串属性，指定已有 S3 resource，调用者须有 USAGE 权限。 |
| uri | 必填字符串属性，格式为 `s3://bucket/directory/` 或路径式 `http(s)://host/bucket/directory/`，bucket 从 URI 取得，无须与 resource 匹配；目录前缀不做编码或解码。 |
| recursive | 可选字符串属性，默认 `false`。`true` 递归子目录，`false` 只列举当前目录。只接受 true/false，不区分大小写。 |

属性名不区分大小写，未知属性报错。`"name" = "value"` 是 Doris TVF 的命名属性语法，与 S3/HDFS TVF 一致，不是位置参数或 SQL 过滤条件。

## 返回值

| 列 | 类型 | 可为 NULL | 含义 |
| --- | --- | --- | --- |
| path | STRING | 否 | 由 bucket 和原始对象 key 拼接的 S3 路径，不做 URI 转义。 |
| file | FILE | 否 | uri=path，size=对象字节数，content_type 由文件名推断；checksum 在列举返回的 ETag 去掉外层引号后非空时为 `ETAG:<etag>`，否则为 NULL；offset/inline 为 NULL。 |

只返回 `path` 和 `file` 两列。文件大小通过 `ELEMENT_AT(file, 'size')` 获取。

## 示例

使用已有的 `file_test_s3_resource`，调用者须有 USAGE 权限。resource 的配置方式参见 [TO_FILE](../scalar-functions/to-file.md)。以下结果展示测试目录中的两个文件；实际顺序和元数据取决于存储服务，未返回 ETag 时 checksum 为 NULL。

非递归：只列举当前目录中的文件。

```sql
SELECT *
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/",
    "recursive" = "false"
);
```

```text
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| path                                                     | file                                                                                                                                                                                        |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg | {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null} |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

递归：同时列举子目录中的文件。

```sql
SELECT *
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/",
    "recursive" = "true"
);
```

```text
+---------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| path                                                          | file                                                                                                                                                                                            |
+---------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg      | {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null}     |
| s3://linrrzqqq/doris-file-type-test/recursive-test/fltest.jpg | {"uri":"s3://linrrzqqq/doris-file-type-test/recursive-test/fltest.jpg","offset":null,"size":46050,"content_type":"image/jpeg","checksum":"ETAG:CF413A96214E07F3E7CCB82A8B19F792","inline":null} |
+---------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

如果 `doris-file-type-test/empty/` 下没有对象，返回零行：

```sql
SELECT *
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/empty/"
);
```

```text
Empty set (0 rows)
```
