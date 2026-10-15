---
{
    "title": "rowsets",
    "language": "ja",
    "description": "Rowset の基本情報を返します。"
}
---

## 概要

Rowset の基本情報を返します。

## データベース


`information_schema`


## テーブル情報

| カラム名               | 型          | 説明                                                     |
| ---------------------- | ----------- | -------------------------------------------------------- |
| BACKEND_ID             | bigint      | Backend を一意に識別する ID。                            |
| ROWSET_ID              | varchar(64) | Rowset を一意に識別する ID。                             |
| TABLET_ID              | bigint      | Tablet を一意に識別する ID。                             |
| ROWSET_NUM_ROWS        | bigint      | Rowset に含まれるデータ行数。                            |
| TXN_ID                 | bigint      | Rowset に書き込んだトランザクションの ID。               |
| NUM_SEGMENTS           | bigint      | Rowset に含まれる Segment の数。                         |
| START_VERSION          | bigint      | Rowset の開始バージョン番号。                            |
| END_VERSION            | bigint      | Rowset の終了バージョン番号。                            |
| INDEX_DISK_SIZE        | bigint      | Rowset 内のインデックスが使用するストレージ容量。       |
| DATA_DISK_SIZE         | bigint      | Rowset 内のデータが使用するストレージ容量。             |
| CREATION_TIME          | datetime    | Rowset の作成時刻。                                      |
| NEWEST_WRITE_TIMESTAMP | datetime    | Rowset への直近の書き込み時刻。                         |
| SCHEMA_VERSION         | int         | Rowset のデータに対応するテーブルの Schema バージョン番号。 |
