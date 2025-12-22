---
{
    "title": "SHOW CHARSET",
    "language": "zh-CN",
    "description": "\"SHOW CHARSET\" 命令用于显示当前数据库管理系统中可用的字符集（character set）以及与每个字符集相关联的一些属性。"
}
---

## 描述

"SHOW CHARSET" 命令用于显示当前数据库管理系统中可用的字符集（character set）以及与每个字符集相关联的一些属性。

这些属性可能包括字符集的名称、默认排序规则、最大字节长度等。通过运行 "SHOW CHARSET" 命令，可以查看系统中支持的字符集列表及其详细信息。

## 语法
```sql
SHOW CHARSET
```

## 返回值
| 列名 | 说明 |
| -- | -- |
| Charset | 字符集 |
| Description | 描述 |
| Default Collation | 默认校对名称 |
| Maxlen | 最大字节长度 |

## 示例

```sql
SHOW CHARSET;
```

```text
+---------+---------------+-------------------+--------+
| Charset | Description   | Default collation | Maxlen |
+---------+---------------+-------------------+--------+
| utf8mb4 | UTF-8 Unicode | utf8mb4_0900_bin  | 4      |
+---------+---------------+-------------------+--------+
```

