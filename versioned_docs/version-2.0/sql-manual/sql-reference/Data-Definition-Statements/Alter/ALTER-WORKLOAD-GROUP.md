---
{
"title": "ALTER-WORKLOAD-GROUP",
"language": "en"
}
---

## ALTER-WORKLOAD-GROUP

### Name

ALTER WORKLOAD GROUP

 

### Description

This statement is used to modify the workload group.

Syntax:

```sql
ALTER WORKLOAD GROUP "rg_name"
PROPERTIES (
    property_list
);
```

NOTE:

* Modify the memory_limit property in such a way that the sum of all memory_limit values does not exceed 100%;
* Support modifying some properties, for example, if only cpu_share is modified, just fill in cpu_share in properties.

### Example

1. Modify the workload group named g1:

    ```sql
    alter workload group g1
    properties (
        "cpu_share"="30",
        "memory_limit"="30%"
    );
    ```

### Keywords

```sql
ALTER, WORKLOAD, GROUP
```

### Best Practice
