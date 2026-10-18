---
{
    "title": "하드웨어 정보 액션",
    "language": "ko",
    "description": "하드웨어 정보 액션은 현재 FE의 하드웨어 정보를 가져오는 데 사용됩니다."
}
---

# 하드웨어 정보 액션 {#hardware-info-action}

## 요청 {#request}

```
GET /rest/v1/hardware_info/fe/
```

## 설명 {#description}

하드웨어 정보 액션은 현재 FE의 하드웨어 정보를 가져오는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"VersionInfo": {
			"Git": "git://host/core@5bc28f4c36c20c7b424792df662fc988436e679e",
			"Version": "trunk",
			"BuildInfo": "cmy@192.168.1",
			"BuildTime": "Tuesday, 05 September 2019 11:07:42 CST"
		},
		"HardwareInfo": {
			"NetworkParameter": "...",
			"Processor": "...",
			"OS": "...",
			"Memory": "...",
			"FileSystem": "...",
			"NetworkInterface": "...",
			"Processes": "...",
			"Disk": "..."
		}
	},
	"count": 0
}
```

* `HardwareInfo` 필드의 각 값은 HTML 형식으로 표시되는 하드웨어 정보 텍스트입니다.
