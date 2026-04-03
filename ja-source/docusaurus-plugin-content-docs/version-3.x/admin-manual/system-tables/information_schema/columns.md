---
{
  "title": "カラム",
  "language": "ja",
  "description": "すべての列情報を表示する。"
}
---
## 概要

すべての列情報を表示します。

## データベース


`information_schema`


## テーブル情報

| Column Name              | タイプ          | 詳細                                                  |
| ------------------------ | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG            | varchar(512)  | カタログ名                                                 |
| TABLE_SCHEMA             | varchar(64)   | データベース名                                                |
| TABLE_NAME               | varchar(64)   | テーブル名                                                   |
| COLUMN_NAME              | varchar(64)   | 列名                                                  |
| ORDINAL_POSITION         | bigint        | テーブル内での列の位置                      |
| COLUMN_DEFAULT           | varchar(1024) | 列のデフォルト値                                  |
| IS_NULLABLE              | varchar(3)    | NULLが許可されているかどうか                                      |
| DATA_TYPE                | varchar(64)   | データ型                                                    |
| CHARACTER_MAXIMUM_LENGTH | bigint        | 文字型で許可される最大文字数     |
| CHARACTER_OCTET_LENGTH   | bigint        | 文字型で許可される最大バイト数          |
| NUMERIC_PRECISION        | bigint        | 数値型の精度                                  |
| NUMERIC_SCALE            | bigint        | 数値型のスケール                                      |
| DATETIME_PRECISION       | bigint        | 日時型の精度                                 |
| CHARACTER_SET_NAME       | varchar(32)   | 文字型の文字セット名、常にNULL          |
| COLLATION_NAME           | varchar(32)   | 文字型の照合アルゴリズム名、常にNULL    |
| COLUMN_TYPE              | varchar(32)   | 列型                                                  |
| COLUMN_KEY               | varchar(3)    | 'UNI'の場合、その列がUnique Key列であることを示す |
| EXTRA                    | varchar(27)   | 自動増分列、生成列などを含む、列に関する追加情報 |
| PRIVILEGES               | varchar(80)   | 常に空                                                 |
| COLUMN_COMMENT           | varchar(255)  | 列のコメント情報                           |
| COLUMN_SIZE              | bigint        | 列の幅                                          |
| DECIMAL_DIGITS           | bigint        | 数値型の小数点以下の桁数                   |
| GENERATION_EXPRESSION    | varchar(64)   | 常にNULL                                                  |
| SRS_ID                   | bigint        | 常にNULL                                                  |
