---
{
    "title": "SHOW WARM UP JOB",
    "language": "en",
    "description": "The commands are used to display warm-up jobs in Doris."
}
---

## Description

The commands are used to display warm-up jobs in Doris.

## Syntax

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## Parameters


| Parameter Name                  | Description                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | The ID of the warm-up job                                                |
## Examples

1. View all warm-up jobs:

 ```sql
    SHOW WARM UP JOB;
```

2. View the warm-up job with ID 13418:

```sql
   SHOW WARM UP JOB WHERE id = 13418;
```


## Related Commands

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)

