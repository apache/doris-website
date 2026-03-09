---
{
  "title": "クエリプロファイルアクション | Fe Http",
  "language": "ja",
  "description": "Doris FE Query Profile REST API文書は、HTTP接続を通じてクエリ情報の取得、Profileの実行、リアルタイム統計データの取得、および実行中のクエリの監視と制御をサポートします。",
  "sidebar_label": "Query Profile Action"
}
---
# Query Profile Action

## Request

`GET /rest/v2/manager/query/query_info`

`GET /rest/v2/manager/query/trace/{trace_id}`

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

`GET /rest/v2/manager/query/profile/graph/{query_id}`

`GET /rest/v2/manager/query/profile/json/{query_id}`

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

`GET /rest/v2/manager/query/current_queries`

`GET /rest/v2/manager/query/kill/{query_id}`

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

## クエリ情報を取得する

`GET /rest/v2/manager/query/query_info`

### 説明

クラスター内のすべてのfeノードのselectクエリに関する情報を取得します。

### クエリパラメータ

* `query_id`

    オプション、返されるクエリのクエリIDを指定します。デフォルトではすべてのクエリの情報を返します。
    
* `search`

    オプション、文字列を含むクエリ情報が返されることを指定します。現在は文字列の一致のみが実行されます。

* `is_all_node`
  
    オプション、trueの場合はすべてのfeノードのクエリ情報を返し、falseの場合は現在のfeノードのクエリ情報を返します。デフォルトはtrueです。


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
:::info Note

Doris Version 1.2以降、AdminおよびRootユーザーは全てのクエリを表示できます。一般ユーザーは自分が送信したクエリのみ表示できます。

:::



### Examples

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
## Trace IDによるQuery IDの取得

`GET /rest/v2/manager/query/trace_id/{trace_id}`

### 説明

trace idによってquery idを取得します。

Queryを実行する前に、一意のtrace idを設定してください：

`set session_context="trace_id:your_trace_id";`

同じSession内でQueryを実行した後、trace idを通じてquery idを取得できます。

### パスパラメータ

* `{trace_id}`

    ユーザー固有のtrace id。

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
:::note Info

Doris バージョン 1.2 以降、admin と root ユーザーはすべてのクエリを表示できます。一般ユーザーは自分が送信した Query のみを表示できます。指定された trace id が存在しない場合や権限がない場合は、Bad Request が返されます：

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::


## 指定されたクエリのsqlおよびtextプロファイルを取得する

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

### 説明

指定されたクエリIDのsqlおよびプロファイルテキストを取得します。
    
### パスパラメータ

* `query_id`

    クエリID。

### クエリパラメータ

* `is_all_node`
  
    オプション。trueの場合、すべてのfeノードで指定されたクエリIDを検索し、falseの場合、現在接続されているfeノードで指定されたクエリIDを検索します。デフォルトはtrueです。

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
:::note Info

Doris バージョン 1.2 以降、admin と root ユーザーはすべてのクエリを表示できます。一般ユーザーは自分が送信した Query のみを表示できます。指定された trace id が存在しない、または権限がない場合は、Bad Request が返されます：

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::
    
### 例

1. SQLを取得する。

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
## 指定されたクエリフラグメントとインスタンス情報の取得

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

:::caution

2.1.1以降、このAPIは非推奨です。http://<fe_ip>:<fe_http_port>/QueryProfileからプロファイルをダウンロードできます。

:::

### 説明

指定されたクエリIDのフラグメント名、インスタンスID、ホストip/port、実行時間を取得します。
    
### パスパラメータ

* `query_id`

    クエリID。

### クエリパラメータ

* `is_all_node`
  
    オプション。trueの場合、すべてのfeノードで指定されたクエリIDをクエリし、falseの場合、現在接続されているfeノードで指定されたクエリIDをクエリします。デフォルトはtrueです。

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
:::note Info

Dorisバージョン1.2以降、adminおよびrootユーザーはすべてのクエリを表示できます。通常のユーザーは自分が送信したQueryのみを表示できます。指定されたtrace idが存在しない、または権限がない場合、Bad Requestが返されます：

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::

    
### 例

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
## 指定されたクエリIDのツリープロファイル情報を取得

`GET /rest/v2/manager/query/profile/graph/{query_id}`

### 説明

指定されたクエリIDのツリープロファイル情報を取得します。`show query profile`コマンドと同じです。
    
### パスパラメーター

* `query_id`

    クエリID。

### クエリパラメーター

* `fragment_id` と `instance_id`

    オプション。両方のパラメーターを指定するか、どちらも指定しないかのいずれかです。  
    両方とも指定されない場合、シンプルなプロファイルのツリーが返されます。これは`show query profile '/query_id'`と同等です；  
    両方とも指定された場合、詳細なプロファイルツリーが返されます。これは`show query profile '/query_id/fragment_id/instance_id'`と同等です。

* `is_all_node`
  
    オプション。trueの場合、すべてのfeノードで指定されたクエリIDに関する情報を照会します。falseの場合、現在接続されているfeノードで指定されたクエリIDに関する情報を照会します。デフォルトはtrueです。

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
:::note Info

Dorisバージョン1.2以降、adminとrootユーザーはすべてのクエリを表示できます。一般ユーザーは自分が送信したQueryのみを表示できます。指定されたtrace idが存在しない場合または権限がない場合、Bad Requestが返されます：

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::



## 現在実行中のクエリ

`GET /rest/v2/manager/query/current_queries`

### 説明

`show proc "/current_query_stmts"`と同じで、現在実行中のクエリを返します。
    
### パスパラメータ

### クエリパラメータ

* `is_all_node`
  
    オプション。trueに設定すると、すべてのFEから現在実行中のクエリを返します。デフォルトはtrueです。

### レスポンス

```json
{
	"msg": "success",
	"code": 0,
	"data": {
		"columnNames": ["Frontend", "QueryId", "ConnectionId", "Database", "User", "ExecTime", "SqlHash", "Statement"],
		"rows": [
			["172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "", "root", "6074", "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)"],
			["172.19.0.11", "3606cad4e34b49c6-867bf6862cacc645", "3", "", "root", "9306", "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)"]
		]
	},
	"count": 0
}
```
## クエリのキャンセル

`POST /rest/v2/manager/query/kill/{query_id}`

### 説明

指定された接続のクエリをキャンセルします。
    
### パスパラメータ

* `{query_id}`

    クエリID。クエリIDは`trance_id` apiで取得できます。

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
## Trace IDによるクエリ進捗の取得

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

### 説明

Trace IDによって現在実行中のクエリの統計情報を取得します。このAPIを定期的に呼び出すことで、クエリの進捗を取得できます。

### パスパラメータ

* `{trace_id}`

    Trace ID。`SET session_context="trace_id:xxxx"`で設定されたユーザー定義のTrace ID。

### レスポンス

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1234567,
        "scanBytes": 987654321,
        "returnedRows": 12345,
        "cpuMs": 15600,
        "maxPeakMemoryBytes": 536870912,
        "currentUsedMemoryBytes": 268435456,
        "shuffleSendBytes": 104857600,
        "shuffleSendRows": 50000,
        "scanBytesFromLocalStorage": 734003200,
        "scanBytesFromRemoteStorage": 253651121,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0
    },
    "count": 0
}
```
