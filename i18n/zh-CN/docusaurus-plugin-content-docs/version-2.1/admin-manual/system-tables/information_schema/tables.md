---
{
    "title": "tables",
    "language": "zh-CN",
    "description": "存储所有的表信息。"
}
---

## 概述

存储所有的表信息。

## 所属数据库


`information_schema`


## 表信息

| 列名            | 类型          | 说明                                        |
| :-------------- | :------------ | :------------------------------------------ |
| TABLE_CATALOG   | varchar(512)  | 所属 Catalog                                |
| TABLE_SCHEMA    | varchar(64)   | 所属 Database                               |
| TABLE_NAME      | varchar(64)   | 表名称                                      |
| TABLE_TYPE      | varchar(64)   | 表类型，包括：SYSTEM VIEW、VIEW、BASE TABLE |
| ENGINE          | varchar(64)   | 表引擎类型                                  |
| VERSION         | bigint        | 无效值                                      |
| ROW_FORMAT      | varchar(10)   | 无效值                                      |
| TABLE_ROWS      | bigint        | 表预估行数                                  |
| AVG_ROW_LENGTH  | bigint        | 表平均行大小                                |
| DATA_LENGTH     | bigint        | 表预估大小                                  |
| MAX_DATA_LENGTH | bigint        | 无效值                                      |
| INDEX_LENGTH    | bigint        | 无效值                                      |
| DATA_FREE       | bigint        | 无效值                                      |
| AUTO_INCREMENT  | bigint        | 无效值                                      |
| CREATE_TIME     | datetime      | 表创建时间                                  |
| UPDATE_TIME     | datetime      | 表数据更新时间                              |
| CHECK_TIME      | datetime      | 无效值                                      |
| TABLE_COLLATION | varchar(32)   | 固定值：utf-8                               |
| CHECKSUM        | bigint        | 无效值                                      |
| CREATE_OPTIONS  | varchar(255)  | 无效值                                      |
| TABLE_COMMENT   | varchar(2048) | 表注释                                      |