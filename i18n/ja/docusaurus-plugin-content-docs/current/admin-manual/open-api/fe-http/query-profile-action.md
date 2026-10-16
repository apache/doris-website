---
{
    "title": "クエリプロファイル操作 | FE HTTP",
    "language": "ja",
    "description": "Doris FE の Query Profile REST API。HTTP インターフェースを通じてクエリ情報、実行プロファイル、リアルタイム統計データを取得し、実行中のクエリを監視・制御できます。",
    "sidebar_label": "クエリプロファイル操作"
}
---

# クエリプロファイル操作

## リクエスト

`GET /rest/v2/manager/query/query_info`

`GET /rest/v2/manager/query/trace_id/{trace_id}`

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

`GET /rest/v2/manager/query/profile/graph/{query_id}`

`GET /rest/v2/manager/query/profile/json/{query_id}`

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

`GET /rest/v2/manager/query/current_queries`

`GET /rest/v2/manager/query/kill/{query_id}`

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

## クエリ情報の取得

`GET /rest/v2/manager/query/query_info`

### 説明

クラスター内のすべての FE ノードにある SELECT クエリの情報を取得します。

### クエリパラメータ

* `query_id`

    省略可能。取得するクエリのクエリ ID を指定します。デフォルトでは、すべてのクエリの情報を返します。
    
* `search`

    省略可能。指定した文字列を含むクエリ情報を返します。現時点では文字列一致のみを行います。

* `is_all_node`
  
    省略可能。true の場合はすべての FE ノードのクエリ情報を返し、false の場合は現在の FE ノードのクエリ情報を返します。デフォルトは true です。


### レスポンス

```json
{
   "msg": "success",  
    "code": 0,  
    "data": {  
        "column_names": [  
            "Query ID",  
            "FE Node",  
            "Query User",  
            "Execution Database",  
            "Sql",  
            "Query Type",  
            "Start Time",  
            "End Time",  
            "Execution Duration",  
            "Status"  
        ],  
        "rows": [  
            [  
                ...  
            ]  
        ]  
    },  
    "count": 0  
}
```

:::info 注記

Doris 1.2 以降、Admin ユーザーと Root ユーザーはすべてのクエリを参照できます。一般ユーザーは自分が実行したクエリのみ参照できます。

:::



### 使用例

```json
GET /rest/v2/manager/query/query_info

{
    "msg": "success",  
    "code": 0,  
    "data": {  
        "column_names": [  
            "Query ID",  
            "FE Node",  
            "Query User",  
            "Execution Database",  
            "Sql",  
            "Query Type",  
            "Start Time",  
            "End Time",  
            "Execution Duration",  
            "Status"  
        ],  
        "rows": [  
            [  
                "d7c93d9275334c35-9e6ac5f295a7134b",  
                "127.0.0.1:8030",  
                "root",  
                "default_cluster:testdb",  
                "select c.id, c.name, p.age, p.phone, c.date, c.cost from cost c join people p on c.id = p.id where p.age > 20 order by c.id",  
                "Query",  
                "2021-07-29 16:59:12",  
                "2021-07-29 16:59:12",  
                "109ms",  
                "EOF"  
            ]  
        ]  
    },  
    "count": 0  
}
```

## Trace ID によるクエリ ID の取得

`GET /rest/v2/manager/query/trace_id/{trace_id}`

### 説明

Trace ID からクエリ ID を取得します。

クエリを実行する前に、一意の Trace ID を設定します。

`set session_context="trace_id:your_trace_id";`

同じセッション内でクエリを実行した後、Trace ID からクエリ ID を取得できます。
    
### パスパラメータ

* `{trace_id}`

    ユーザーが指定した Trace ID。

### クエリパラメータ

### レスポンス

```json
{
    "msg": "success", 
    "code": 0, 
    "data": "fb1d9737de914af1-a498d5c5dec638d3", 
    "count": 0
}
```

:::note 情報

Doris 1.2 以降、Admin ユーザーと Root ユーザーはすべてのクエリを参照できます。一般ユーザーは自分が実行したクエリのみ参照できます。指定した Trace ID が存在しない場合や参照権限がない場合は、Bad Request を返します。

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::


## 指定したクエリの SQL とテキストプロファイルの取得

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

### 説明

指定したクエリ ID の SQL とテキスト形式のプロファイルを取得します。
    
### パスパラメータ

* `query_id`

    クエリ ID。

### クエリパラメータ

* `is_all_node`
  
    省略可能。true の場合はすべての FE ノードで指定したクエリ ID を検索し、false の場合は現在接続している FE ノードで検索します。デフォルトは true です。

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "sql": ""
    },
    "count": 0
}
```

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "profile": ""
    },
    "count": 0
}
```

:::note 情報

Doris 1.2 以降、Admin ユーザーと Root ユーザーはすべてのクエリを参照できます。一般ユーザーは自分が実行したクエリのみ参照できます。指定した Trace ID が存在しない場合や参照権限がない場合は、Bad Request を返します。

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```

:::
    
### 使用例

1. SQL を取得します。

    ```json
    GET /rest/v2/manager/query/sql/d7c93d9275334c35-9e6ac5f295a7134b
    
    Response:
    {
        "msg": "success",
        "code": 0,
        "data": {
            "sql": "select c.id, c.name, p.age, p.phone, c.date, c.cost from cost c join people p on c.id = p.id where p.age > 20 order by c.id"
        },
        "count": 0
    }
    ```

## 指定したクエリのフラグメントとインスタンス情報の取得

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

:::caution

2.1.1 以降、この API は非推奨です。プロファイルは引き続き http://<fe_ip>:<fe_http_port>/QueryProfile からダウンロードできます。

:::

### 説明

指定したクエリ ID のフラグメント名、インスタンス ID、ホストの IP アドレスとポート、実行時間を取得します。
    
### パスパラメータ

* `query_id`

    クエリ ID。

### クエリパラメータ

* `is_all_node`
  
    省略可能。true の場合はすべての FE ノードで指定したクエリ ID を検索し、false の場合は現在接続している FE ノードで検索します。デフォルトは true です。

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": [
        {
            "fragment_id": "",
            "time": "",
            "instance_id": {
                "": {
                  "host": "",
                  "active_time": ""
                }
            }
        }
    ],
    "count": 0
}
```

:::note 情報

Doris 1.2 以降、Admin ユーザーと Root ユーザーはすべてのクエリを参照できます。一般ユーザーは自分が実行したクエリのみ参照できます。指定した Trace ID が存在しない場合や参照権限がない場合は、Bad Request を返します。

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::

    
### 使用例

```json
GET /rest/v2/manager/query/profile/fragments/d7c93d9275334c35-9e6ac5f295a7134b

Response:
{
    "msg": "success",
    "code": 0,
    "data": [
        {
            "fragment_id": "0",
            "time": "36.169ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134e": {
                    "host": "172.19.0.4:9060",
                    "active_time": "36.169ms"
                }
            }
        },
        {
            "fragment_id": "1",
            "time": "20.710ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134c": {
                    "host": "172.19.0.5:9060",
                    "active_time": "20.710ms"
                }
            }
        },
        {
            "fragment_id": "2",
            "time": "7.83ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134d": {
                    "host": "172.19.0.6:9060",
                    "active_time": "7.83ms"
                },
                "d7c93d9275334c35-9e6ac5f295a7134f": {
                    "host": "172.19.0.7:9060",
                    "active_time": "10.873ms"
                }
            }
        }
    ],
    "count": 0
}
```

## 指定したクエリ ID のツリー形式プロファイル情報の取得

`GET /rest/v2/manager/query/profile/graph/{query_id}`

### 説明

指定したクエリ ID のツリー形式のプロファイル情報を取得します。`show query profile` コマンドと同じ情報です。
    
### パスパラメータ

* `query_id`

    クエリ ID。

### クエリパラメータ

* `fragment_id` and `instance_id`

    省略可能。両方のパラメータを指定するか、両方とも省略する必要があります。  
    両方を省略した場合は、`show query profile '/query_id'` と同等の簡易プロファイルツリーを返します。  
    両方を指定した場合は、`show query profile '/query_id/fragment_id/instance_id'` と同等の詳細なプロファイルツリーを返します。

* `is_all_node`
  
    省略可能。true の場合はすべての FE ノードで指定したクエリ ID の情報を検索し、false の場合は現在接続している FE ノードで検索します。デフォルトは true です。

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "graph":""
    },
    "count": 0
}
```

:::note 情報

Doris 1.2 以降、Admin ユーザーと Root ユーザーはすべてのクエリを参照できます。一般ユーザーは自分が実行したクエリのみ参照できます。指定した Trace ID が存在しない場合や参照権限がない場合は、Bad Request を返します。

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::



## 実行中のクエリ

`GET /rest/v2/manager/query/current_queries`

### 説明

現在実行中のクエリと実行時統計を返します。このエンドポイントは `SHOW PROC "/current_queries"` および `SHOW PROC "/current_query_stmts"` と同じ統計情報を参照し、タスク単位の進捗とリソース指標（スキャン、CPU、メモリ、シャッフル、スピル、キャッシュ）を提供します。バージョン 4.1.1 以降で利用できます。
    
### パスパラメータ

### クエリパラメータ

* `is_all_node`
  
    省略可能。true に設定すると、すべての FE で現在実行中のクエリを返します。デフォルトは true です。

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "columnNames": [
            "Frontend", "QueryId", "ConnectionId", "Catalog", "Database",
            "User", "ExecTime", "SqlHash", "Statement",
            "ScanRows", "ScanBytes", "ProcessRows", "CpuMs",
            "MaxPeakMemoryBytes", "CurrentUsedMemoryBytes", "WorkloadGroupId",
            "ShuffleSendBytes", "ShuffleSendRows",
            "ScanBytesFromLocalStorage", "ScanBytesFromRemoteStorage",
            "SpillWriteBytesToLocalStorage", "SpillReadBytesFromLocalStorage",
            "BytesWriteIntoCache",
            "TotalTasks", "FinishedTasks", "Progress"
        ],
        "rows": [
            [
                "172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "internal",
                "testdb", "root", "6074",
                "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)",
                "0", "0.00", "0", "0",
                "0.00", "0.00", "0",
                "0.00", "0",
                "0.00", "0.00",
                "0.00", "0.00",
                "0.00",
                "1", "1", "100%"
            ]
        ]
    },
    "count": 0
}
```

| カラム | 説明 |
| ------ | ----------- |
| Frontend | クエリを処理する FE ノード |
| QueryId | 一意のクエリ ID |
| ConnectionId | MySQL 接続 ID |
| Catalog | カタログ名 |
| Database | スキーマまたはデータベースの名前 |
| User | クエリを実行したユーザー |
| ExecTime | 実行時間（ミリ秒） |
| SqlHash | SQL 文の MD5 ハッシュ |
| Statement | SQL 文のテキスト |
| ScanRows | ストレージからスキャンした行の総数 |
| ScanBytes | ストレージからスキャンした総バイト数 |
| ProcessRows | 実行パイプラインで処理した行数 |
| CpuMs | 消費した CPU 時間（ミリ秒） |
| MaxPeakMemoryBytes | 実行中の最大メモリ使用量のピーク値 |
| CurrentUsedMemoryBytes | クエリが現在使用しているメモリ量 |
| WorkloadGroupId | ワークロードグループの ID |
| ShuffleSendBytes | シャッフルで送信した総バイト数 |
| ShuffleSendRows | シャッフルで送信した行の総数 |
| ScanBytesFromLocalStorage | ローカルストレージからスキャンしたバイト数 |
| ScanBytesFromRemoteStorage | リモートストレージ（HDFS、S3 など）からスキャンしたバイト数 |
| SpillWriteBytesToLocalStorage | ローカルディスクにスピルしたバイト数 |
| SpillReadBytesFromLocalStorage | ローカルのスピル先ディスクから読み戻したバイト数 |
| BytesWriteIntoCache | キャッシュに書き込んだバイト数 |
| TotalTasks | このクエリのパイプラインタスクの総数 |
| FinishedTasks | 完了したパイプラインタスクの数 |
| Progress | 算出されたクエリの進捗率（FinishedTasks / TotalTasks） |

## クエリのキャンセル

`POST /rest/v2/manager/query/kill/{query_id}`

### 説明

指定した接続のクエリをキャンセルします。
    
### パスパラメータ

* `{query_id}`

    クエリ ID。`trance_id` API で取得できます。

### クエリパラメータ

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": null,
    "count": 0
}
```

## Trace ID によるクエリの進捗の取得

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

### 説明

Trace ID を指定して、現在実行中のクエリの統計情報を取得します。この API を定期的に呼び出すことで、クエリの進捗を確認できます。

### パスパラメータ

* `{trace_id}`

    Trace ID。`SET session_context="trace_id:xxxx"` で設定したユーザー定義の Trace ID です。

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1234567,
        "scanBytes": 987654321,
        "returnedRows": 12345,
        "processRows": 2345678,
        "cpuMs": 15600,
        "maxPeakMemoryBytes": 536870912,
        "currentUsedMemoryBytes": 268435456,
        "shuffleSendBytes": 104857600,
        "shuffleSendRows": 50000,
        "scanBytesFromLocalStorage": 734003200,
        "scanBytesFromRemoteStorage": 253651121,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 74,
        "finishedTasksNum": 51,
        "progress": "68%"
    },
    "count": 0
}
```
