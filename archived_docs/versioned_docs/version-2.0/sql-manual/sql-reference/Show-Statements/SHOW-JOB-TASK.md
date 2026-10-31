---
{
"title": "SHOW-JOB-TASK",
"language": "en"
}
---

## SHOW-JOB-TASK

### Name

SHOW JOB TASK

### Description

This statement is used to display the list of execution results of JOB subtasks, and the latest 20 records will be kept by default.

grammar:

```sql
SHOW JOB TASKS FOR job_name;
```



Result description:

```
                           JobId: JobId
                           TaskId: TaskId
                        StartTime: start execution time
                          EndTime: end time
                           Status: status
                           Result: execution result
                           ErrMsg: error message
```

* State

         There are the following 2 states:
         * SUCCESS
         * FAIL

### Example

1. Display the task execution list of the JOB named test1

     ```sql
     SHOW JOB TASKS FOR test1;
     ```

###Keywords

     SHOW, JOB, TASK

### Best Practice