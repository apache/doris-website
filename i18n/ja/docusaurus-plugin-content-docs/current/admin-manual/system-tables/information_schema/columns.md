---
{
    "title": "columns",
    "language": "ja",
    "description": "すべてのカラムの情報を表示します。"
}
---

## 概要

すべてのカラムの情報を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名 | 型 | 説明 |
| -------- | --- | ---- |
| TABLE_CATALOG | varchar(512) | カタログ名 |
| TABLE_SCHEMA | varchar(64) | データベース名 |
| TABLE_NAME | varchar(64) | テーブル名 |
| COLUMN_NAME | varchar(64) | カラム名 |
| ORDINAL_POSITION | bigint | テーブル内でのカラムの位置 |
| COLUMN_DEFAULT | varchar(1024) | カラムのデフォルト値 |
| IS_NULLABLE | varchar(3) | NULL を許容するかどうか |
| DATA_TYPE | varchar(64) | データ型 |
| CHARACTER_MAXIMUM_LENGTH | bigint | 文字型で許容される最大文字数 |
| CHARACTER_OCTET_LENGTH | bigint | 文字型で許容される最大バイト数 |
| NUMERIC_PRECISION | bigint | 数値型の精度 |
| NUMERIC_SCALE | bigint | 数値型のスケール |
| DATETIME_PRECISION | bigint | 日時型の精度 |
| CHARACTER_SET_NAME | varchar(32) | 文字型の文字セット名。常に NULL |
| COLLATION_NAME | varchar(32) | 文字型の照合アルゴリズム名。常に NULL |
| COLUMN_TYPE | varchar(32) | カラムの型 |
| COLUMN_KEY | varchar(3) | 'UNI' の場合、そのカラムが Unique Key カラムであることを示します |
| EXTRA | varchar(27) | 自動インクリメントカラムや生成カラムであるかどうかなど、カラムに関する追加情報 |
| PRIVILEGES | varchar(80) | 常に空 |
| COLUMN_COMMENT | varchar(255) | カラムのコメント情報 |
| COLUMN_SIZE | bigint | カラムの幅 |
| DECIMAL_DIGITS | bigint | 数値型の小数点以下の桁数 |
| GENERATION_EXPRESSION | varchar(64) | 常に NULL |
| SRS_ID | bigint | 常に NULL |
