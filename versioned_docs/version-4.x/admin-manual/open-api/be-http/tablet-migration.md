---
{
    "title": "Migration Tablet",
    "language": "en"
}
---

# Migration Tablet

## Request

`GET /api/tablet_migration?goal={enum}&tablet_id={int}&schema_hash={int}&disk={string}`

## Description

Migrate a tablet to the specified disk.

## Query parameters

* `goal`
    - `run`：submit the migration task
    - `status`：show the status of migration task

* `tablet_id`
    ID of the tablet

* `schema_hash`
    Schema hash

* `disk`
    The specified disk.

## Request body

None

## Response

### Submit Task

```
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```
Or
```
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

### Show Status

```
    {
        status: "Success",
        msg: "migration task is running",
        dest_disk: "xxxxxx"
    }
```

Or

```
    {
        status: "Success",
        msg: "migration task has finished successfully",
        dest_disk: "xxxxxx"
    }
```

Or

```
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```

## Examples


    ```
    curl "http://127.0.0.1:8040/api/tablet_migration?goal=run&tablet_id=123&schema_hash=333&disk=/disk1"

    ```

