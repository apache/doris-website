---
{
    "title": "AGG_STATE",
    "language": "ja",
    "description": "AGGSTATE はキー列として使用できません。また、テーブルの作成時に集約関数のシグネチャを宣言する必要があります。"
}
---

## AGG_STATE
### 説明
      AGG_STATE cannot be used as a key column, and the signature of the aggregation function must be declared at the same time when creating the table.
      User does not need to specify length and default value. The actual stored data size is related to the function implementation.

AGG_STATE はキー列として使用できません。また、テーブル作成時に集約関数のシグネチャを宣言する必要があります。長さとデフォルト値を指定する必要はありません。実際に格納されるデータのサイズは、関数の実装によって異なります。
    
  AGG_STATE は、[state](../../../sql-functions/combinators/state)
     /[merge](../../../sql-functions/combinators/merge)/[union](../../../sql-functions/combinators/union) 関数コンビネータと組み合わせてのみ使用できます。
    
  集約関数のシグネチャも型の一部であり、シグネチャが異なる agg_state を混在させることはできません。たとえば、テーブル作成文で宣言したシグネチャが `max_by(int,int)` の場合、`max_by(bigint,int)` や `group_concat(varchar)` の値は挿入できません。
   ここでの引数の null 許容属性もシグネチャの一部です。null 値を入力しないことが確実な場合は、引数を not null として宣言できます。これにより、格納サイズを小さくし、シリアライズとデシリアライズのオーバーヘッドを減らせます。

**注意: agg_state には集約関数の中間結果が格納されるため、読み書きの処理は集約関数の実装に強く依存します。Doris のバージョンアップ時に集約関数の実装が変更されると、互換性の問題が生じる可能性があります。互換性の問題が生じた場合、該当する agg_state を使用するマテリアライズドビューは削除して再作成する必要があり、関連する基礎の集約テーブルはそのままでは使用できなくなります。そのため、agg_state の使用には注意してください。**

### 例

テーブル作成の例:
```sql
  -- after doris-2.1.1
  create table a_table(
      k1 int null,
      k2 agg_state<max_by(int not null,int)> generic,
      k3 agg_state<group_concat(string)> generic
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");  

  -- until doris-2.1.0
  create table a_table(
      k1 int null,
      k2 agg_state max_by(int not null,int),
      k3 agg_state group_concat(string)
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");
```
ここでは、k2 と k3 がそれぞれ max_by と group_concat を集約型として使用しています。

データ挿入の例:
```sql
    insert into a_table values(1,max_by_state(3,1),group_concat_state('a'));
    insert into a_table values(1,max_by_state(2,2),group_concat_state('bb'));
    insert into a_table values(2,max_by_state(1,3),group_concat_state('ccc'));
```
agg_state 列への挿入には、対応する agg_state データを生成する [state](../../../sql-functions/combinators/state) 関数を使用する必要があります。関数と入力パラメータの型は、agg_state と完全に一致していなければなりません。

データ取得の例:
```sql
    mysql [test]>select k1,max_by_merge(k2),group_concat_merge(k3) from a_table group by k1 order by k1;
    +------+--------------------+--------------------------+
    | k1   | max_by_merge(`k2`) | group_concat_merge(`k3`) |
    +------+--------------------+--------------------------+
    |    1 |                  2 | bb,a                     |
    |    2 |                  1 | ccc                      |
    +------+--------------------+--------------------------+
```
実際の結果を取得するには、対応する [merge](../../../sql-functions/combinators/merge) 関数を使用する必要があります。

```sql
    mysql [test]>select max_by_merge(u2),group_concat_merge(u3) from (
    select k1,max_by_union(k2) as u2,group_concat_union(k3) u3 from a_table group by k1 order by k1
    ) t;
    +--------------------+--------------------------+
    | max_by_merge(`u2`) | group_concat_merge(`u3`) |
    +--------------------+--------------------------+
    |                  1 | ccc,bb,a                 |
    +--------------------+--------------------------+
```
処理の途中で実際の結果を取得せず、agg_state だけを集約する場合は、[union](../../../sql-functions/combinators/union) 関数を使用できます。

その他の例については、[datatype_p0/agg_state](https://github.com/apache/doris/tree/master/regression-test/suites/datatype_p0/agg_state) を参照してください。
### キーワード

    AGG_STATE
