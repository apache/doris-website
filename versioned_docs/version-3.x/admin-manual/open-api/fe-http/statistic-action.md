---
{
    "title": "Statistic Action",
    "language": "en",
    "description": "Obtain cluster statistics such as the number of databases and tables."
}
---

# Statistic Action

## Request

`GET /rest/v2/api/cluster_overview`

## Description

Obtain cluster statistics such as the number of databases and tables.
    
## Path parameters

None

## Query parameters

None

## Request body

None

## Response

```
{
    "msg":"success",
    "code":0,
    "data":{"diskOccupancy":0,"remainDisk":5701197971457,"feCount":1,"tblCount":27,"beCount":1,"dbCount":2},
    "count":0
}
```
