---
{
  "title": "Flink",
  "description": "Flink Doris Connectorを使用することで、Flink（KafkaやMySQLから読み取られたデータなど）によって生成されたデータをDorisにリアルタイムで読み込むことができます。",
  "language": "ja"
}
---
Flink Doris Connectorを使用することで、Flink（KafkaやMySQLから読み取ったデータなど）によって生成されたデータをリアルタイムでDorisに読み込むことができます。

## 制限事項

ユーザーがデプロイしたFlinkクラスターが必要です。

## Flinkを使用したデータの読み込み

Flinkを使用したデータ読み込みの詳細な手順については、Flink-Doris-Connectorを参照してください。以下の手順では、Flinkを使用してデータを素早く読み込む方法を説明します。

### ステップ1：tableの作成

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
### ステップ 2: Flinkを使用してデータを読み込む

bin/sql-client.shを実行してFlinkSQLコンソールを開きます

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
### ステップ 3: 読み込み済みデータの検証

```sql
select * from test.students;                                                                                                                        
+------+----------+------+      
| id   | name     | age  |    
+------+----------+------+                                                                                                                             
|  1   | zhangsan |  123 |   
+------+----------+------+    
```
