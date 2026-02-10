---
{
    "title": "Statistic Action",
    "language": "zh-CN",
    "description": "获取集群统计信息、库表数量等。"
}
---

## Request

`GET /rest/v2/api/cluster_overview`

## Description

获取集群统计信息、库表数量等。
    
## Path parameters

无

## Query parameters

无

## Request body

无

## Response

```
{
    "msg":"success",
    "code":0,
    "data":{"diskOccupancy":0,"remainDisk":5701197971457,"feCount":1,"tblCount":27,"beCount":1,"dbCount":2},
    "count":0
}
```
