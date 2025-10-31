---
{
    "title": "WARM UP",
    "language": "en"
}
---

## Description

The `WARM UP COMPUTE GROUP` statement is used to warm up data in a compute group to improve query performance. The warm-up operation can fetch resources from another compute group or specify particular tables and partitions for warming up. The warm-up operation returns a job ID that can be used to track the status of the warm-up job.


## Syntax

```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name> FORCE;
```
```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;
```
```sql
warm_up_list ::= warm_up_item [AND warm_up_item...];
```
```sql
warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```
## Parameters

| Parameter Name                  | Description                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | The name of the target compute group to be warmed up.                                   |
| source_compute_group_name  | The name of the source compute group from which resources are obtained.                                 |
| warm_up_list              | A list of specific items to be warmed up, which can include tables and partitions.                   |
| table_name                | The name of the table used for warming up.                                         |
| partition_name            | The name of the partition used for warming up.                                       |

## Return Value

* JobId:  The ID of the warm-up job.

## Examples

1. Warm up the compute group named destination_group_name using the compute group named source_group_name

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```

2. Warm up the tables sales_data and customer_info, and the partition q1_2024 of the table orders using the compute group named destination_group.

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```