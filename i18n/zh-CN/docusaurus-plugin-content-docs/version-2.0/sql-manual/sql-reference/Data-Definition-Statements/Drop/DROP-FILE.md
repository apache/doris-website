---
{
    "title": "DROP-FILE",
    "language": "zh-CN"
}
---

## DROP-FILE

### Name

DROP FILE

## 描述

该语句用于删除一个已上传的文件。

语法：

```sql
DROP FILE "file_name" [FROM database]
[properties]
```

说明：

- file_name:  文件名。
- database: 文件归属的某一个 db，如果没有指定，则使用当前 session 的 db。
- properties 支持以下参数:
  - `catalog`: 必须。文件所属分类。

## 举例

1. 删除文件 ca.pem

    ```sql
    DROP FILE "ca.pem" properties("catalog" = "kafka");
    ```

### Keywords

    DROP, FILE

### Best Practice

