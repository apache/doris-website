---
{
  "title": "Apache Doris存储层设计(一)之存储结构设计解析",
  "description": "本文主要通过阅读 Doris BE 模块代码，详细分析了 Doris BE 模块存储层的实现原理，阐述和解密 Doris 高效的写入、查询能力背后的核心技术。其中包括 Doris 列存的设计、索引设计、数据读写流程、Compaction 流程、Tablet 和 Rowset 的版本管理、数据备份等功能.",
  "date": "2022-05-20",
  "metaTitle": "Apache Doris存储层设计(一)之存储结构设计解析",
  "isArticle": true,
  "language": "zh-CN",
  "author": "ApacheDoris",
  "layout": "Article",
  "sidebar": false,
  "categories": "DorisInternals",
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

# 存储层设计(一)之存储结构设计解析

## 1. 整体介绍

Doris 是基于 MPP 架构的交互式 SQL 数据仓库，主要用于解决近实时的报表和多维分析。Doris 高效的导入、查询离不开其存储结构精巧的设计。

本文主要通过阅读 Doris BE 模块代码，详细分析了 Doris BE 模块存储层的实现原理，阐述和解密 Doris 高效的写入、查询能力背后的核心技术。其中包括 Doris 列存的设计、索引设计、数据读写流程、Compaction 流程、Tablet 和 Rowset 的版本管理、数据备份等功能。

文章介绍了 Segment V2 版本的存储层结构，包括了有序存储、稀疏索引、前缀索引、位图索引、BloomFilter 等丰富功能，可以应对各种复杂的场景提供极速的查询能力。

## 2 设计目标

- 批量导入，少量更新
- 绝大多数的读请求
- 宽表场景，读取大量行，少量列
- 非事务场景
- 良好的扩展性

## 3 储存文件格式

### 3.1 存储目录结构

存储层对存储数据的管理通过 storage_root_path 路径进行配置，路径可以是多个。存储目录下一层按照分桶进行组织，分桶目录下存放具体的 tablet，按照 tablet_id 命名子目录。

Segment 文件存放在 tablet*id 目录下按 SchemaHash 管理。Segment 文件可以有多个，一般按照大小进行分割，默认为 256MB。其中，Segment v2 文件命名规则为：${rowset_id}*${segment_id}.dat。

具体存储目录存放格式如下图所示：

![img](/images/blogs/storage/b9a87a028af1fc40babe2bf136334ec9.png)

### 3.2 Segment v2 文件结构

Segment 整体的文件格式分为数据区域，索引区域和 footer 三个部分，如下图所示：

![img](/images/blogs/storage/f74e7c5fc5358ce8faa3e79ad7e625d3.png)

- Data Region: 用于存储各个列的数据信息，这里的数据是按需分 page 加载的
- Index Region: Doris 中将各个列的 index 数据统一存储在 Index Region，这里的数据会按照列粒度进行加载，所以跟列的数据信息分开存储
- Footer 信息
- SegmentFooterPB: 定义文件的元数据信息
- 4 个字节的 FooterPB 内容的 checksum
- 4 个字节的 FileFooterPB 消息长度，用于读取 FileFooterPB

下面分布介绍各个部分的存储格式的设计。

## 4 Footer 信息

Footer 信息段在文件的尾部，存储了文件的整体结构，包括数据域的位置，索引域的位置等信息，其中有 SegmentFooterPB，CheckSum，Length，MAGIC CODE 4 个部分。

SegmentFooterPB 数据结构如下：

![img](/images/blogs/storage/044434894abc13376ee9d14d78c5eff1.png)

SegmentFooterPB 采用了 PB 格式进行存储，主要包含了列的 meta 信息、索引的 meta 信息，Segment 的 short key 索引信息、总行数。

### 4.1 列的 meta 信息

ColumnId：当前列在 schema 中的序号

UniqueId：全局唯一的 id

Type：列的类型信息

Length：列的长度信息

Encoding：编码格式

Compression：压缩格式

Dict PagePointer：字典信息

### 4.2 列索引的 meta 信息

- OrdinalIndex：存放列的稀疏索引 meta 信息。
- ZoneMapIndex：存放 ZoneMap 索引的 meta 信息，内容包括了最大值、最小值、是否有空值、是否没有非空值。SegmentZoneMap 存放了全局的 ZoneMap 信息，PageZoneMaps 则存放了每个页面的统计信息。
- BitMapIndex：存放 BitMap 索引的 meta 信息，内容包括了 BitMap 类型，字典数据 BitMap 数据。
- BloomFilterIndex：存放了 BloomFilter 索引信息。

为了防止索引本身数据量过大，ZoneMapIndex、BitMapIndex、BloomFilterIndex 采用了两级的 Page 管理。对应了 IndexColumnMeta 的结构，当一个 Page 能够放下时，当前 Page 直接存放索引数据，即采用 1 级结构；当一个 Page 无法放下时，索引数据写入新的 Page 中，Root Page 存储数据 Page 的地址信息。

## 5 Ordinal Index (一级索引)

Ordinal Index 索引提供了通过行号来查找 Column Data Page 数据页的物理地址。Ordinal Index 能够将按列存储数据按行对齐，可以理解为一级索引。其他索引查找数据时，都要通过 Ordinal Index 查找数据 Page 的位置。因此，这里先介绍 Ordinal Index 索引。

在一个 segment 中，数据始终按照 key（AGGREGATE KEY、UNIQ KEY 和 DUPLICATE KEY）排序顺序进行存储，即 key 的排序决定了数据存储的物理结构。确定了列数据的物理结构顺序，在写入数据时，Column Data Page 是由 Ordinal index 进行管理，Ordinal index 记录了每个 Column Data Page 的位置 offset、大小 size 和第一个数据项行号信息，即 Ordinal。这样每个列具有按行信息进行快速扫描的能力。Ordinal index 采用的稀疏索引结构，就像是一本书目录，记录了每个章节对应的页码。

### 5.1 存储结构

Ordinal index 元信息存储在 SegmentFooterPB 中的每个列的 OrdinalIndexMeta 中。具体结构如下图所示：

![img](/images/blogs/storage/694799b9202d288a80868175bc91c33f.png)

在 OrdinalIndexMeta 中存放了索引数据对应的 root page 地址，这里做了一些优化，当数据仅有一个 page 时，这里的地址可以直接指向唯一的数据 page；当一个 page 放不下时，指向 OrdinalIndex 类型的二级结构索引 page，索引数据中每个数据项对应了 Column Data Page offset 位置、size 大小和 ordinal 行号信息。其中 Ordinal index 索引粒度与 page 粒度一致，默认 64\*1024 字节。

## 6 列数据存储

### 6.1 data page 存储结构

DataPage 主要为 Data 部分、Page Footer 两个部分。

Data 部分存放了当前 Page 的列的数据。当允许存在 Null 值时，对空值单独存放了 Null 值的 Bitmap，由 RLE 格式编码通过 bool 类型记录 Null 值的行号。

![img](/images/blogs/storage/71b27dcd0a14ebe82562e2b5979d8c19.png)

Page Footer 包含了 Page 类型 Type、UncompressedSize 未压缩时的数据大小、FirstOrdinal 当前 Page 第一行的 RowId、NumValues 为当前 Page 的行数、NullMapSize 对应了 NullBitmap 的大小。

## 6.2 数据压缩

针对不同的字段类型采用了不同的编码。默认情况下，针对不同类型采用的对应关系如下：

![img](/images/blogs/storage/89DBFA60C385454DBE666C574DCDE408.png)

默认采用 LZ4F 格式对数据进行压缩。

## 7 Short Key Index 索引

### 7.1 存储结构

Short Key Index 前缀索引，是在 key（AGGREGATE KEY、UNIQ KEY 和 DUPLICATE KEY）排序的基础上，实现的一种根据给定前缀列，快速查询数据的索引方式。这里 Short Key Index 索引也采用了稀疏索引结构，在数据写入过程中，每隔一定行数，会生成一个索引项。这个行数为索引粒度默认为 1024 行，可配置。该过程如下图所示：

![img](/images/blogs/storage/2a47fa7348f47e00e01bc93e38a1a547.png)

其中，KeyBytes 中存放了索引项数据，OffsetBytes 存放了索引项在 KeyBytes 中的偏移。

### 7.2 索引生成规则

Short Key Index 采用了前 36 个字节，作为这行数据的前缀索引。当遇到 VARCHAR 类型时，前缀索引会直接截断。

### 7.3 应用案例

（1）以下表结构的前缀索引为 user_id(8Byte) + age(4Bytes) + message(prefix 24 Bytes)。

![img](/images/blogs/storage/C7EC885556D24E8587BC37E6EC70930B.png)

（2）以下表结构的前缀索引为 user_name(20 Bytes)。即使没有达到 36 个字节，因为遇到 VARCHAR，所以直接截断，不再往后继续。

![img](/images/blogs/storage/60C96B2D06D64E58A0B33384A59A0936.png)

当我们的查询条件，是前缀索引的前缀时，可以极大的加快查询速度。比如在第一个例子中，我们执行如下查询：

```sql
SELECT * FROM table WHERE user_id=1829239 and age=20；
```

该查询的效率会远高于如下查询：

```sql
SELECT * FROM table WHERE age=20；
```

所以在建表时，正确的选择列顺序，能够极大地提高查询效率。

## 8 ZoneMap Index 索引

ZoneMap 索引存储了 Segment 和每个列对应每个 Page 的统计信息。这些统计信息可以帮助在查询时提速，减少扫描数据量，统计信息包括了 Min 最大值、Max 最小值、HashNull 空值、HasNotNull 不全为空的信息。

### 8.1 存储结构

ZoneMap 索引存储结构如下图所示：

![img](/images/blogs/storage/6abc0dd9922ec1768e127d4e94030731.png)

在 SegmentFootPB 结构中，每一列索引元数据 ColumnIndexMeta 中存放了当前列的 ZoneMapIndex 索引数据信息。ZoneMapIndex 有两个部分，SegmentZoneMap 和 PageZoneMaps。SegmentZoneMap 存放了当前 Segment 全局的 ZoneMap 索引信息，PageZoneMaps 存放了每个 Data Page 的 ZoneMap 索引信息。

PageZoneMaps 对应了索引数据存放的 Page 信息 IndexedColumnMeta 结构，目前实现上没有进行压缩，编码方式也为 Plain。IndexedColumnMeta 中的 OrdinalIndexPage 指向索引数据 root page 的偏移和大小，这里同样做了优化二级 Page 优化，当仅有一个 DataPage 时，OrdinalIndexMeta 直接指向这个 DataPage；有多个 DataPage 时，OrdinalIndexMeta 先指向 OrdinalIndexPage，OrdinalIndexPage 是一个二级 Page 结构，里面的数据项为索引数据 DataPage 的地址偏移 offset，大小 Size 和 ordinal 信息。

### 8.2 索引生成规则

Doris 默认为 key 列开启 ZoneMap 索引；当表的模型为 DUPULCATE 时，会所有字段开启 ZoneMap 索引。在列数据写入 Page 时，自动对数据进行比较，不断维护当前 Segment 的 ZoneMap 和当前 Page 的 ZoneMap 索引信息。

### 8.3 应用案例

在数据查询时，会根据范围条件过滤的字段会按照 ZoneMap 统计信息选取扫描的数据范围。例如在案例 1 中，对 age 字段进行过滤。查询语句如下：

```sql
SELECT * FROM table WHERE age > 20 and age < 1000
```

在没有命中 Short Key Index 的情况下，会根据条件语句中 age 的查询条件，利用 ZoneMap 索引找到应该扫描的数据 ordinary 范围，减少要扫描的 page 数量。

## 9 BloomFilter

当一些字段不能利用 Short Key Index 并且字段存在区分度比较大时，Doris 提供了 BloomFilter 索引。

### 9.1 存储结构

BloomFilter 的存储结构如下图所示：

![img](/images/blogs/storage/dc49cfbc6dc5ac90fcc45c2b2bce54d4.png)

BloomFilterIndex 信息存放了生产的 Hash 策略、Hash 算法和 BloomFilter 过对应的数据 Page 信息。Hash 算法采用了 HASH_MURMUR3，Hash 策略采用了 BlockSplitBloomFilter 分块实现策略，期望的误判率 fpp 默认配置为 0.05。

BloomFilter 索引数据对应数据 Page 的存放与 ZoneMapIndex 类似，做了二级 Page 的优化，这里不再详细阐述。

### 9.2 索引生成规则

BloomFilter 按 Page 粒度生成，在数据写入一个完整的 Page 时，Doris 会根据 Hash 策略同时生成这个 Page 的 BloomFilter 索引数据。目前 bloom 过滤器不支持 tinyint/hll/float/double 类型，其他类型均已支持。使用时需要在 PROPERTIES 中指定 bloom_filter_columns 要使用 BloomFilter 索引的字段。

### 9.3 应用案例

在数据查询时，查询条件在设置有 bloom 过滤器的字段进行过滤，当 bloom 过滤器没有命中时表示该 Page 中没有该数据，这样可以减少要扫描的 page 数量。

案例：table 的 schema 如下：

![img](/images/blogs/storage/2D89E0227253499AAFB77477B64DC2E5.png)

这里的查询 sql 如下：

```sql
SELECT * FROM table WHERE name = '张三'
```

由于 name 的区分度较大，为了提升 sql 的查询性能，对 name 数据增加了 BloomFilter 索引，PROPERTIES ( "bloom_filter_columns" = "name" )。在查询时通过 BloomFilter 索引能够大量过滤掉 Page。

## 10 Bitmap Index 索引

Doris 还提供了 BitmapIndex 用来加速数据的查询。

## 10.1 存储结构

Bitmap 存储格式如下：

![img](/images/blogs/storage/3001a1785a41628cd88c6e2928290d2f.png)

BitmapIndex 的 meta 信息同样存放在 SegmentFootPB 中，BitmapIndex 包含了三部分，BitMap 的类型、字典信息 DictColumn、位图索引数据信息 BitMapColumn。其中 DictColumn、BitMapColumn 都对应 IndexedColumnData 结构，分别存放了字典数据和索引数据的 Page 地址 offset、大小 size。这里同样做了二级 page 的优化，不再具体阐述。

这里与其他索引存储结构有差异的地方是 DictColumn 字典数据进行了 LZ4F 压缩，在记录二级 Page 偏移时存放的是 Data Page 中的第一个值。

### 10.2 索引生成规则

BitMap 创建时需要通过 CREATE INDEX 进行创建。Bitmap 的索引是整个 Segment 中的 Column 字段的索引，而不是为每个 Page 单独生成一份。在写入数据时，会维护一个 map 结构记录下每个 key 值对应的行号，并采用 Roaring 位图对 rowid 进行编码。主要结构如下：

![img](/images/blogs/storage/e9a2a4defc1204c507c0b9359225650f.png)

生成索引数据时，首先写入字典数据，将 map 结构的 key 值写入到 DictColumn 中。然后，key 对应 Roaring 编码的 rowid 以字节方式将数据写入到 BitMapColumn 中。

### 10.3 应用案例

在数据查询时，对于区分度不大，列的基数比较小的数据列，可以采用位图索引进行优化。比如，性别，婚姻，地理信息等。

案例：table 的 schema 如下：

![img](/images/blogs/storage/EAD7EEF330B048BC8C1EBD8EF4842772.png)

这里的查询 sql 如下：

```sql
SELECT * FROM table WHERE city in ("北京", "上海")
```

由于 city 的取值比较少，建立数据字典和位图后，通过扫描位图便可以快速查找出匹配行。并且位图压缩后，数据量本身较小，通过扫描较少数据便能够对整个列进行精确的匹配。

## 11 索引的查询流程

在查询一个 Segment 中的数据时，根据执行的查询条件，会对首先根据字段加索引的情况对数据进行过滤。然后在进行读取数据，整体的查询流程如下：

![img](/images/blogs/storage/e2c62616c1c12fa05457eb6c443ebc48.png)

1. 首先，会按照 Segment 的行数构建一个 row_bitmap，表示记录那些数据需要进行读取，没有使用任何索引的情况下，需要读取所有数据。
2. 当查询条件中按前缀索引规则使用到了 key 时，会先进行 ShortKey Index 的过滤，可以在 ShortKey Index 中匹配到的 ordinal 行号范围，合入到 row_bitmap 中。
3. 当查询条件中列字段存在 BitMap Index 索引时，会按照 BitMap 索引直接查出符合条件的 ordinal 行号，与 row_bitmap 求交过滤。这里的过滤是精确的，之后去掉该查询条件，这个字段就不会再进行后面索引的过滤。
4. 当查询条件中列字段存在 BloomFilter 索引并且条件为等值（eq，in，is）时，会按 BloomFilter 索引过滤，这里会走完所有索引，过滤每一个 Page 的 BloomFilter，找出查询条件能命中的所有 Page。将索引信息中的 ordinal 行号范围与 row_bitmap 求交过滤。
5. 当查询条件中列字段存在 ZoneMap 索引时，会按 ZoneMap 索引过滤，这里同样会走完所有索引，找出查询条件能与 ZoneMap 有交集的所有 Page。将索引信息中的 ordinal 行号范围与 row_bitmap 求交过滤。
6. 生成好 row_bitmap 之后，批量通过每个 Column 的 OrdinalIndex 找到到具体的 Data Page。
7. 批量读取每一列的 Column Data Page 的数据。在读取时，对于有 null 值的 page，根据 null 值位图判断当前行是否是 null，如果为 null 进行直接填充即可。

## 12 总结

Doris 目前采用了完全的列存储结构，并提供了丰富的索引应对不同查询场景，为 Doris 高效的写入、查询性能奠定了夯实的基础。Doris 存储层设计灵活，未来还可以进一步增加新的索引、强化数据删除等功能。
