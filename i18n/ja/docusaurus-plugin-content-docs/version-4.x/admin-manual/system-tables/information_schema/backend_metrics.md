---
{
    "title": "backend_metrics",
    "language": "ja"
}
---

## 概要

Backend ノードのメトリクスを確認するために使用します。

## データベース


`information_schema`


## テーブル情報

| カラム名          | 型           | 説明                         |
| ----------------- | ------------ | ---------------------------- |
| BE_ID             | varchar(256) | Backend インスタンスの ID    |
| BE_IP             | varchar(256) | Backend インスタンスの IP アドレス |
| METRIC_NAME       | varchar(256) | メトリクスの名前             |
| METRIC_TYPE       | varchar(256) | メトリクスの種類             |
| METRIC_VALUE      | varchar(256) | メトリクスの値               |
| TAG               | varchar(256) | メトリクスのタグ             |
