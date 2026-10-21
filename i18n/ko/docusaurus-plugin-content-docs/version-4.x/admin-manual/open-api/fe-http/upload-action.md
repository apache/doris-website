---
{
    "title": "업로드 작업",
    "language": "ko",
    "description": "Upload Action은 현재 주로 FE의 프런트엔드 페이지에서 사용되며, 사용자가 작은 테스트 파일의 데이터를 적재하는 데 사용됩니다."
}
---

# 업로드 작업 {#upload-action}

:::caution 동작 변경 (4.1.4)

보안상의 이유로 **4.1.4** 버전부터 모든 Upload Action HTTP 엔드포인트(`/api/<namespace>/<db>/<tbl>/upload`, `/api/<namespace>/<db>/<tbl>/upload/load`, `/api/<namespace>/<db>/<tbl>/upload/delete`)가 제거되었으며, 호출하면 404가 반환됩니다. FE 설정 항목 `http_load_submitter_max_worker_threads`도 함께 제거되었습니다.

작은 파일의 데이터 적재에는 [Stream Load](../../../data-operate/import/import-way/stream-load-manual) 또는 [INSERT INTO ... SELECT ... FROM S3/HDFS/LOCAL TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)를 사용하세요.

이 문서에는 4.1.4 이전 버전의 엔드포인트 참조 정보를 남겨 두었습니다.

:::

Upload Action은 현재 주로 FE의 프런트엔드 페이지에서 사용되며, 사용자가 작은 테스트 파일의 데이터를 적재하는 데 사용됩니다.

## 데이터 적재용 파일 업로드 {#upload-load-file}

나중에 데이터를 적재할 수 있도록 FE 노드에 파일을 업로드하는 데 사용됩니다. 현재 최대 100MB 크기의 파일 업로드만 지원합니다.

### 요청 {#request}

```
POST /api/<namespace>/<db>/<tbl>/upload
```

### 경로 매개변수 {#path-parameters}

* `<namespace>`

    네임스페이스입니다. 현재 `default_cluster`만 지원합니다.
        
* `<db>`

    데이터베이스를 지정합니다.
    
* `<tbl>`

    테이블을 지정합니다.

### 쿼리 매개변수 {#query-parameters}

* `column_separator`

    선택 사항입니다. 파일의 열 구분자를 지정합니다. 기본값은 `\t`입니다.
    
* `preview`

    선택 사항입니다. `true`로 설정하면 `column_separator`에 따라 분리된 데이터가 응답 결과에 최대 10개 행까지 표시됩니다.

### 요청 본문 {#request-body}

업로드할 파일의 내용입니다. Content-type은 `multipart/form-data`입니다.

### 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
        "id": 1,
        "uuid": "b87824a4-f6fd-42c9-b9f1-c6d68c5964c2",
        "originFileName": "data.txt",
        "fileSize": 102400,
        "absPath": "/path/to/file/data.txt",
        "maxColNum" : 5
	},
	"count": 1
}
```

## 업로드한 파일의 데이터 적재 {#load-the-uploaded-file}

### 요청 {#request-1}

```
PUT /api/<namespace>/<db>/<tbl>/upload
```

### 경로 매개변수 {#path-parameters-1}

* `<namespace>`

    네임스페이스입니다. 현재 `default_cluster`만 지원합니다.
    
* `<db>`

    데이터베이스를 지정합니다.
    
* `<tbl>`

    테이블을 지정합니다.

### 쿼리 매개변수 {#query-parameters-1}

* `file_id`

    데이터를 적재할 파일의 ID를 지정합니다. 파일 업로드 API에서 반환하는 값입니다.

* `file_uuid`

    파일의 UUID를 지정합니다. 파일 업로드 API에서 반환하는 값입니다.
    
### 헤더 {#header}

헤더의 옵션은 Stream Load 요청 헤더의 옵션과 동일합니다.

### 요청 본문 {#request-body-1}

없음

### 응답 {#response-1}

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

### 예제 {#example}

```
PUT /api/default_cluster/db1/tbl1/upload?file_id=1&file_uuid=b87824a4-f6fd-42c9-b9f1-c6d68c5964c2
```
