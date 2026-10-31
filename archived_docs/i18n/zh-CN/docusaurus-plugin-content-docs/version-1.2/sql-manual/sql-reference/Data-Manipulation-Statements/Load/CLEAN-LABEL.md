---
{
    "title": "CLEAN-LABEL",
    "language": "zh-CN"
}
---

## CLEAN-LABEL

### Name

<version since="1.2">

CLEAN LABEL

</version>

## 描述

用于手动清理历史导入作业的 Label。清理后，Label 可以重复使用。

语法:

```sql
CLEAN LABEL [label] FROM db;
```

## 举例

1. 清理 db1 中，Label 为 label1 的导入作业。

	```sql
	CLEAN LABEL label1 FROM db1;
	```

2. 清理 db1 中所有历史 Label。

	```sql
	CLEAN LABEL FROM db1;
	```

### Keywords

    CLEAN, LABEL

### Best Practice

