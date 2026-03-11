---
{
  "title": "マルチストリーム更新による一意モデル",
  "language": "ja"
}
---
## 概要
replace操作の同時実行競合解決を保証するため、Dorisのuniqueテーブルはsequence列に基づく更新機能を提供します。つまり、同じkey列の下で、REPLACEアグリゲーションタイプの列はsequence列の値に従って置換されます。より大きな値はより小さな値を置換できますが、その逆はできません。
ただし、一部のビジネスシナリオでは、ビジネスが2つ以上のデータストリームを通じて同じワイドテーブルの異なる列を更新する必要があります。例えば、あるデータストリームはリアルタイムで書き込みを行い、テーブルの一部のフィールドを更新します。別のデータストリームはオンデマンドでインポートを実行し、テーブルの他の列を更新します。更新中、両方のストリームジョブはreplace操作の順序を保証する必要があります。さらに、クエリ中は、すべての列のデータにクエリでアクセスできる必要があります。

## Sequence Mapping
上記の問題に対処するため、Dorisはsequence mapping機能をサポートします。この機能は、更新対象の列と対応するsequence列の間のマッピング関係を指定することで、複数ストリームからの同時更新の問題を解決します。

| A | B | C | D | E | s1 | s2 |
|---|---|---|---|---|----|----|

上記のテーブルをuniqueテーブルのすべての列と仮定します。ここで、ABはkey列、CDEはvalue列です。
「ABCD」は1つのデータストリームによって生成されるデータを表し、「ABE」は別のデータストリームによって生成されるデータを表します。両方のストリームは同じテーブルに書き込む必要があります。
ただし、ABCDとABEのデータ生成と更新のタイミングは同期していません（間隔が非常に長い可能性があります）。このため、書き込み前にすべての列データを連結することは実用的ではありません（または大幅なコストが必要です）。

2つの列s1とs2をsequence列として追加導入し、2つのストリームからのデータ更新を制御します。
s1は列CとDのデータのバージョン管理に使用され、s2は列Eのデータのバージョン管理に使用されます。インポート時や他の更新操作時、2つのストリームからのデータは互いに干渉しません。各ストリームは独自のsequence列に基づいて更新操作を完了します。


### 使用例

**1. sequence mappingをサポートするテーブルの作成**

sequence mappingをサポートするテーブルを作成し、列cとdの更新がsequence列s1に依存し、列eの更新がsequence列s2に依存することを指定します。
Sequence列は整数型と時間型（DATE、DATETIME）にできます。作成後は列の型を変更することはできません。

```sql
CREATE TABLE `upsert_test` (
  `a` bigint(20) NULL COMMENT "",
  `b` int(11) NULL COMMENT "",
  `c` int(11) NULL COMMENT "",
  `d` int(11) NULL COMMENT "",
  `e` int(11) NULL COMMENT "",
  `s1` int(11) NULL COMMENT "",
  `s2` int(11) NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
"enable_unique_key_merge_on_write"="false",
"light_schema_change"="true",
"replication_num" = "1",
"sequence_mapping.s1" = "c,d",
"sequence_mapping.s2" = "e"
);
```
テーブル構造は以下の通りです：

```sql
MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| s2    | int    | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
```
**2. データの挿入とクエリ**

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,2,2,2);
Query OK, 1 row affected (0.080 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
1 row in set (0.049 sec)

MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1);
Query OK, 1 row affected (0.048 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
1 row in set (0.021 sec)

MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.043 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 |    2 |    2 |    2 |
+------+------+------+------+------+------+------+
1 row in set (0.019 sec)

MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,3,3,3);
Query OK, 1 row affected (0.049 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    2 |    3 |    2 |
+------+------+------+------+------+------+------+
1 row in set (0.019 sec)

MySQL > insert into upsert_test(a, b, c, d, s1,e,s2) values(1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+------+
1 row in set (0.019 sec)
```
最初の挿入では、eとs2が書き込まれていないため、eとs2に対して読み取られる値はnullになります。

2回目の挿入では、s1の値が最初の挿入で書き込まれた値より小さいため、c、d、s1の値は変更されません。

3回目の挿入では、eとs2の値が書き込まれるとき、すべての列が正しい値を持ちます。

4回目の挿入では、s1の値が以前に書き込まれた値より大きいため、c、d、s1がすべて更新されます。

5回目の挿入では、s1とs2の両方の値が以前に書き込まれた値より大きいため、c、d、s1、e、s2がすべて更新されます。

**3. Add/Drop Column**

```sql
CREATE TABLE `upsert_test` (
                `a` bigint(20) NULL COMMENT "",
                `b` int(11) NULL COMMENT "",
                `c` int(11) NULL COMMENT "",
                `d` int(11) NULL COMMENT "",
                `s1` int(11) NULL COMMENT "",
                ) ENGINE=OLAP
                UNIQUE KEY(`a`, `b`)
                COMMENT "OLAP"
                DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
                PROPERTIES (
                "enable_unique_key_merge_on_write" = "false",
                "light_schema_change"="true",
                "replication_num" = "1",
                "sequence_mapping.s1" = "c,d"
                );
```
```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1),(1,1,3,3,3),(1,1,2,2,2);
Query OK, 3 rows affected (0.101 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |
+------+------+------+------+------+
1 row in set (0.057 sec)

MySQL > alter table upsert_test add column (e int(11) NULL, s2 bigint) PROPERTIES('sequence_mapping.s2' = 'e');
Query OK, 0 rows affected (0.011 sec)

MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s2    | bigint | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
7 rows in set (0.003 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 | NULL | NULL |
+------+------+------+------+------+------+------+
1 row in set (0.032 sec)

MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.052 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |    2 |    2 |
+------+------+------+------+------+------+------+
1 row in set (0.020 sec)

MySQL > insert into upsert_test(a, b, c, d, s1,e,s2) values(1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    5 |    4 |
+------+------+------+------+------+------+------+
1 row in set (0.022 sec)

MySQL > alter table upsert_test drop column e;
Query OK, 0 rows affected (0.006 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | s2   |
+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+
1 row in set (0.026 sec)

MySQL > alter table upsert_test drop column s2;
Query OK, 0 rows affected (0.005 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |
+------+------+------+------+------+
1 row in set (0.014 sec)
```
### 注意

1. Light schema changeが有効化されている必要があり、列名の変更は現在サポートされていません

2. Sequence列は整数型と時間型（DATE、DATETIME）にすることができ、作成後に列の型を変更することはできません。

3. すべてのマッピングされた列間で重複があってはなりません。例えば、サンプル内の列dをs1とs2の両方にマッピングすることはできません。

4. Sequence列とマッピング列はキー列にすることはできず、すべての非キー列はsequence列にマッピングされる必要があります

5. マッピング関係は変更できません。例えば、既に列s1にマッピングされているサンプル内の列dを、列s2にマッピングするように変更することはできません。

6. 現在MORテーブルのみをサポートし、sequence列との同時有効化はサポートされておらず、バッチ削除操作もサポートされていません

7. RollUpの作成は現在サポートされていません

8. 新しいテーブルを作成する際にsequence_mapping属性が含まれていない場合、後でそれを開くことはサポートされません

9. 含まれていないフィールドは、load data中にデフォルト値またはnullで自動的に埋められます。sequence列の値を比較する際、null値は最小値として扱われます。
