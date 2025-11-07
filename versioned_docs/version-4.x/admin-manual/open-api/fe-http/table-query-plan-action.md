---
{
    "title": "Table Query Plan Action",
    "language": "en"
}
---

# Table Query Plan Action

## Request

`POST /api/<db>/<table>/_query_plan`

## Description

Given a SQL, it is used to obtain the query plan corresponding to the SQL.

This interface is currently used in Spark-Doris-Connector, Spark obtains Doris' query plan.
    
## Path parameters

* `<db>`

    Specify database
    
* `<table>`

    Specify table

## Query parameters

None

## Request body

```
{
	"sql": "select * from db1.tbl1;"
}
```

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"partitions": {
			"10039": {
				"routings": ["10.81.85.89:9062"],
				"version": 2,
				"versionHash": 982459448378619656,
				"schemaHash": 1294206575
			}
		},
		"opaqued_query_plan": "DAABDAACDwABDAAAAAEIAAEAAAAACAACAAAAAAgAAwAAAAAKAAT//////////w8ABQgAAAABAAAAAA8ABgIAAAABAAIACAAMABIIAAEAAAAADwACCwAAAAIAAAACazEAAAACazIPAAMIAAAAAgAAAAUAAAAFAgAEAQAAAA8ABAwAAAACDwABDAAAAAEIAAEAAAAQDAACDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABAAAAAAMAA8IAAEAAAAACAACAAAAAAAIABT/////CAAX/////wAADwABDAAAAAEIAAEAAAAQDAACDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABAAAAAAMAA8IAAEAAAABCAACAAAAAAAIABT/////CAAX/////wAADAAFCAABAAAABgwACAAADAAGCAABAAAAAA8AAgwAAAAAAAoABwAAAAAAAAAACgAIAAAAAAAAAAAADQACCgwAAAABAAAAAAAAJzcKAAEAAAAAAAAnNwoAAgAAAAAAAAACCgADDaJlqbrVdwgIAARNJAZvAAwAAw8AAQwAAAACCAABAAAAAAgAAgAAAAAMAAMPAAEMAAAAAQgAAQAAAAAMAAIIAAEAAAAFAAAACAAE/////wgABQAAAAQIAAYAAAAACAAHAAAAAAsACAAAAAJrMQgACQAAAAACAAoBAAgAAQAAAAEIAAIAAAAADAADDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABP////8IAAUAAAAICAAGAAAAAAgABwAAAAELAAgAAAACazIIAAkAAAABAgAKAQAPAAIMAAAAAQgAAQAAAAAIAAIAAAAMCAADAAAAAQoABAAAAAAAACc1CAAFAAAAAgAPAAMMAAAAAQoAAQAAAAAAACc1CAACAAAAAQgAAwAAAAIIAAQAAAAACwAHAAAABHRibDELAAgAAAAADAALCwABAAAABHRibDEAAAAMAAQKAAFfL5rpxl1I4goAArgs6f+h6eMxAAA=",
		"status": 200
	},
	"count": 0
}
```

Among them, `opaqued_query_plan` is the binary format of the query plan.
    
## Examples

1. Get the query plan of the specified SQL

    ```
    POST /api/db1/tbl1/_query_plan
    {
        "sql": "select * from db1.tbl1;"
    }
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"partitions": {
    			"10039": {
    				"routings": ["192.168.1.1:9060"],
    				"version": 2,
    				"versionHash": 982459448378619656,
    				"schemaHash": 1294206575
    			}
    		},
    		"opaqued_query_plan": "DAABDAACDwABD...",
    		"status": 200
    	},
    	"count": 0
    }
    ```
