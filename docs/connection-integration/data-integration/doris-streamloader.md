---
{
    "title": "Doris Streamloader",
    "language": "en",
    "description": "Doris Streamloader is the official data ingestion client tool from Apache Doris. It supports multi-concurrency, multi-file imports, resumable transfers, and automatic retries, and is suited for batch loading large data volumes."
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader) is a dedicated client tool for ingesting data into the Apache Doris database. Compared with the single-concurrency import approach using `curl` directly, this tool provides multi-concurrency import capability and significantly reduces the time required for loading large data volumes.

## Core Features

| Feature | Description |
|---|---|
| Concurrent import | Performs Stream Load with multiple concurrent workers. The concurrency level is set with the `workers` parameter |
| Multi-file import | Imports multiple files and directories in a single task. Supports wildcard matching and automatically traverses all files under a directory recursively |
| Resumable transfer | If a partial failure occurs during import, the tool can resume from the failure point |
| Automatic retry | After an import failure, no manual retry is needed. The tool retries automatically up to the default number of times. If it still fails, it prints the manual retry command |

## Use Cases

- Batch loading large data volumes (GB to TB scale) into Doris
- Batch importing of multiple files and multiple directories
- Scenarios sensitive to import latency that need multi-concurrency to improve throughput
- Stable import workflows that require resumable transfers and automatic recovery from failures

---

## Download and Installation

| Resource | Address |
|---|---|
| Source code | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| Binary download | [https://doris.apache.org/download](https://doris.apache.org/download) |

:::note
The download is an executable binary. No additional compilation or installation is required.
:::

---

## Usage

### Basic Command Format

```shell
doris-streamloader \
    --source_file={FILE_LIST} \
    --url={FE_OR_BE_SERVER_URL}:{PORT} \
    --header={STREAMLOAD_HEADER} \
    --db={TARGET_DATABASE} \
    --table={TARGET_TABLE}
```

### Required Parameters

| Parameter | Meaning |
|---|---|
| `--source_file` | The list of data files to import. Supports a single file, a directory, wildcards, and a comma-separated list |
| `--url` | The service address of Doris FE or BE, in the format `http://host:port` |
| `--header` | The header parameters for Stream Load. Multiple parameters are separated by `?` |
| `--db` | The name of the target database |
| `--table` | The name of the target table |

### Formats Supported by `source_file`

The `--source_file` parameter supports the following five formats. You can choose flexibly based on your scenario.

#### 1. A Single File

For example, to import a single file `file.csv`:

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. A Single Directory

For example, to import the directory `dir`:

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. A File Name with Wildcards (Must Be Quoted)

For example, to import `file0.csv`, `file1.csv`, and `file2.csv`:

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. A Comma-Separated List of File Names

For example, to import `file0.csv`, `file1.csv`, and `file2.csv`:

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. A Comma-Separated List of Directories

For example, to import `dir1`, `dir2`, and `dir3`:

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### Header Parameter

`--header` supports all parameters of Stream Load. Multiple parameters are separated with `?`.

Example:

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## Optional Parameters

In addition to the required parameters above, the tool provides a series of optional parameters for fine-grained control of the import behavior. The table below groups them by function.

### Authentication and Transport

| Parameter | Meaning | Default | Recommendation |
|---|---|---|---|
| `--u` | Database user name | `root` | —— |
| `--p` | Password for the database user | Empty string | —— |
| `--compress` | Whether data is compressed during HTTP transport | `false` | Keep the default. Enabling compression adds CPU pressure on both the tool and Doris BE for compression and decompression. Enable it only when the network bandwidth on the data source machine is the bottleneck |
| `--timeout` | Timeout for HTTP requests sent to Doris, in seconds | `60*60*10` | Keep the default |

### Batch and Concurrency

| Parameter | Meaning | Default | Recommendation |
|---|---|---|---|
| `--batch` | Granularity for batch reading and sending of files, in rows | `4096` | Keep the default |
| `--batch_byte` | Granularity for batch reading and sending of files, in bytes | `943718400` (900 MB) | Keep the default |
| `--workers` | Concurrency level for the import | `0` | When set to `0`, the tool runs in automatic mode and computes the value based on the size of the imported data, the disk throughput, and the Stream Load import speed. You can also set it manually. For high-performance clusters, you may increase it appropriately, but **preferably no more than 10**. If the import memory is too high (observed via Memtracker or Exceed logs), you can lower it appropriately |
| `--disk_throughput` | Disk throughput, in MB/s | `800` | Usually keep the default. This value participates in the automatic calculation of `--workers`. If you want the tool to compute an appropriate `workers` count, you can set this based on the actual disk throughput |
| `--streamload_throughput` | Actual Stream Load import throughput, in MB/s | `100` | Usually keep the default. This value participates in the automatic calculation of `--workers`. The default value is derived from a daily performance test environment. If you want the tool to compute an appropriate `workers` count, you can set this based on the measured throughput, using the formula: `(LoadBytes*1000) / (LoadTimeMs*1024*1024)` |
| `--max_byte_per_task` | Upper limit on the data volume per import task. When exceeded, the data is split into a new task | `107374182400` (100 GB) | A larger value is recommended to reduce the number of import versions. However, if you encounter a `body exceed max size` error and do not want to adjust `streaming_load_max_mb` (which requires restarting the BE), or if you encounter `-238 TOO MANY SEGMENT`, you can lower it temporarily |

### Data Validation and Logs

| Parameter | Meaning | Default | Recommendation |
|---|---|---|---|
| `--check_utf8` | Whether to check the encoding of the imported data: `false` skips the check and imports the raw data; `true` replaces non-UTF-8 characters with `�` | `true` | Keep the default |
| `--debug` | Whether to print debug logs | `false` | Keep the default |
| `--log_filename` | Where logs are stored | `""` | Logs are output to the console by default. To write logs to a file, specify a path, for example `--log_filename="/var/log"` |

### Failure Retry

| Parameter | Meaning | Default | Recommendation |
|---|---|---|---|
| `--auto_retry` | The list of worker and task numbers to retry automatically | Empty string | Use this only when the import fails. You do not need to set it during normal imports. On failure, the specific parameter values are printed. Just copy and run them. For example, `--auto_retry="1,1,2,1"` means the first task of the first worker and the first task of the second worker need to be retried |
| `--auto_retry_times` | Number of automatic retries | `3` | Keep the default. To disable retries, set it to `0` |
| `--auto_retry_interval` | Interval between automatic retries, in seconds | `60` | Keep the default. If failures are caused by Doris being down, set this based on the actual restart time |

---

## Result

Whether the import succeeds or fails, the tool prints a final result when it finishes.

### Result Fields

| Field | Description |
|---|---|
| `Status` | The import status. `Success` means success and `Failed` means failure |
| `TotalRows` | The total number of rows in the files to be imported |
| `FailLoadRows` | The number of rows that were intended to be imported but were not |
| `LoadedRows` | The number of rows actually imported into Doris |
| `FilteredRows` | The number of rows filtered out by Doris during import |
| `UnselectedRows` | The number of rows ignored by Doris during import |
| `LoadBytes` | The number of bytes actually imported |
| `LoadTimeMs` | The actual import duration, in milliseconds |
| `LoadFiles` | The list of files actually imported |

### Success Example

When the import succeeds, the output is as follows:

```Go
Load Result: {
        "Status": "Success",
        "TotalRows": 120,
        "FailLoadRows": 0,
        "LoadedRows": 120,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 40632,
        "LoadTimeMs": 971,
        "LoadFiles": [
                "basic.csv",
                "basic_data1.csv",
                "basic_data2.csv",
                "dir1/basic_data.csv",
                "dir1/basic_data.csv.1",
                "dir1/basic_data1.csv"
        ]
}
```

### Failure Example

If part of the data fails to import, the tool first prints the retry command:

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

Copying and running this command performs the manual retry. The meaning of `auto_retry` is described in the parameter section above. The failure result is then printed:

```Go
Load Result: {
      "Status": "Failed",
      "TotalRows": 1,
      "FailLoadRows": 1,
      "LoadedRows": 0,
      "FilteredRows": 0,
      "UnselectedRows": 0,
      "LoadBytes": 0,
      "LoadTimeMs": 104,
      "LoadFiles": [
              "/mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1"
      ]
}
```

---

## Best Practices

### Recommended Parameters

1. **Required parameters**: The following parameters must be configured:

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **To import multiple files, use the `source_file` approach.**

2. **`workers`**: The default value is `0`, which enables automatic mode (the tool computes a value from the import size, `disk_throughput`, and `streamload_throughput`, typically yielding 1, 2, 4, or 8). You can also set it manually — for high-performance clusters you may increase it, but **no more than 10 is recommended**. **A common manual value is `8`**.

3. **`max_byte_per_task`**: A larger value reduces the number of import versions. However, if you encounter a `body exceed max size` error and do not want to adjust `streaming_load_max_mb` (which requires restarting the BE), or if you encounter the `-238 TOO MANY SEGMENT` error, you can lower this value temporarily. **The default usually works.**

4. **Two key parameters that affect the number of versions**:

    | Parameter | Effect | Recommendation |
    |---|---|---|
    | `workers` | More workers means more versions and higher concurrency | Usually use `8` |
    | `max_byte_per_task` | A larger value means more data per version and fewer versions, but a value that is too large can trigger `-238 TOO MANY SEGMENT` | Usually use the default |

### Recommended Command

Setting the required parameters and `workers` to `8` is sufficient for most scenarios:

```shell
./doris-streamloader \
    --source_file="demo.csv,demoFile*.csv,demoDir" \
    --url="http://127.0.0.1:8030" \
    --header="column_separator:," \
    --db="demo" \
    --table="test_load" \
    --u="root" \
    --workers=8
```

---

## FAQ

### 1. What should I do if some subtasks fail during import?

The tool retries automatically. If the retries still fail, it prints a manual retry command. Just copy and run it. There is no need to drop the table and reimport.

### 2. What if a single import exceeds the BE default `streaming_load_max_mb` threshold?

The tool's default upper limit per import is 100 GB, which may exceed the BE `streaming_load_max_mb` threshold. To avoid restarting the BE, lower the `--max_byte_per_task` parameter.

To check the value of `streaming_load_max_mb`:

```shell
curl "http://127.0.0.1:8040/api/show_config"
```

### 3. What should I do when the `-238 TOO MANY SEGMENT` error occurs?

Lowering the `--max_byte_per_task` parameter mitigates this issue.
