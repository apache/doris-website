---
{
    "title": "HA Action",
    "language": "en"
}
---

# HA Action

## Request

```
GET /rest/v1/ha
```

## Description

HA Action is used to obtain the high availability group information of the FE cluster.
    
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
		"Observernodes": [],
		"CurrentJournalId": [{
			"Value": 433648,
			"Name": "FrontendRole"
		}],
		"Electablenodes": [{
			"Value": "host1",
			"Name": "host1"
		}],
		"allowedFrontends": [{
			"Value": "name: 192.168.1.1_9213_1597652404352, role: FOLLOWER, 192.168.1.1:9213",
			"Name": "192.168.1.1_9213_1597652404352"
		}],
		"removedFrontends": [],
		"CanRead": [{
			"Value": true,
			"Name": "Status"
		}],
		"databaseNames": [{
			"Value": "433436 ",
			"Name": "DatabaseNames"
		}],
		"FrontendRole": [{
			"Value": "MASTER",
			"Name": "FrontendRole"
		}],
		"CheckpointInfo": [{
			"Value": 433435,
			"Name": "Version"
		}, {
			"Value": "2020-09-03T02:07:37.000+0000",
			"Name": "lastCheckPointTime"
		}]
	},
	"count": 0
}
```
    
