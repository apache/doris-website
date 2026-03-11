---
{
  "title": "backend_metrics",
  "language": "ja"
}
---
## 概要

Backendノードのメトリクスを表示するために使用されます

## データベース


`information_schema`


## テーブル情報

| カラム名           | タイプ        | 説明                                                          |
| ----------------- | ------------ | ------------------------------------------------------------ |
| BE_ID             | varchar(256) | Backendインスタンスの ID                                      |
| BE_IP             | varchar(256) | BackendインスタンスのIPアドレス                                |
| METRIC_NAME       | varchar(256) | メトリクスの名前                                               |
| METRIC_TYPE       | varchar(256) | メトリクスのタイプ                                             |
| METRIC_VALUE      | varchar(256) | メトリクスの値                                                 |
| TAG               | varchar(256) | メトリクスのタグ                                               |
