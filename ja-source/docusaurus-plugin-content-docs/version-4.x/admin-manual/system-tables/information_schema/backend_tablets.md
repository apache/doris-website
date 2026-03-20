---
{
  "title": "backend_tablets",
  "language": "ja",
  "description": "Backends上でtalletの情報を表示します。（doris 3.0.7で追加）"
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

## 概要

Backend上のtabletの情報を表示します。（doris 3.0.7で追加）

## データベース

`information_schema`

## テーブル情報

| カラム名           | 型           | 説明                            |
| ------------------ | ------------ | -------------------------------- |
| BE_ID              | bigint       | BackendのID                      |
| TABLET_ID          | bigint       | TabletのID                       |
| REPLICA_ID         | bigint       | replicaのID                      |
| PARTITION_ID       | bigint       | partitionのID                    |
| TABLET_PATH        | varchar(256) | tabletのPath                     |
| TABLET_LOCAL_SIZE  | bigint       | local上のtabletのSize            |
| TABLET_REMOTE_SIZE | bigint       | remote上のtabletのSize           |
| VERSION_COUNT      | bigint       | versionの数                      |
| SEGMENT_COUNT      | bigint       | segmentのサイズ                  |
| NUM_COLUMNS        | bigint       | カラムの数                       |
| ROW_SIZE           | bigint       | 行のサイズ                       |
| COMPACTION_SCORE   | int          | Compaction Score                 |
| COMPRESS_KIND      | varchar(256) | 圧縮の種類                       |
| IS_USED            | bool         | tablet datadirが開かれているか    |
| IS_ALTER_FAILED    | bool         | alter操作が失敗したかどうか       |
| CREATE_TIME        | datetime     | Tablet作成時刻                   |
| UPDATE_TIME        | datetime     | Tabletの最終書き込み時刻          |
| IS_OVERLAP         | bool         | tabletが重複しているかどうか      |
