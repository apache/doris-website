---
{
    "title": "Doris Streamloader",
    "language": "zh-CN",
    "description": "Doris Streamloader 是 Apache Doris 官方提供的数据导入客户端工具，支持多并发、多文件、断点续传与自动重传，适用于大数据量批量导入场景。"
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader) 是一款用于将数据导入 Apache Doris 数据库的专用客户端工具。相比于直接使用 `curl` 的单并发导入方式，该工具能够提供多并发导入能力，显著降低大数据量导入的耗时。

## 核心功能

| 功能 | 说明 |
|---|---|
| 并发导入 | 实现 Stream Load 的多并发导入，可通过 `workers` 参数设置并发数 |
| 多文件导入 | 一次任务可同时导入多个文件及目录，支持通配符匹配,并自动递归获取文件夹下所有文件 |
| 断点续传 | 导入过程中如出现部分失败，支持从失败点继续传输 |
| 自动重传 | 导入失败后无需手动重传,工具会自动重传默认次数;若仍失败,会打印手动重传命令 |

## 适用场景

- 大数据量（GB 至 TB 级）批量导入 Doris
- 多文件、多目录批量导入
- 对导入耗时敏感、需要利用多并发提升吞吐的场景
- 需要断点续传与失败自动恢复的稳定导入流程

---

## 获取与安装

| 资源 | 地址 |
|---|---|
| 源代码 | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| 二进制下载 | [https://doris.apache.org/zh-CN/download](https://doris.apache.org/zh-CN/download) |

:::note
下载结果即为可执行二进制文件，无需额外编译安装。
:::

---

## 使用方法

### 基本命令格式

```shell
doris-streamloader \
    --source_file={FILE_LIST} \
    --url={FE_OR_BE_SERVER_URL}:{PORT} \
    --header={STREAMLOAD_HEADER} \
    --db={TARGET_DATABASE} \
    --table={TARGET_TABLE}
```

### 必要参数说明

| 参数 | 含义 |
|---|---|
| `--source_file` | 待导入的数据文件列表,支持单文件、目录、通配符与逗号分隔列表 |
| `--url` | Doris FE 或 BE 的服务地址,格式为 `http://host:port` |
| `--header` | Stream Load 的 Header 参数,多个参数之间用 `?` 分隔 |
| `--db` | 目标数据库名称 |
| `--table` | 目标表名称 |

### `source_file` 支持的格式

`--source_file` 参数支持以下五种格式，可根据实际场景灵活选择：

#### 1. 单个文件

例如：导入单个文件 `file.csv`

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 单个目录

例如：导入目录 `dir`

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. 带通配符的文件名（需用引号包围）

例如：导入 `file0.csv`、`file1.csv`、`file2.csv`

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. 逗号分隔的文件名列表

例如：导入 `file0.csv`、`file1.csv`、`file2.csv`

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. 逗号分隔的目录列表

例如：导入 `dir1`、`dir2`、`dir3`

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### Header 参数说明

`--header` 支持 Stream Load 的所有参数，多个参数之间使用 `?` 进行分隔。

示例：

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## 可选参数

除上述必要参数外，工具还提供了一系列可选参数用于精细化控制导入行为。下表按功能分类列出：

### 认证与传输

| 参数 | 含义 | 默认值 | 建议 |
|---|---|---|---|
| `--u` | 数据库用户名 | `root` | —— |
| `--p` | 数据库用户对应的密码 | 空字符串 | —— |
| `--compress` | 数据是否在 HTTP 传输时压缩 | `false` | 保持默认。开启后压缩/解压会分别增加工具与 Doris BE 的 CPU 压力，仅在数据源所在机器网络带宽出现瓶颈时建议开启 |
| `--timeout` | 向 Doris 发送 HTTP 请求的超时时间，单位：秒 | `60*60*10` | 保持默认 |

### 批量与并发

| 参数 | 含义 | 默认值 | 建议 |
|---|---|---|---|
| `--batch` | 文件批量读取和发送的粒度，单位：行 | `4096` | 保持默认 |
| `--batch_byte` | 文件批量读取和发送的粒度，单位：byte | `943718400` (900 MB) | 保持默认 |
| `--workers` | 导入的并发数 | `0` | 设置为 `0` 时为自动模式,会基于导入数据大小、磁盘吞吐量与 Stream Load 导入速度自动计算。也可手动设置,性能好的集群可适当调大,**最好不超过 10**。如观察到导入内存过高(通过 Memtracker 或 Exceed 日志),可适当降低 |
| `--disk_throughput` | 磁盘吞吐量，单位：MB/s | `800` | 通常保持默认。该值参与 `--workers` 自动推算,如希望工具计算出适当的 `workers` 数,可根据实际磁盘吞吐设置 |
| `--streamload_throughput` | Stream Load 导入实际吞吐，单位：MB/s | `100` | 通常保持默认。该值参与 `--workers` 自动推算,默认值基于每日性能测试环境得出。如希望工具计算出适当的 `workers` 数,可根据实测吞吐设置,公式：`(LoadBytes*1000) / (LoadTimeMs*1024*1024)` |
| `--max_byte_per_task` | 每个导入任务的数据量上限,超过则拆分到新任务 | `107374182400` (100 GB) | 建议设置为较大值以减少导入版本数。但若遇到 `body exceed max size` 错误且不想调整 `streaming_load_max_mb`(需重启 BE),或遇到 `-238 TOO MANY SEGMENT`,可临时调小 |

### 数据校验与日志

| 参数 | 含义 | 默认值 | 建议 |
|---|---|---|---|
| `--check_utf8` | 是否对导入数据的编码进行检查：`false` 不检查,直接导入原始数据；`true` 将非 UTF-8 字符替换为 `�` | `true` | 保持默认 |
| `--debug` | 是否打印 Debug 日志 | `false` | 保持默认 |
| `--log_filename` | 日志存储位置 | `""` | 默认输出到控制台。如需写入文件,可指定路径,如 `--log_filename="/var/log"` |

### 失败重传

| 参数 | 含义 | 默认值 | 建议 |
|---|---|---|---|
| `--auto_retry` | 自动重传失败 worker 与 task 序号的列表 | 空字符串 | 仅导入失败时使用,正常导入无需关心。失败时会提示具体参数,复制执行即可。例：`--auto_retry="1,1,2,1"` 表示需重传第 1 个 worker 的第 1 个 task、第 2 个 worker 的第 1 个 task |
| `--auto_retry_times` | 自动重传次数 | `3` | 保持默认。如不希望重传,设置为 `0` |
| `--auto_retry_interval` | 自动重传间隔，单位：秒 | `60` | 保持默认。如 Doris 因宕机导致失败,建议根据实际重启耗时设置 |

---

## 结果说明

无论成功还是失败，工具都会在结束时输出最终结果。

### 结果字段定义

| 字段 | 说明 |
|---|---|
| `Status` | 导入状态：`Success` 表示成功，`Failed` 表示失败 |
| `TotalRows` | 想要导入文件中的总行数 |
| `FailLoadRows` | 想要导入但未导入的行数 |
| `LoadedRows` | 实际导入 Doris 的行数 |
| `FilteredRows` | 导入过程中被 Doris 过滤的行数 |
| `UnselectedRows` | 导入过程中被 Doris 忽略的行数 |
| `LoadBytes` | 实际导入的字节数 |
| `LoadTimeMs` | 实际导入耗时，单位：毫秒 |
| `LoadFiles` | 实际导入的文件列表 |

### 成功示例

导入成功时输出如下：

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

### 失败示例

如果导入过程中部分数据导入失败，工具会先打印重传命令：

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

复制并运行该命令即可完成手动重传，`auto_retry` 含义可参考前述参数说明。随后给出失败结果信息：

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

## 最佳实践

### 参数推荐

1. **必要参数**：必须配置以下参数：

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **如需导入多个文件，推荐使用 `source_file` 方式。**

2. **`workers`**：默认值为 CPU 核数。在 CPU 核数较多的场景（如 96 核）会产生过多并发，需要降低该值，**一般推荐设置为 `8`**。

3. **`max_byte_per_task`**：可设置较大值以减少导入版本数。但如遇到 `body exceed max size` 错误且不想调整 `streaming_load_max_mb`（需重启 BE），或遇到 `-238 TOO MANY SEGMENT` 错误，可临时调小该值。**一般使用默认即可。**

4. **影响版本数的两个关键参数**：

    | 参数 | 影响 | 推荐 |
    |---|---|---|
    | `workers` | worker 数越多，版本数越多，并发越高 | 一般使用 `8` |
    | `max_byte_per_task` | 值越大，单个版本数据量越大,版本数越少;但过大可能引发 `-238 TOO MANY SEGMENT` | 一般使用默认值 |

### 推荐命令

设置必要参数并将 `workers` 设置为 `8` 即可满足大多数场景：

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

### 1. 导入过程中部分子任务失败怎么办？

工具会自动进行重传。如果重传仍然失败，会打印手动重传命令，复制执行即可，无需删表重新导入。

### 2. 单个导入超过了 BE 默认的 `streaming_load_max_mb` 阈值怎么办？

工具默认单个导入上限为 100 GB，可能超出 BE 的 `streaming_load_max_mb` 阈值。在不希望重启 BE 的前提下，可减小 `--max_byte_per_task` 参数。

查看 `streaming_load_max_mb` 大小的方法：

```shell
curl "http://127.0.0.1:8040/api/show_config"
```

### 3. 遇到 `-238 TOO MANY SEGMENT` 错误怎么办？

减小 `--max_byte_per_task` 参数即可缓解该问题。
