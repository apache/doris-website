---
{
    "title": "SHOW-CREATE-REPOSITORY",
    "language": "zh-CN"
}
---

## SHOW-CREATE-REPOSITORY

### Name

SHOW CREATE REPOSITORY

## 描述

该语句用于展示仓库的创建语句.

语法：

```sql
SHOW CREATE REPOSITORY for repository_name;
```

说明：
- `repository_name`: 仓库名称

## 举例

1. 展示指定仓库的创建语句

   ```sql
   SHOW CREATE REPOSITORY for test_repository
   ```

### Keywords

    SHOW, CREATE, REPOSITORY

### Best Practice

