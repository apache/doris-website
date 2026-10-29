---
{
    "title": "LIST_FILES",
    "language": "zh-CN",
    "description": "列举 S3 文件和目录，返回 path、size 和 FILE 元数据。"
}
---

:::note
自 4.2.0 起支持
:::

## 描述

使用已有 resource 列举 S3 文件，返回元数据，不读取文件正文。默认递归列举所有子目录中的文件。设置 `recursive=false` 时返回直接包含的文件和子目录，目录行的 `size=0`、`file=NULL`。

## 语法

```sql
LIST_FILES(
    "resource" = "<resource_name>",
    "uri" = "s3://<bucket>/<directory>/"
    [, "recursive" = "<true_or_false>"]
)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| resource | 必填非空字符串，指定已有 S3 resource，调用者须有 USAGE 权限。 |
| uri | 必填字符串，格式为 `s3://bucket/directory/` 或路径式 `http(s)://host/bucket/directory/`。bucket 从 URI 取得，无须与 resource 匹配；目录前缀不做编码或解码。 |
| recursive | 可选字符串，默认 `true`。`true` 递归列举所有文件，跳过目录及空目录标记对象；`false` 只返回直接包含的文件和子目录。只接受 true/false，不区分大小写。 |

属性名不区分大小写，未知属性报错。使用 Doris TVF 的命名属性语法 `"name" = "value"`。

## 返回值

| 列 | 类型 | 可为 NULL | 含义 |
| --- | --- | --- | --- |
| path | STRING | 否 | 由 bucket 和原始对象 key 拼接的 S3 路径，不做 URI 转义。目录路径以 `/` 结尾。 |
| size | BIGINT | 否 | 文件字节数；目录为 `0`。 |
| file | FILE | 是 | 目录为 NULL。文件的 uri=path、size=对象字节数，content_type 由文件名推断；checksum 在列举返回的 ETag 去掉外层引号后非空时为 `ETAG:<etag>`，否则为 NULL；offset/inline 为 NULL。 |

key 以 `/` 结尾的对象作为目录标记。当前列举目录自身的标记不会返回。空目录在递归扫描中不产生结果，在父目录的非递归扫描中返回目录行。普通零字节文件在两种模式下都会返回，且 `file` 非 NULL。

## 示例

使用已有的 S3 resource `file_test_s3_resource`，调用者须有 USAGE 权限；配置方式参见 [TO_FILE](../scalar-functions/to-file.md)。假设 `s3://bucket/a/` 包含零字节文件 `empty.txt`、三字节文件 `b/c.png` 和空目录标记 `empty/`。

列举直接包含的文件和子目录：

```sql
SELECT path, size, file IS NULL AS is_directory
FROM LIST_FILES("resource"="file_test_s3_resource", "uri"="s3://bucket/a/", "recursive"="false")
ORDER BY path;
```

```text
path                     size  is_directory
s3://bucket/a/b/          0     1
s3://bucket/a/empty.txt   0     0
s3://bucket/a/empty/      0     1
```

使用默认值递归列举文件：

```sql
SELECT path, size, file IS NULL AS is_directory
FROM LIST_FILES("resource"="file_test_s3_resource", "uri"="s3://bucket/a/")
ORDER BY path;
```

```text
path                     size  is_directory
s3://bucket/a/b/c.png     3     0
s3://bucket/a/empty.txt   0     0
```

列举空目录：

```sql
SELECT * FROM LIST_FILES("resource"="file_test_s3_resource", "uri"="s3://bucket/a/empty/");
```

```text
Empty set (0 rows)
```
