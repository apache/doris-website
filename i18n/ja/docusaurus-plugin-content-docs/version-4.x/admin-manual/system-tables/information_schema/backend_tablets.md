---
{
    "title": "backend_tablets",
    "language": "ja",
    "description": "Backend 上のタブレット情報を表示します（Doris 3.0.7 で追加）。"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 概要 {#overview}

Backend 上のタブレット情報を表示します（Doris 3.0.7 で追加）。

## データベース {#database}


`information_schema`


## テーブル情報 {#table-information}

| カラム名           | 型           | 説明 |
| ------------------ | ------------ | -------------------------------- |
| BE_ID              | bigint       | Backend の ID |
| TABLET_ID          | bigint       | タブレットの ID |
| REPLICA_ID         | bigint       | レプリカの ID |
| PARTITION_ID       | bigint       | パーティションの ID |
| TABLET_PATH        | varchar(256) | タブレットのパス |
| TABLET_LOCAL_SIZE  | bigint       | ローカルストレージ上のタブレットのサイズ |
| TABLET_REMOTE_SIZE | bigint       | リモートストレージ上のタブレットのサイズ |
| VERSION_COUNT      | bigint       | バージョン数 |
| SEGMENT_COUNT      | bigint       | セグメントのサイズ |
| NUM_COLUMNS        | bigint       | カラム数 |
| ROW_SIZE           | bigint       | 行のサイズ |
| COMPACTION_SCORE   | int          | コンパクションスコア |
| COMPRESS_KIND      | varchar(256) | 圧縮の種類 |
| IS_USED            | bool         | タブレットのデータディレクトリが開いているかどうか |
| IS_ALTER_FAILED    | bool         | ALTER 操作が失敗したかどうか |
| CREATE_TIME        | datetime     | タブレットの作成日時 |
| UPDATE_TIME        | datetime     | タブレットへの最終書き込み日時 |
| IS_OVERLAP         | bool         | タブレットが重複しているかどうか |

## コンピュートとストレージの分離型モードにおけるデータサイズの扱い {#data-size-semantics-in-compute-storage-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

このテーブルの情報は BE から直接報告されます。`TABLET_LOCAL_SIZE` と `TABLET_REMOTE_SIZE` は、rowset の実際の保存先に応じて分けられます。リモートストレージに保存された rowset は `TABLET_REMOTE_SIZE` に計上されます。コンピュートとストレージの分離型モードではデータがリモートストレージに保存されるため、データサイズは `TABLET_REMOTE_SIZE` に表示されます。

バージョン 4.0.8 以降、[`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET) と [`information_schema.partitions`](./partitions) の報告内容はこのテーブルと一致します。分離型モードでは、データサイズが一貫してリモートサイズとして報告されます。4.0.8 より前は、これら三つの報告内容が互いに矛盾する場合がありました。
