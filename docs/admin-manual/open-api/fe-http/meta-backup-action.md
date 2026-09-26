---
{
    "title": "Meta Backup Action",
    "language": "en",
    "description": "HTTP APIs that back up FE metadata in compute-storage decoupled mode: create a meta sync point and export the image and BDBJE logs.",
    "keywords": [
        "Doris metadata backup",
        "compute-storage decoupled metadata",
        "sync_cloud_meta",
        "export_meta",
        "meta sync point",
        "BDBJE backup",
        "FE image export",
        "FDB backup",
        "cloud meta backup"
    ]
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Decoupled metadata backup / Disaster recovery drill / Consistent FE and FDB snapshot -->

In compute-storage decoupled mode, cluster metadata lives in two places: the image and BDBJE edit log on the FE side, and FoundationDB (FDB) on the Meta Service side. Backing them up independently produces inconsistent points in time, so a restore may not line up.

These APIs address that: first create a **meta sync point** between FE and FDB, then export FE metadata based on that sync point, so both backups can be aligned to the same moment.

:::info Version note

This feature is supported since version 4.0.8 and is **only available in compute-storage decoupled mode**. Calling it in integrated storage-compute mode returns an error.

:::

## API overview

| API | Method | Purpose |
| --- | --- | --- |
| `/rest/v2/manager/backup/sync_cloud_meta` | POST | Creates a meta sync point between FE and FDB, returning the journal id, committed version, and versionstamp of that sync point |
| `/rest/v2/manager/backup/export_meta` | POST | Exports the FE image, meta files, and BDBJE logs to a specified directory |

## Prerequisites

- The cluster runs in compute-storage decoupled mode (FE config `deploy_mode = cloud`).
- The calling account has the `ADMIN` privilege.
- Both APIs must run on the **Master FE**. When called on a non-master FE, the response returns the master address by default; append `allow_redirect=true` to the URL to redirect automatically.
- `export_meta` requires the FE config `edit_log_type = bdb` (the default).

## Create a meta sync point

<!-- Knowledge Type: Operational Steps -->

**Purpose**: Record a sync point on the Meta Service and write it into the FE edit log, as the anchor that aligns FE and FDB backups.

```shell
curl -u <user>:<passwd> -X POST \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/sync_cloud_meta"
```

**Example response:**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "journal_id": 1024,
        "committed_version": 20250811000000,
        "versionstamp": "0000000000000001"
    },
    "count": 0
}
```

**Response fields:**

| Field | Description |
| --- | --- |
| `journal_id` | The journal id of this sync point in the FE edit log |
| `committed_version` | The committed version returned by the Meta Service |
| `versionstamp` | The corresponding FDB versionstamp, used to align with the FDB backup |

## Export FE metadata

<!-- Knowledge Type: Operational Steps -->

**Purpose**: Export the current FE image and BDBJE logs to a local directory as a restorable FE metadata backup.

```shell
curl -u <user>:<passwd> -X POST \
    -H "Content-Type: application/json" \
    -d '{"target_dir": "/path/to/backup/dir"}' \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/export_meta"
```

**Request body parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `target_dir` | String | Yes | Absolute path of the export target directory. It is created if it does not exist; **if it already exists, all of its contents are cleared first** |

**Example response:**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "target_dir": "/path/to/backup/dir",
        "bdb_dir": "/path/to/backup/dir/bdb",
        "bdb_file_count": 12,
        "image_file": "image.1024",
        "image_version": 1024,
        "image_exported": true,
        "journal_upper_bound": 2048
    },
    "count": 0
}
```

**Response fields:**

| Field | Description |
| --- | --- |
| `target_dir` | The absolute path of the export directory actually used |
| `bdb_dir` | The subdirectory holding the exported BDBJE log files |
| `bdb_file_count` | Number of exported BDBJE log files |
| `image_file` | Name of the exported image file; `null` when no image exists |
| `image_version` | Version of the exported image |
| `image_exported` | Whether an image file was successfully exported |
| `journal_upper_bound` | The largest journal id in BDBJE at export time |

**Export directory layout:**

```text
<target_dir>/
├── image/
│   ├── image.<version>     # The latest image file
│   ├── MODE                # Deployment mode file
│   ├── ROLE                # FE role file
│   └── VERSION             # Cluster version file
└── bdb/
    └── *.jdb               # BDBJE log files
```

During the export the FE holds the checkpoint read lock, so the image cannot be replaced while it is being copied. The image and meta files are hard-linked when possible, falling back to a file copy when hard links are unavailable.

## Full backup procedure

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Scheduled metadata backup / Disaster recovery drill -->

1. Call `sync_cloud_meta` and record the returned `versionstamp` and `committed_version`.
2. Back up the FDB-side metadata based on that `versionstamp`.
3. Call `export_meta` to export the FE metadata to the backup directory.
4. Archive `versionstamp`, `committed_version`, and the export directory together, so a restore can verify that both backups belong to the same point in time.

## FAQ

<!-- Knowledge Type: Troubleshooting -->

| Symptom | Cause | Resolution |
| --- | --- | --- |
| Returns `only works on the cloud mode` | The cluster is not in compute-storage decoupled mode | These APIs only support compute-storage decoupled mode |
| Returns `current fe is not master, master is <host>:<port>` | The request went to a non-master FE | Send the request to the master FE, or append `allow_redirect=true` to the URL |
| Returns `target_dir is required` | The request body is missing `target_dir` | Provide `target_dir` in the JSON request body |
| Returns `only bdb edit_log_type supports bdbje export` | The FE `edit_log_type` is not `bdb` | This API only supports the BDBJE edit log |
| Returns `export failed: bdb min journal id ... is greater than image_version + 1` | The earliest journal in BDBJE is beyond what the image covers, so the exported backup cannot be replayed continuously | Trigger a checkpoint to produce a newer image, then export again |
| Returns `target_dir exists but is not a directory` | `target_dir` points to a file | Use a directory path instead |
