---
{
    "title": "CREATE WORKLOAD GROUP",
    "language": "en"
}
---

## Description

This statement is used to create a workload group. Workload groups enable the isolation of cpu resources and memory resources on a single be.

## Syntax

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "<rg_name>"
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## Parameters

1.`<property>`

`<property>` format as `<key>` = `<value>`, and the specific available values for `<key>` are as follows:

| Parameter | Description | Required |
| -- | -- | -- |
| `<cpu_share>` | used to set how much cpu time the workload group can acquire, which can achieve soft isolation of cpu resources. cpu_share is a relative value indicating the weight of cpu resources available to the running workload group. For example, if a user creates 3 workload groups rg-a, rg-b and rg-c with cpu_share of 10, 30 and 40 respectively, and at a certain moment rg-a and rg-b are running tasks while rg-c has no tasks, then rg-a can get (10 / (10 + 30)) = 25% of the cpu resources while workload group rg-b can get 75% of the cpu resources. If the system has only one workload group running, it gets all the cpu resources regardless of the value of its cpu_share. | Y |
| `<memory_limit>` | set the percentage of be memory that can be used by the workload group. The absolute value of the workload group memory limit is: `physical_memory * mem_limit * memory_limit`, where mem_limit is a be configuration item. The total memory_limit of all workload groups in the system must not exceed 100%. Workload groups are guaranteed to use the memory_limit for the tasks in the group in most cases. When the workload group memory usage exceeds this limit, tasks in the group with larger memory usage may be canceled to release the excess memory, refer to enable_memory_overcommit. | Y |
| `<enable_memory_overcommit>` | enable soft memory isolation for the workload group, default is false. if set to false, the workload group is hard memory isolated and the tasks with the largest memory usage will be canceled immediately after the workload group memory usage exceeds the limit to release the excess memory. if set to true, the workload group is hard memory isolated and the tasks with the largest memory usage will be canceled immediately after the workload group memory usage exceeds the limit to release the excess memory. if set to true, the workload group is softly isolated, if the system has free memory resources, the workload group can continue to use system memory after exceeding the memory_limit limit, and when the total system memory is tight, it will cancel several tasks in the group with the largest memory occupation, releasing part of the excess memory to relieve the system memory pressure. It is recommended that when this configuration is enabled for a workload group, the total memory_limit of all workload groups should be less than 100%, and the remaining portion should be used for workload group memory overcommit. | Y |


## Examples

1. Create a workload group named g1:

   ```sql
    create workload group if not exists g1
    properties (
        "cpu_share"="10",
        "memory_limit"="30%",
        "enable_memory_overcommit"="true"
    );
   ```