---
{
    "title": "Hardware Info Action",
    "language": "zh-CN",
    "description": "Hardware Info Action 用于获取当前 FE 的硬件信息。"
}
---

# Hardware Info Action

## Request

```
GET /rest/v1/hardware_info/fe/
```

## Description

Hardware Info Action 用于获取当前 FE 的硬件信息。
    
## Path parameters

无

## Query parameters

无

## Request body

无


## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"VersionInfo": {
			"Git": "git://host/core@5bc28f4c36c20c7b424792df662fc988436e679e",
			"Version": "trunk",
			"BuildInfo": "cmy@192.168.1",
			"BuildTime": "二, 05 9月 2019 11:07:42 CST"
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

* 其中 `HardwareInfo` 字段中的各个值的内容，都是以 html 格式展现的硬件信息文本。 
