---
{
    "title": "Upload Action",
    "language": "zh-CN",
    "description": "Upload Action 目前主要服务于 FE 的前端页面，用于用户导入一些测试性质的小文件。"
}
---

Upload Action 目前主要服务于 FE 的前端页面，用于用户导入一些测试性质的小文件。

## 上传导入文件

用于将文件上传到 FE 节点，可在稍后用于导入该文件。目前仅支持上传最大 100MB 的文件。

### Request

```
POST /api/<namespace>/<db>/<tbl>/upload
```
    
### Path parameters

* `<namespace>`

    命名空间，目前仅支持 `default_cluster`
    
* `<db>`

    指定的数据库
    
* `<tbl>`

    指定的表

### Query parameters

* `column_separator`

    可选项，指定文件的分隔符。默认为 `\t`
    
* `preview`

    可选项，如果设置为 `true`，则返回结果中会显示最多 10 行根据 `column_separator` 切分好的数据行。

### Request body

要上传的文件内容，Content-type 为 `multipart/form-data`

### Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
        "id": 1,
        "uuid": "b87824a4-f6fd-42c9-b9f1-c6d68c5964c2",
        "originFileName": "data.txt",
        "fileSize": 102400,
        "absPath": "/path/to/file/data.txt"
        "maxColNum" : 5
	},
	"count": 1
}
```

## 导入已上传的文件

### Request

```
PUT /api/<namespace>/<db>/<tbl>/upload
```
    
### Path parameters

* `<namespace>`

    命名空间，目前仅支持 `default_cluster`
    
* `<db>`

    指定的数据库
    
* `<tbl>`

    指定的表

### Query parameters

* `file_id`

    指定导入的文件 id，文件 id 由上传导入文件的 API 返回。

* `file_uuid`

    指定导入的文件 uuid，文件 uuid 由上传导入文件的 API 返回。
    
### Header

Header 中的可选项同 Stream Load 请求中 header 的可选项。

### Request body

要上传的文件内容，Content-type 为 `multipart/form-data`

### Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"TxnId": 7009,
		"Label": "9dbdfb0a-120b-47a2-b078-4531498727cb",
		"Status": "Success",
		"Message": "OK",
		"NumberTotalRows": 3,
		"NumberLoadedRows": 3,
		"NumberFilteredRows": 0,
		"NumberUnselectedRows": 0,
		"LoadBytes": 12,
		"LoadTimeMs": 71,
		"BeginTxnTimeMs": 0,
		"StreamLoadPutTimeMs": 1,
		"ReadDataTimeMs": 0,
		"WriteDataTimeMs": 13,
		"CommitAndPublishTimeMs": 53
	},
	"count": 1
}
```

### Example

```
PUT /api/default_cluster/db1/tbl1/upload?file_id=1&file_uuid=b87824a4-f6fd-42c9-b9f1-c6d68c5964c2
```

