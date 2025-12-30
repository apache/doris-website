---
{
    "title": "IVF",
    "language": "zh-CN",
    "description": "IVF 索引是一种用于近似最近邻（ANN）搜索的高效数据结构。它能在搜索过程中缩小向量搜索范围，显著提高搜索速度。自 Apache Doris 4.x 版本起，已支持基于 IVF 的 ANN 索引。本文档将详细介绍 IVF 算法、关键参数和工程实践，"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# IVF 以及如何在 Apache Doris 中使用 IVF 算法的索引

IVF 索引是一种用于近似最近邻（ANN）搜索的高效数据结构。它能在搜索过程中缩小向量搜索范围，显著提高搜索速度。自 Apache Doris 4.x 版本起，已支持基于 IVF 的 ANN 索引。本文档将详细介绍 IVF 算法、关键参数和工程实践，并解释如何在生产环境的 Doris 集群中构建和调优基于 IVF 的 ANN 索引。

## 什么是 IVF 索引？

为便于理解，先介绍一些历史背景。术语 IVF（Inverted File）起源于信息检索领域。

考虑一个简单的文本文档例子。要搜索包含给定单词的文档，**正向索引** 会存储每个文档的单词列表。必须显式读取每个文档才能找到相关文档。

|Document|Words|
|---|---|
|Document 1|the,cow,says,moo|
|Document 2|the,cat,and,the,hat|
|Document 3|the,dish,ran,away,with,the,spoon|

反过来, **倒排索引** 将包含一个可以搜索的所有单词的字典，对于每个单词，都有一个包含该单词的文档索引列表。这就是倒排列表（倒排文件），它能够将搜索范围限制在选定的列表中。

| Word | Documents                                                  |
| ---- | ---------------------------------------------------------- |
| the  | Document 1, Document 3, Document 4, Document 5, Document 7 |
| cow  | Document 2, Document 3, Document 4                         |
| says | Document 5                                                 |
| moo  | Document 7                                                 |

如今，文本数据通常表示为向量嵌入。IVF 方法定义了聚类中心，这些中心类似于前面例子中的单词字典。对于每个聚类中心，都有一个属于该聚类的向量索引列表，搜索速度得以提升，因为只需检查选定的聚类。


## 使用 IVF 索引进行高效向量搜索

随着数据集增长到数百万甚至数十亿向量，执行穷举式精确 k-最近邻（kNN）搜索（计算查询向量与数据库中每个向量之间的距离）在计算上变得不可行。这种暴力方法相当于大型矩阵乘法，无法扩展。

幸运的是，许多应用程序可以用少量的准确度换取速度的巨大提升。这就是近似最近邻（ANN） 搜索领域，而倒排文件（IVF） 索引是最广泛使用且有效的 ANN 方法之一。

IVF 的基本原理是"分而治之"。IVF 不是搜索整个数据集，而是智能地将搜索范围缩小到几个有希望的区域，从而大大减少所需的比较次数。

IVF 的工作原理是将大型向量数据集划分为更小、更易管理的聚类，每个聚类由一个称为"质心"的中心点表示。这些质心作为其各自分区的锚点。在搜索过程中，系统快速识别出其质心最接近查询向量的聚类，并仅在这些聚类内进行搜索，而忽略数据集的其余部分。

![ivf search](/images/vector-search/dataset-points-query-clusters.png)



## IVF in Apache Doris

Apache Doris 从 4.x 版本开始支持构建基于 IVF 的 ANN 索引。

### 索引构建

这里使用的索引类型是 ANN。创建 ANN 索引有两种方式：可以在创建表时定义索引，也可以使用 `CREATE/BUILD INDEX` 语法。这两种方法在索引构建的时机和方式上有所不同，因此适用于不同的场景。

方式一：建表时指定在某个向量列上创建索引。随着数据加载，会在每个段创建时为其构建 ANN 索引。优点是数据加载完成后，索引已经构建完毕，查询可以立即使用它进行加速。缺点是由于同步构建索引会减慢数据摄入速度，并且可能在压缩过程中导致额外的索引重建，造成一定的资源浪费。



```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="ivf",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

#### CREATE/BUILD INDEX

方式二：`CREATE/BUILD INDEX`。

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT ""
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

导入数据后 CREATE INDEX，此时 table 上已经有了 index 的定义，但是没有真正在存量数据上构建索引。


```sql
CREATE INDEX idx_test_ann ON sift_1M (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="l2_distance",
  "dim"="128",
  "nlist"="1024"
);

SHOW DATA ALL FROM sift_1M;

mysql> SHOW DATA ALL FROM sift_1M;
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
```

然后，就可以使用 `BUILD INDEX` 语句构建索引了：


```sql
BUILD INDEX idx_test_ann ON sift_1M;
```

BUILD INDEX 是异步执行的，需要通过 SHOW ALTER 来查看任务的执行状态。


```sql
SHOW BUILD INDEX WHERE TableName = "sift_1M";

mysql> SHOW BUILD INDEX WHERE TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764392359610 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 14:18:22.360 | 2025-12-01 14:18:27.885 | 5036          | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)

mysql> SHOW DATA ALL FROM sift_1M;
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
2 rows in set (0.00 sec)
```

#### DROP INDEX

同样可以通过 `ALTER TABLE sift_1M DROP INDEX idx_test_ann` 来删除不合适的 Ann 索引。DROP INDEX 通常发生在索引的超参数调优阶段，为了确保足够的召回率需要测试不同的参数组合，需要灵活的索引管理。


### 进行查询

ANN 索引支持对 topn search 还有 range search 进行加速。

当向量列是高维向量时，用于描述查询向量的字符串本身会引入额外的解析开销，因此不建议在生产环境中，尤其是高并发场景里，直接使用原始 SQL 执行向量搜索查询。使用 prepare statement 来提前对 sql 进行解析是一个能够提高查询性能的做法，所以建议使用 doris 的向量搜索 [python library](https://github.com/uchenily/doris_vector_search)，在这个 python library 里面封装了基于 prepare statement 对 doris 进行向量搜索的必要的操作，并且集成了相关的数据转化流程，可以直接将 doris 的查询结果转为 pandas 的 DataFrame，方便用户基于 doris 开发 AI 应用。


```python
from doris_vector_search import DorisVectorClient, AuthOptions

auth = AuthOptions(
    host="127.0.0.1",
    query_port=9030,
    user="root",
    password="",
)

client = DorisVectorClient(database="test", auth_options=auth)

tbl = client.open_table("sift_1M")

query = [0.1] * 128  # Example 128-dimensional vector

# SELECT id FROM sift_1M ORDER BY l2_distance_approximate(embedding, query) LIMIT 10;
result = tbl.search(query, metric_type="l2_distance").limit(10).select(["id"]).to_pandas()

print(result)
```

上面的 python 脚本执行结果为：


```text
       id
0  123911
1  926855
2  123739
3   73311
4  124493
5  153178
6  126138
7  123740
8  125741
9  124048
```


### 召回率优化

向量搜索场景里面最重要的指标是召回率，一切性能数据只有在满足一定的召回率的前提下才有意义。影响召回率的因素主要包括：
1. IVF 的索引阶段参数（nlist）和查询阶段参数（nprobe）
2. 索引向量量化
3. segment 的大小与数量

这篇文章里我们将会讨论 1，3 对于召回率的影响，关于向量量化会在其他的文章里进行介绍。

#### 索引超参数

IVF 索引将向量组织到多个聚类中。在索引构建过程中，使用聚类算法将向量分组。然后，搜索过程仅聚焦于最相关的聚类。工作流程大致如下：


索引构建阶段：

1. 聚类：使用聚类算法（例如 k‑means）将所有向量划分为 `nlist` 个聚类。计算并存储每个聚类的质心。
2. 向量分配：每个向量被分配到与其质心最接近的聚类，并将该向量添加到该聚类的倒排列表中。

查询阶段：

1. 使用 `nprobe` 选择聚类：对于查询向量，计算到所有 `nlist` 个质心的距离。仅选择 `nprobe` 个最近的聚类进行搜索。
2. 在选定聚类内进行穷举搜索：将查询与选定 `nprobe` 个聚类中的每个向量进行比较，以找到最近邻。

总之：

`nlist` 定义了聚类的数量（倒排列表的数量）。它影响召回率、内存开销和构建时间。较大的 `nlist` 会创建更细粒度的聚类，这可以提高搜索速度，但同时也会增加聚类成本和邻居分散在多个聚类中的风险。

`nprobe` 定义了查询阶段要搜索的聚类数量。较大的 `nprobe` 会提高召回率和查询延迟（需要检查更多的向量）。较小的 `nprobe` 使查询更快，但可能会遗漏位于未探测聚类中的邻居。

Doris 默认的 `nlist` 为 1024, 默认的 `nprobe` 为 64。


上述测试都是对这两个超参数定性的分析，通过实际实验，在 SIFT_1M 数据集上有如下的测试结果:


| nlist | nprobe | recall_at_100 |
| ----- | ------ | ------------- |
| 1024  | 64     | 0.9542        |
| 1024  | 32     | 0.9034        |
| 1024  | 16     | 0.8299        |
| 1024  | 8      | 0.7337        |
| 512   | 32     | 0.9384        |
| 512   | 16     | 0.8763        |
| 512   | 8      | 0.7869        |


虽然很难事先给出超参数的具体取值，但是我们可以给出一个关于如何选取超参数的实践方法：
1. 建立一张无索引的表 table_multi_index，table_multi_index 可以有 2 或者 3 个向量列
2. 通过 stream load 等方式将数据导入到无索引的 table_multi_index
3. 通过 `CREATE INDEX` 和 `BUILD INDEX` 在所有的向量列上构建索引
4. 不同的列选择不同的索引参数，等索引构建完成后在不同的列上计算召回率，找到最合适的超参数组合

示例:

```sql
ALTER TABLE tbl DROP INDEX idx_embedding;
CREATE INDEX idx_embedding ON tbl (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="inner_product",
  "dim"="768",
  "nlist"="1024"
);
BUILD INDEX idx_embedding ON tbl;
```

#### 索引覆盖的行数

Doris 内表的数据是分层组织的。最高层级的概念是 Table，Table 按照分桶键把原始数据尽可能均匀地分布到 N 个 tablets 里面，tablet 是用来进行数据迁移与rebalance的基本单位。每次导入或者compaction会在tablet下新增一个rowset，rowset是进行版本管理的单位，其本身只是代表一组具有版本号的数据，这组数据真正存储在 segment 文件里。


与倒排索引一样，向量索引也作用在 segment 粒度上。segment 本身的大小取决于 be conf 中的 write_buffer_size 和 vertical_compaction_max_segment_size，在导入和 compaction 过程中，当内存中 memtable 的积累到一定大小后就会下刷生成一个 segment 文件，并且为该 segment 构造一个向量索引（如果有多个索引列那么就有多个索引），该索引能够覆盖的范围就是这个 segment 中对应列的行数。根据前面对 IVF 算法搜索与构建过程的介绍，对于某组索引参数，其能够有效覆盖的数据范围是有限的，当数据量超过某个阈值后，召回率就无法满足要求。


> 通过 SHOW TABLETS FROM table 可以看到某张表的 Compaction 状态，点开对应的 URL 可以看到这张表有多少个 segment。


#### Compaction 对召回率的影响

Compaction 之所以会影响召回率是因为 compaction 有时会生成更大的 segment，导致原先的索引超参数无法在新的更大的 segment 上保障覆盖率。因此建议在 `BUILD INDEX` 之前触发一次 FULL COMPACTION，在充分合并过的 segment 上构建索引不光可以保持召回率稳定，还可以减少索引构建引入的写放大。

### 查询性能
#### 索引文件的冷加载

Doris 的 ANN 索引是基于 Meta 开源的 [faiss](https://github.com/facebookresearch/faiss) 实现的。IVF 索引被全部被加载进内存后才能进行查询加速，因此建议在高并发查询之前，先进行一次冷查询，确保涉及到的 segment 的索引文件全部加载进了内存，否则对于查询性能会有较大影响。

#### 内存空间与性能

**IVF 索引（无量化压缩）占用的内存空间近似等于其所能检索的向量的内存大小的 1.02 倍**。

比如对于 128 维，1M 的数据集，IVF FLAT 索引需要的内存空间大约为 128 * 4 * 1000000 * 1.02 约等于 500 MB。

一些参考值:

| dim | rows | estimated memory |
|-----|------|------------------|
| 128 | 1M   | 496 MB           |
| 768 | 1M   | 2.9 GB           |

为了保证查询性能，需要 BE 有足够的内存空间，否则索引的频繁 IO 会导致查询性能大幅衰减。


### Benchmark

Benchmark时应该按照生产环境部署模式, FE与BE分开部署, 另外客户端应在另一台独立的机器上运行。

测试框架可以使用 [VectorDBBench](https://github.com/zilliztech/VectorDBBench)。

#### Performance768D1M

压测命令:

```bash
# load
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --skip-search-serial --skip-search-concurrent

# search
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --search-concurrent --search-serial --num-concurrency 10,40,80 --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --session-var ivf_nprobe=64 --skip-load --skip-drop-old
```

