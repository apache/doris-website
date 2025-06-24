---
{
    "title": "Hardware Info Action",
    "language": "en"
}
---

# Hardware Info Action

## Request

```
GET /rest/v1/hardware_info/fe/
```

## Description

Hardware Info Action is used to obtain the hardware information of the current FE.
    
## Path parameters

None

## Query parameters

None

## Request body

None

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

* The contents of each value in the `HardwareInfo` field are all hardware information text displayed in html format.
