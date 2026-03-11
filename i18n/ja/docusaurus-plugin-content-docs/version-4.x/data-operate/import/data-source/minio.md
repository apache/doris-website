---
{
  "title": "MinIO | データソース",
  "sidebar_label": "MinIO",
  "description": "Dorisは、MinIOからファイルを読み込む2つの方法を提供しています：",
  "language": "ja"
}
---
# MinIO

DorisはMinIOからファイルを読み込む2つの方法を提供します：
- S3 Loadを使用してMinIOファイルをDorisに読み込む（非同期読み込み方式）
- TVFを使用してMinIOファイルをDorisに読み込む（同期読み込み方式）

## S3 Loadでの読み込み

S3 Loadを使用してオブジェクトストレージ上のファイルをインポートします。詳細な手順については、[Broker Load Manual](../import-way/broker-load-manual)を参照してください。

### ステップ1: データの準備

CSVファイルs3load_example.csvを作成します。このファイルはMinIOに保存され、内容は以下の通りです：

```
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```
### ステップ 2: Doris でTableを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
### ステップ 3: S3 Load を使用したデータの読み込み

:::caution 注意
ローカルネットワークにMinIOをデプロイし、TLSが有効化されていない場合、エンドポイント文字列に明示的に`http://`を追加する必要があります。

- `"s3.endpoint" = "http://localhost:9000"`

S3 SDKはデフォルトでvirtual-hosted styleを使用します。しかし、MinIOはデフォルトでvirtual-hosted styleアクセスを有効にしません。この場合、`use_path_style`パラメータを追加してpath styleの使用を強制することができます。

- `"use_path_style" = "true"`
:::

```sql
LOAD LABEL s3_load_2022_04_05
(
    DATA INFILE("s3://your_bucket_name/s3load_example.csv")
    INTO TABLE test_s3load
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",  
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```
### ステップ 4: インポートされたデータを確認する

```sql
SELECT * FROM test_s3load;
```
結果:

```
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```
## TVFによる読み込み

### ステップ1: データの準備

CSV ファイル s3load_example.csv を作成します。このファイルは MinIO に保存され、その内容は以下の通りです：

```
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```
### ステップ 2: DorisでTableを作成する

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
### ステップ 3: TVFを使用してデータを読み込む

:::caution 注意
ローカルネットワークにMinIOをデプロイしてTLSを有効にしていない場合、エンドポイント文字列に明示的に`http://`を追加する必要があります。

- `"s3.endpoint" = "http://localhost:9000"`


S3 SDKはデフォルトでvirtual-hosted styleを使用します。しかし、MinIOはデフォルトでvirtual-hosted styleアクセスを有効にしません。この場合、`use_path_style`パラメータを追加してpath styleの使用を強制できます。

- `"use_path_style" = "true"`
:::

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```
### ステップ 4: インポートしたデータの確認

```sql
SELECT * FROM test_s3load;
```
結果:

```
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```
