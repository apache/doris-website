---
{
  "title": "AGG_STATE",
  "language": "ja",
  "description": "AGGSTATEはキー列として使用できず、テーブル作成時に集約関数のシグネチャを同時に宣言する必要があります。"
}
---
## AGG_STATE
### 説明
AGG_STATEはキーカラムとして使用することはできず、テーブル作成時に集計関数のシグネチャを同時に宣言する必要があります。
ユーザーは長さとデフォルト値を指定する必要はありません。実際に格納されるデータサイズは関数の実装に関連します。

AGG_STATEは[state](../../../sql-functions/combinators/state)
/[merge](../../../sql-functions/combinators/merge)/[union](../../../sql-functions/combinators/union)関数コンビネーターとの組み合わせでのみ使用できます。

集計関数のシグネチャも型の一部であり、異なるシグネチャのagg_stateを混在させることはできないことに注意してください。たとえば、テーブル作成文のシグネチャが`max_by(int,int)`の場合、`max_by(bigint,int)`や`group_concat(varchar)`を挿入することはできません。
ここでのnullable属性もシグネチャの一部です。null値が入力されないことを確認できる場合は、パラメータをnot nullとして宣言することで、より小さなストレージサイズを取得し、シリアライゼーション/デシリアライゼーションのオーバーヘッドを削減できます。

**注意：agg_stateは集計関数の中間結果を格納するため、読み書き処理は集計関数の具体的な実装に強く依存します。Dorisバージョンのアップグレード中に集計関数の実装が変更された場合、非互換の状況が発生する可能性があります。非互換性が発生した場合、対応するagg_stateを使用するマテリアライズドビューを削除して再作成する必要があり、関連する基礎集計テーブルは直接使用不可能になるため、agg_stateは慎重に使用する必要があります。**

### 例

テーブル作成例：

```sql
  -- after doris-2.1.1
  create table a_table(
      k1 int null,
      k2 agg_state<max_by(int not null,int)> generic,
      k3 agg_state<group_concat(string) generic
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
ここで、k2とk3はそれぞれmax_byとgroup_concatを集約タイプとして使用します。

データ挿入例：

```sql
    insert into a_table values(1,max_by_state(3,1),group_concat_state('a'));
    insert into a_table values(1,max_by_state(2,2),group_concat_state('bb'));
    insert into a_table values(2,max_by_state(1,3),group_concat_state('ccc'));
```
agg_state列の場合、insert文では[state](../../../sql-functions/combinators/state)関数を使用して対応するagg_stateデータを生成する必要があります。この際、関数と入力パラメータの型はagg_stateと完全に対応している必要があります。

データ選択の例：

```sql
    mysql [test]>select k1,max_by_merge(k2),group_concat_merge(k3) from a_table group by k1 order by k1;
    +------+--------------------+--------------------------+
    | k1   | max_by_merge(`k2`) | group_concat_merge(`k3`) |
    +------+--------------------+--------------------------+
    |    1 |                  2 | bb,a                     |
    |    2 |                  1 | ccc                      |
    +------+--------------------+--------------------------+
```
実際の結果を取得する必要がある場合は、対応する[merge](../../../sql-functions/combinators/merge)関数を使用する必要があります。

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
プロセス中に実際の結果を取得せずにagg_stateのみを集約したい場合は、[union](../../../sql-functions/combinators/union)関数を使用できます。

より多くの例については、[datatype_p0/agg_state](https://github.com/apache/doris/tree/master/regression-test/suites/datatype_p0/agg_state)を参照してください。
### keywords

    AGG_STATE
