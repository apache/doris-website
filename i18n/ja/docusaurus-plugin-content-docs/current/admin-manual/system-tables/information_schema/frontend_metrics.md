---
{
  "title": "frontend_metrics",
  "language": "ja"
}
---
## 概要

Frontendノードのメトリクスを表示するために使用されます

## データベース


`information_schema`


## テーブル情報

| カラム名          | 型           | 説明                                                         |
| ----------------- | ------------ | ------------------------------------------------------------ |
| FE                | varchar(256) | FrontendインスタンスのIPアドレス                             |
| METRIC_NAME       | varchar(256) | メトリクスの名前                                             |
| METRIC_TYPE       | varchar(256) | メトリクスのタイプ                                           |
| METRIC_VALUE      | varchar(256) | メトリクスの値                                               |
| TAG               | varchar(256) | メトリクスのタグ                                             |
