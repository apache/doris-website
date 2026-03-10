---
{
  "title": "Flink",
  "language": "ja",
  "description": "Flink Doris Connectorを使用することで、Flink（KafkaやMySQLから読み取ったデータなど）によって生成されたデータをリアルタイムでDorisに読み込むことができます。"
}
---
Flink Doris Connectorを使用して、Flink によって生成されたデータ（Kafka や MySQL から読み取られたデータなど）を Doris にリアルタイムでロードできます。

## 制限事項

ユーザーがデプロイした Flink クラスターが必要です。

## Flink を使用したデータロード

Flink を使用したデータロードの詳細な手順については、[Flink-Doris-Connector](../../../ecosystem/flink-doris-connector) を参照してください。以下の手順では、Flink を使用してデータを迅速にロードする方法を示します。

### ステップ 1: テーブルの作成

```sql
CREATE TABLE `students` (
  `id` INT NULL, 
  `name` VARCHAR(256) NULL,
  `age` INT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)      
COMMENT 'OLAP' 
DISTRIBUTED BY HASH(`id`) BUCKETS 1  
PROPERTIES (                                                         
"replication_allocation" = "tag.location.default: 1"
); 
```
### ステップ2: Flinkを使用してデータを読み込む

bin/sql-client.shを実行してFlinkSQLコンソールを開く

```sql
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO student_sink values(1,'zhangsan',123)
```
### ステップ3: 読み込まれたデータの確認

```sql
select * from test.students;                                                                                                                        
+------+----------+------+      
| id   | name     | age  |    
+------+----------+------+                                                                                                                             
|  1   | zhangsan |  123 |   
+------+----------+------+     
```
