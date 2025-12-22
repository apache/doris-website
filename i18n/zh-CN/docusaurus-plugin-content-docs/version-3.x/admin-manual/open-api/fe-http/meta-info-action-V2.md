---
{
    "title": "Meta Info Action",
    "language": "zh-CN",
    "description": "获取集群内的元数据信息，包括数据库列表、表列表以及表结构等。"
}
---

## Request

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## Description

获取集群内的元数据信息，包括数据库列表、表列表以及表结构等。

    
## Path parameters

* `ns`

    指定集群名。

* `db`

    指定数据库。

* `tbl`

    指定数据表。

## Query parameters

无

## Request body

无

## Response

```
{
    "msg":"success",
    "code":0,
    "data":["数据库列表" / "数据表列表" /"表结构"],
    "count":0
}
```
