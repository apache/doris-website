---
{
  "title": "DDL文取得アクション",
  "language": "ja",
  "description": "指定されたテーブルのテーブル作成文、パーティション作成文、およびrollup文を取得するために使用されます。"
}
---
# Get DDL Statement Action

## Request

`GET /api/_get_ddl`

## 説明

指定されたテーブルのテーブル作成ステートメント、パーティション作成ステートメント、rollupステートメントを取得するために使用されます。

## Pathパラメータ

なし

## Queryパラメータ

* `db`

    データベースを指定

* `table`
    
    テーブルを指定

## Request body

なし

## Response

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"create_partition": ["ALTER TABLE `tbl1` ADD PARTITION ..."],
		"create_table": ["CREATE TABLE `tbl1` ...],
		"create_rollup": ["ALTER TABLE `tbl1` ADD ROLLUP ..."]
	},
	"count": 0
}
```
## 例

1. 指定されたテーブルのDDL文を取得する

    ```
    GET GET /api/_get_ddl?db=db1&table=tbl1
    
    Response
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"create_partition": [],
    		"create_table": ["CREATE TABLE `tbl1` (\n  `k1` int(11) NULL COMMENT \"\",\n  `k2` int(11) NULL COMMENT \"\"\n) ENGINE=OLAP\nDUPLICATE KEY(`k1`, `k2`)\nCOMMENT \"OLAP\"\nDISTRIBUTED BY HASH(`k1`) BUCKETS 1\nPROPERTIES (\n\"replication_num\" = \"1\",\n\"version_info\" = \"1,0\",\n\"in_memory\" = \"false\",\n\"storage_format\" = \"DEFAULT\"\n);"],
    		"create_rollup": []
    	},
    	"count": 0
    }
    ```
