---
{
    "title": "Meta Info Action | Fe Http",
    "language": "en",
    "description": "Used to obtain metadata information about the cluster, including the database list, table list, and table schema."
}
---

# Meta Info Action

## Request

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## Description

Used to obtain metadata information about the cluster, including the database list, table list, and table schema.

    
## Path parameters

* `ns`

    Specify cluster name.

* `db`

    Specify database name.

* `tbl`

    Specify table name.

## Query parameters

None

## Request body

None

## Response

```
{
    "msg":"success",
    "code":0,
    "data":["database list" / "table list" / "table schema"],
    "count":0
}
```

