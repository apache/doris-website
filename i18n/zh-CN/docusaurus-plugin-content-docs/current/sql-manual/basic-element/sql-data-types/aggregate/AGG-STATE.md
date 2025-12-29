---
{
    "title": "AGG_STATE",
    "language": "zh-CN",
    "description": "AGGSTATE不能作为key列使用，建表时需要同时声明聚合函数的签名。 用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。"
}
---

## AGG_STATE
## 描述
    AGG_STATE不能作为key列使用，建表时需要同时声明聚合函数的签名。
    用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。
    
  AGG_STATE 只能配合[state](../../../sql-functions/combinators/state)
    /[merge](../../../sql-functions/combinators/merge)/[union](../../../sql-functions/combinators/union)函数组合器使用。
    
  需要注意的是，聚合函数的签名也是类型的一部分，不同签名的 agg_state 无法混合使用。比如如果建表声明的签名为`max_by(int,int)`,那就无法插入`max_by(bigint,int)`或者`group_concat(varchar)`。
  此处 nullable 属性也是签名的一部分，如果能确定不会输入 null 值，可以将参数声明为 not null，这样可以获得更小的存储大小和减少序列化/反序列化开销。

**注意：因为`agg_state`存储的是聚合函数的中间结果，所以读写过程都强依赖于聚合函数的具体实现，如果在 Doris 版本升级时对聚合函数实现做了修改，则可能会造成不兼容的情况。如果出现不兼容的情况，使用到对应`agg_state`的物化视图需要`drop`并重新创建，另外涉及到的基础聚合表则会直接不可用，所以需要慎重使用`agg_state`。**

## 举例

建表示例如下：
  ```sql
  create table a_table(
      k1 int null,
      k2 agg_state<max_by(int not null,int)> generic,
      k3 agg_state<group_concat(string)> generic
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");
  ```
  这里的 k2 和 k3 分别以 max_by 和 group_concat 为聚合类型。

插入数据示例：
  ```sql
  insert into a_table values(1,max_by_state(3,1),group_concat_state('a'));
  insert into a_table values(1,max_by_state(2,2),group_concat_state('bb'));
  insert into a_table values(2,max_by_state(1,3),group_concat_state('ccc'));
  ```
  对于 agg_state 列，插入语句必须用[state](../../../../sql-manual/sql-functions/combinators/state)函数来生成对应的 agg_state 数据，这里的函数和入参类型都必须跟 agg_state 完全对应。

查询数据示例：

  ```sql
  mysql [test]>select k1,max_by_merge(k2),group_concat_merge(k3) from a_table group by k1 order by k1;
  +------+--------------------+--------------------------+
  | k1   | max_by_merge(`k2`) | group_concat_merge(`k3`) |
  +------+--------------------+--------------------------+
  |    1 |                  2 | bb,a                     |
  |    2 |                  1 | ccc                      |
  +------+--------------------+--------------------------+
  ```

  如果需要获取实际结果，则要用对应的[merge](../../../../sql-manual/sql-functions/combinators/merge)函数。

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

如果想要在过程中只聚合 agg_state 而不获取实际结果，可以使用[union](../../../../sql-manual/sql-functions/combinators/union)函数。

更多的例子参见[datatype_p0/agg_state](https://github.com/apache/doris/tree/master/regression-test/suites/datatype_p0/agg_state)

### keywords

    AGG_STATE
