title=最佳实践
date=2018-11-06
type=guide
status=published
~~~~~~

## 1. 建表:

#### 1.1 数据模型选择

Doris数据模型上目前分为三类: AGGREGATE KEY, UNIQUE KEY, DUPLICATE KEY。三种模型中数据都是按KEY进行排序。
- AGGREGATE KEY: AGGREGATE KEY相同时，新旧记录进行聚合，目前支持的聚合函数有SUM, MIN, MAX, REPLACE。
    AGGREGATE KEY模型可以提前聚合数据, 适合报表和多维分析业务。
    ```
    CREATE TABLE site_visit
    (
        siteid      INT,
        city        SMALLINT,
        username    VARCHAR(32),
        pv BIGINT   SUM DEFAULT '0'
    )
    AGGREGATE KEY(siteid, city, username)
    DISTRIBUTED BY HASH(siteid) BUCKETS 10;
    ```
- UNIQUE KEY: UNIQUE KEY相同时，新记录覆盖旧记录。目前UNIQUE KEY实现上和AGGREGATE KEY的REPLACE聚合方法一样，二者本质上可以认为相同。适用于有更新的分析业务。
    ```
    CREATE TABLE sales_order
    (
        orderid     BIGINT,
        status      TINYINT,
        username    VARCHAR(32),
        amount      BIGINT DEFAULT '0'
    )
    UNIQUE KEY(orderid)
    DISTRIBUTED BY HASH(orderid) BUCKETS 10;
    ```
- DUPLICATE KEY: 只指定排序列，相同DUPLICATE KEY的记录会同时存在。适用于数据无需提前聚合的分析业务。
    ```
    CREATE TABLE session_data
    (
        visitorid   SMALLINT,
        sessionid   BIGINT,
        visittime   DATETIME,
        city        CHAR(20),
        province    CHAR(20),
        ip          varchar(32),
        brower      CHAR(20),
        url         VARCHAR(1024)
    )
    DUPLICATE KEY(visitorid, sessionid)
    DISTRIBUTED BY HASH(sessionid, visitorid) BUCKETS 10;
    ```

#### 1.2 大宽表与star schema

业务方建表时, 为了和前端业务适配, 往往不对维度信息和指标信息加以区分, 而将schema定义成大宽表。对于Doris而言, 这类大宽表往往性能不尽如人意: 
- schema中字段数比较多, 聚合模型中可能key列比较多, 导入过程中需要排序的列会增加。
- 维度信息更新会反应到整张表中，而更新的频率直接影响查询的效率。

使用过程中，建议用户尽量使用star schema区分维度表和指标表。频繁更新的维度表可以放在mysql中, 而如果只有少量更新, 可以直接放在Doris中。在Doris中存储维度表时，可对维度表设置更多的副本，提升join的的性能。

#### 1.3 行存和列存

Doris提供行存和列存, 建议用户选择列存，列存在存储空间以及scan上更加友好。
而且Doris针对列存做了相应的优化，例如delete优化, 支持NULL等。
行存如今存在的作用只为兼容Doris早期的部分业务。
 
#### 1.4 分区(parition)和分桶(bucket)

Doris支持两级分区存储, 第一层为RANGE分区(partition), 第二层为HASH分桶(bucket)。
- RANGE分区(partition) : RANGE分区用于将数据划分成不同区间, 逻辑上可以理解为将原始表划分成了多个子表。 业务上，多数用户会选择采用按时间进行partition, 让时间进行partition有以下好处：
    - 可区分冷热数据
    - 可用上Doris分级存储(SSD + SATA)的功能
    - 按分区删除数据时，更加迅速
- HASH分桶(bucket) : 根据hash值将数据划分成不同的bucket。
    - 建议采用区分度大的列做分桶, 避免出现数据倾斜
    - 为方便数据恢复, 建议单个bucket的size不要太大, 保持在10GB左右, 所以建表或增加partition时请合理考虑buckets数目, 其中不同partition可指定不同的buckets数。
    - random分桶的方式不建议采用，建表时烦请指定明确的hash分桶列。

#### 1.5 稀疏索引和bloomfilter
Doris对数据进行有序存储, 在数据有序的基础上为其建立稀疏索引,索引粒度为block(1024行)。
- 稀疏索引选取schema中固定长度的前缀作为索引内容, 目前Doris选取36个字节的前缀作为索引。
    - 建表时建议将查询中常见的过滤字段放在schema的前面, 区分度越大，频次越高的查询字段越往前放。
    - 这其中有一个特殊的地方,就是varchar类型的字段,varchar类型字段只能作为稀疏索引的最后一个字段，索引会在varchar处截断, 因此varchar如果出现在前面，可能索引的长度不足36个字节。
    
    对于上述site_visit表
    ```
    site_visit(siteid, city, username, pv)
    ```
    排序列有siteid, city, username三列, siteid所占字节数为4, city所占字节数为2，username占据32个字节,
    所以前缀索引的内容为siteid + city + username的前30个字节

- 除稀疏索引之外, Doris还提供bloomfilter索引, bloomfilter索引对区分度比较大的列过滤效果明显。 如果考虑到varchar不能放在稀疏索引中, 可以建立bloomfilter索引。

#### 1.6 物化视图(rollup)
Rollup本质上可以理解为原始表(base table)的一个物化索引。建立rollup时可只选取base table中的部分列作为schema，schema中的字段顺序也可与base table不同。
下列情形可以考虑建立rollup:
- base table中数据聚合度不高，这一般是因base table有区分度比较大的字段而导致。此时可以考虑选取部分列，建立rollup。
    对于上述site_visit表
    ```
    site_visit(siteid, city, username, pv)
    ```
    siteid可能导致数据聚合度不高，如果业务方经常根据城市统计pv需求，可以建立一个只有city, pv的rollup。
    ```
    ALTER TABLE site_visit ADD ROLLUP rollup_city(city, pv);
    ```
- base table中的前缀索引无法命中，这一般是base table的建表方式无法覆盖所有的查询模式。此时可以考虑调整列顺序，建立rollup。对于上述session_data表
    ```
    session_data(visitorid, sessionid, visittime, city, province, ip, brower, url)
    ```
    如果除了通过 visitorid 分析访问情况外，还有通过brower, province分析的情形，可以单独建立rollup。
    ```
    ALTER TABLE session_data ADD ROLLUP rollup_brower(brower,province,ip,url) DUPLICATE KEY(brower,province);
    ```

## 2. 导入
Doris目前提供mini load和pull load两种导入方式, 通过指定导入label标示一批次的导入。Doris对单批次的导入会保证原子生效, 即使单次导入多张表也同样保证其原子性。
- mini load : 通过http推的方式进行导入, 每次导入数据限制在1GB, 适合分钟级别的数据导入需求。
- pull load : 通过拉的方式导入, 适合天级别的批量数据的导入。

## 3. schema change
Doris中目前进行schema change的方式有三种，sorted schema change，direct schema change, linked schema change。
- sorted schema change: 改变了列的排序方式，需对数据进行重新排序。例如删除排序列中的一列, 字段重排序。
    ```
    ALTER TABLE site_visit DROP COLUMN city;
    ```
- direct schema change: 无需重新排序，但是需要对数据做一次转换。例如修改列的类型，在稀疏索引中加一列等。
    ```
    ALTER TABLE site_visit MODIFY COLUMN username varchar(64);
    ```
- linked schema change: 无需转换数据，直接完成。例如加列操作。
    ```
    ALTER TABLE site_visit ADD COLUMN click bigint SUM default '0';
    ```
建表时建议考虑好schema，这样在进行schema change时可以加快速度。