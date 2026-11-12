---
{
    "title": "MIGRATE SINGLE TABLET TO A PARTICULAR DISK",
    "language": "en"
}
---

# MIGRATE SINGLE TABLET TO A PARTICULAR DISK
   
Migrate single tablet to a particular disk.

Submit the migration task:

```
curl -X GET http://be_host:webserver_port/api/tablet_migration?goal=run&tablet_id=xxx&schema_hash=xxx&disk=xxx
```

The return is the submission result of the migration task:

```
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```

or

```
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

Show the status of migration task:

```
curl -X GET http://be_host:webserver_port/api/tablet_migration?goal=status&tablet_id=xxx&schema_hash=xxx
```

The return is the execution result of the migration task:

```
    {
        status: "Success",
        msg: "migration task is running.",
        dest_disk: "xxxxxx"
    }
```

or

```
    {
        status: "Success",
        msg: "migration task has finished successfully.",
        dest_disk: "xxxxxx"
    }
```

or

```
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```