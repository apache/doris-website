---
{
  "title": "Flink",
  "language": "ja",
  "description": "Flink Dorisコネクタを使用することで、Flink（KafkaやMySQLから読み取ったデータなど）で生成されたデータをリアルタイムでDorisにロードできます。"
}
---
Flink Doris Connectorを使用することで、Flink（KafkaやMySQLから読み込まれたデータなど）によって生成されたデータをリアルタイムでDorisにロードできます。

## 制限事項

ユーザーがデプロイしたFlinkクラスターが必要です。

## Flinkを使用したデータロード

Flinkを使用したデータロードの詳細な手順については、[Flink-Doris-Connector](../../../ecosystem/flink-doris-connector)を参照してください。以下の手順では、Flinkを使用してデータを迅速にロードする方法を説明します。

### ステップ1：テーブルの作成

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
### Step 2: Flink を使用してデータを読み込む

bin/sql-client.sh を実行して FlinkSQL コンソールを開きます

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
### ステップ3: 読み込まれたデータの検証

```sql
select * from test.students;                                                                                                                        
+------+----------+------+      
| id   | name     | age  |    
+------+----------+------+                                                                                                                             
|  1   | zhangsan |  123 |   
+------+----------+------+    
```
