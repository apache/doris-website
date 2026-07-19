---
{
    "title": "Manually Trigger Compaction",
    "language": "en",
    "description": "POST /api/compaction/run?tableid={int}&compacttype=full Note that tableid=xxx will take effect only when compacttype=full is specified."
}
---

# Manually Trigger Compaction

## Request

`POST /api/compaction/run?tablet_id={int}&compact_type={enum}`
`POST /api/compaction/run?table_id={int}&compact_type=full` Note that table_id=xxx will take effect only when compact_type=full is specified.
`GET /api/compaction/run_status?tablet_id={int}`


## Description

Used to manually trigger the comparison and show status.

## Query parameters

* `tablet_id`
    - ID of the tablet

* `table_id`
    - ID of table. Note that table_id=xxx will take effect only when compact_type=full is specified, and only one tablet_id and table_id can be specified, and cannot be specified at the same time. After specifying table_id, full_compaction will be automatically executed for all tablets under this table.

* `compact_type`
    - The value is `base` or `cumulative` or `full`. For usage scenarios of full_compaction, please refer to [Data Recovery](../../trouble-shooting/repairing-data).

## Request body

None

## Response

### Trigger Compaction

If the tablet does not exist, an error in JSON format is returned:

```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```

If the tablet exists and the tablet is not running, JSON format is returned:

```
{
    "status": "Fail",
    "msg": "fail to execute compaction, error = -2000"
}
```

If the tablet exists and the tablet is running, JSON format is returned:

```
{
    "status": "Success",
    "msg": "compaction task is successfully triggered."
}
```

Explanation of results:

* status: Trigger task status, when it is successfully triggered, it is Success; when for some reason (for example, the appropriate version is not obtained), it returns Fail.
* msg: Give specific success or failure information.

### Show Status

If the tablet does not exist, an error in JSON format is returned:
```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```
If the tablet exists and the tablet is not running, JSON format is returned:

```
{
    "status" : "Success",
    "run_status" : false,
    "msg" : "this tablet_id is not running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : ""
}
```

If the tablet exists and the tablet is running, JSON format is returned:
```
{
    "status" : "Success",
    "run_status" : true,
    "msg" : "this tablet_id is running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : "cumulative"
}
```

Explanation of results:

* run_status: Get the current manual compaction task execution status.

### Examples

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=cumulative"
```