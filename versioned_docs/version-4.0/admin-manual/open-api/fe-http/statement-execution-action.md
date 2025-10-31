---
{
    "title": "Statement Execution Action",
    "language": "en"
}
---

# Statement Execution Action


## Request

```
POST /api/query/<ns_name>/<db_name>
```

## Description

Statement Execution Action is used to execute a statement and return the result.
    
## Path parameters

* `<db_name>`

    Specify the database name. This database will be regarded as the default database of the current session. If the table name in SQL does not qualify the database name, this database will be used.

## Query parameters

None

## Request body

```
{
    "stmt" : "select * from tbl1"
}
```

* sql 字段为具体的 SQL

### Response

* 返回结果集

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "type": "result_set",
            "data": [
                [1],
                [2]
            ],
            "meta": [{
                "name": "k1",
                "type": "INT"
            }],
            "status": {},
            "time": 10
        },
        "count": 0
    }
    ```

    * The type field is `result_set`, which means the result set is returned. The results need to be obtained and displayed based on the meta and data fields. The meta field describes the column information returned. The data field returns the result row. The column type in each row needs to be judged by the content of the meta field. The status field returns some information of MySQL, such as the number of alarm rows, status code, etc. The time field return the execution time, unit is millisecond.

* Return execution result

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "type": "exec_status",
            "status": {}
        },
        "count": 0,
        "time": 10
    }
    ```

    * The type field is `exec_status`, which means the execution result is returned. At present, if the return result is received, it means that the statement was executed successfully.
