---
{
    "title": "CLEAN-LABEL",
    "language": "en"
}
---

## CLEAN-LABEL

### Name

CLEAN LABEL

### Description

For manual cleanup of historical load jobs. After cleaning, the Label can be reused.

Syntax:

```sql
CLEAN LABEL [label] FROM db;
```

### Example

1. Clean label label1 from database db1

	```sql
	CLEAN LABEL label1 FROM db1;
	```

2. Clean all labels from database db1

	```sql
	CLEAN LABEL FROM db1;
	```

### Keywords

    CLEAN, LABEL

### Best Practice

