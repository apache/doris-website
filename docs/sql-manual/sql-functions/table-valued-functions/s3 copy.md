# Apache Doris Parquet 读取流程详解

## 目录

1. [Parquet 文件格式概览](#1-parquet-文件格式概览)
2. [核心类层次结构](#2-核心类层次结构)
3. [整体读取流程概览](#3-整体读取流程概览)
4. [Phase 1: ParquetReader 初始化](#4-phase-1-parquetreader-初始化)
5. [Phase 2: 文件打开与元数据解析](#5-phase-2-文件打开与元数据解析)
6. [Phase 3: Reader 初始化 (init_reader)](#6-phase-3-reader-初始化-init_reader)
7. [Phase 4: 列填充设置 (set_fill_columns)](#7-phase-4-列填充设置-set_fill_columns)
8. [Phase 5: 数据读取 (get_next_block)](#8-phase-5-数据读取-get_next_block)
9. [Phase 6: Row Group 过滤](#9-phase-6-row-group-过滤)
10. [Phase 7: Page Index 过滤](#10-phase-7-page-index-过滤)
11. [Phase 8: RowGroupReader 数据读取](#11-phase-8-rowgroupreader-数据读取)
12. [Phase 9: Lazy Read（延迟读取）](#12-phase-9-lazy-read延迟读取)
13. [Phase 10: 列数据读取链路](#13-phase-10-列数据读取链路)
14. [关键优化机制](#14-关键优化机制)
15. [调用流程图](#15-调用流程图)

---

## 1. Parquet 文件格式概览

Parquet 是一种列式存储格式，其文件结构如下：

```
+---------------------------+
|      Magic Number (PAR1)  |   ← 4 bytes
+---------------------------+
|      Row Group 0          |
|  +-----------------------+|
|  | Column Chunk 0        ||
|  |  +- Data Page 0 -+    ||
|  |  +- Data Page 1 -+    ||
|  |  +- Data Page N -+    ||
|  +-----------------------+|
|  | Column Chunk 1        ||
|  |  +- Data Page 0 -+    ||
|  |  +- Data Page N -+    ||
|  +-----------------------+|
|  | ...                   ||
|  +-----------------------+|
+---------------------------+
|      Row Group 1          |
|  +-----------------------+|
|  | ...                   ||
|  +-----------------------+|
+---------------------------+
|      ...                  |
+---------------------------+
|      Footer               |
|  +- File Metadata ------+ |
|  |  - Schema            | |
|  |  - Row Group Meta    | |
|  |  - Column Meta       | |
|  |  - Column Index      | |
|  |  - Offset Index      | |
|  +-----------------------+ |
|      Footer Length (4B)    |
|      Magic Number (PAR1)  |   ← 4 bytes
+---------------------------+
```

**关键概念：**
- **Row Group**：数据的水平分区，每个 Row Group 包含一定数量的行。
- **Column Chunk**：Row Group 中某一列的所有数据。
- **Data Page**：Column Chunk 中的数据单元，是编码和压缩的最小单位。
- **Column Index / Offset Index**：Page 级别的索引信息，用于 Page 级别的谓词过滤。

---

## 2. 核心类层次结构

Doris 中 Parquet 读取涉及的核心类如下：

```
ParquetReader (vparquet_reader.h)
    │
    ├── FileMetaData (vparquet_file_metadata.h)
    │       └── FieldDescriptor / FieldSchema (schema_desc.h)
    │
    ├── PageIndex (vparquet_page_index.h)
    │       ├── ColumnIndex  (谓词过滤：min/max/null_counts)
    │       └── OffsetIndex  (Page 偏移量定位)
    │
    ├── ParquetPredicate (parquet_predicate.h)
    │       ├── ColumnStat        (Row Group 级别统计信息)
    │       └── PageIndexStat     (Page 级别统计信息)
    │
    └── RowGroupReader (vparquet_group_reader.h)
            │
            ├── LazyReadContext  (延迟读取上下文)
            │
            └── ParquetColumnReader (vparquet_column_reader.h)
                    │
                    ├── ScalarColumnReader  (标量列读取)
                    │
                    └── ColumnChunkReader (vparquet_column_chunk_reader.h)
                            │
                            ├── PageReader (vparquet_page_reader.h)
                            │
                            ├── LevelDecoder (level_decoder.h)
                            │       ├── RepetitionLevel Decoder
                            │       └── DefinitionLevel Decoder
                            │
                            └── Decoder (decoder.h)
                                    ├── FixLengthPlainDecoder
                                    ├── ByteArrayPlainDecoder
                                    ├── ByteArrayDictDecoder
                                    ├── BoolPlainDecoder
                                    ├── BoolRLEDecoder
                                    ├── DeltaBitPackDecoder
                                    └── ByteStreamSplitDecoder
```

---

## 3. 整体读取流程概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     上层调用 (Scanner)                           │
│  1. 创建 ParquetReader                                          │
│  2. ParquetReader::init_reader()                                │
│  3. ParquetReader::set_fill_columns()                           │
│  4. 循环: ParquetReader::get_next_block() 直到 EOF              │
│  5. ParquetReader::close()                                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               ParquetReader (文件级别)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ _open_file()                                             │   │
│  │   ├── 创建 FileReader                                    │   │
│  │   └── 解析 Footer → FileMetaData                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ _next_row_group_reader()  [循环遍历每个 Row Group]        │   │
│  │   ├── _is_misaligned_range_group() → 范围对齐检查         │   │
│  │   ├── _process_min_max_bloom_filter() → Row Group 过滤    │   │
│  │   │     ├── _process_column_stat_filter()                 │   │
│  │   │     │     ├── Min/Max 统计过滤                         │   │
│  │   │     │     └── Bloom Filter 过滤                        │   │
│  │   │     └── _process_page_index_filter()                  │   │
│  │   │           ├── 解析 OffsetIndex                         │   │
│  │   │           ├── 解析 ColumnIndex                         │   │
│  │   │           └── Page 级别 Min/Max 过滤                   │   │
│  │   ├── 创建 MergeRangeFileReader (IO 优化)                 │   │
│  │   └── 创建 RowGroupReader                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              RowGroupReader (Row Group 级别)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ init()                                                    │   │
│  │   ├── 为每列创建 ParquetColumnReader                      │   │
│  │   ├── 字典过滤 (Dict Filter) 初始化                       │   │
│  │   └── 谓词重写 (_rewrite_dict_predicates)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ next_batch()                                              │   │
│  │   ├── 非 Lazy Read: 读取所有列 → 过滤 → 返回              │   │
│  │   └── Lazy Read:                                          │   │
│  │         ├── 1. 读取谓词列                                  │   │
│  │         ├── 2. 执行过滤生成 FilterMap                      │   │
│  │         ├── 3. 根据 FilterMap 读取剩余列(跳过不需要的行)   │   │
│  │         └── 4. 返回结果                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│           ParquetColumnReader → ColumnChunkReader               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ read_column_data()                                        │   │
│  │   ├── PageReader::next_page()   → 读取 Page Header        │   │
│  │   ├── load_page_data()          → 加载 Page 数据          │   │
│  │   ├── LevelDecoder              → 解码 Rep/Def Levels     │   │
│  │   └── Decoder::decode_values()  → 解码实际值               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Phase 1: ParquetReader 初始化

### 构造函数

`ParquetReader` 有 4 个构造函数，适配不同场景（带/不带 Profile，带/不带 IOContext holder）。核心初始化步骤如下：

```cpp
ParquetReader::ParquetReader(RuntimeProfile* profile, const TFileScanRangeParams& params,
                             const TFileRangeDesc& range, ...) {
    // 1. 设置批次大小（至少 _MIN_BATCH_SIZE）
    _batch_size = std::max(batch_size, _MIN_BATCH_SIZE);

    // 2. 初始化扫描范围
    _range_start_offset = range.start_offset;
    _range_size = range.size;

    // 3. 初始化查询选项中的过滤开关
    _enable_filter_by_min_max = state->query_options().enable_parquet_filter_by_min_max;
    _enable_filter_by_bloom_filter = state->query_options().enable_parquet_filter_by_bloom_filter;

    // 4. 初始化 Profile 计数器
    _init_profile();

    // 5. 初始化文件系统属性（HDFS/S3/本地等）
    _init_system_properties();

    // 6. 初始化文件描述信息（路径、大小等）
    _init_file_description();
}
```

### Profile 指标

`_init_profile()` 初始化了大量的性能指标计数器，用于监控读取过程的各个阶段：

| 指标分类 | 指标名 | 说明 |
|---------|--------|------|
| **Row Group 过滤** | `RowGroupsFiltered` | 被过滤掉的 Row Group 总数 |
| | `RowGroupsFilteredByMinMax` | 被 Min/Max 统计过滤的 Row Group 数 |
| | `RowGroupsFilteredByBloomFilter` | 被 Bloom Filter 过滤的 Row Group 数 |
| | `RowGroupsReadNum` | 实际读取的 Row Group 数 |
| | `RowGroupsTotalNum` | 总 Row Group 数 |
| **行过滤** | `FilteredRowsByGroup` | Row Group 级别过滤掉的行数 |
| | `FilteredRowsByPage` | Page 级别过滤掉的行数 |
| | `FilteredRowsByLazyRead` | Lazy Read 过滤掉的行数 |
| **IO** | `FilteredBytes` | 过滤掉的字节数 |
| | `FileNum` | 打开的文件数 |
| **时间** | `ColumnReadTime` | 列数据读取时间 |
| | `ParseMetaTime` | 元数据解析时间 |
| | `ParseFooterTime` | Footer 解析时间 |
| | `PageIndexFilterTime` | Page Index 过滤时间 |
| | `RowGroupFilterTime` | Row Group 过滤时间 |
| **解码** | `DecodeValueTime` | 值解码时间 |
| | `DecodeDictTime` | 字典解码时间 |
| | `DecodeLevelTime` | Level 解码时间 |
| | `DecodeNullMapTime` | Null Map 解码时间 |
| **Page Cache** | `PageCacheHitCount` | Page 缓存命中次数 |
| | `PageCacheMissingCount` | Page 缓存未命中次数 |

---

## 5. Phase 2: 文件打开与元数据解析

### `_open_file()` 流程

```
_open_file()
    │
    ├── 1. 创建 FileReader
    │     └── DelegateReader::create_file_reader()
    │         ├── 根据文件系统类型创建对应 Reader（HDFS/S3/Local等）
    │         └── 包装为 TracingFileReader（用于 IO 统计）
    │
    └── 2. 解析 Footer（FileMetaData）
          │
          ├── 检查文件大小 > 4 bytes（Magic Number）
          │
          ├── 是否有 MetaCache?
          │     ├── 有 → 从缓存获取
          │     │     └── _meta_cache->lookup()
          │     └── 无 → 解析 Thrift Footer
          │           └── parse_thrift_footer()
          │               ├── 从文件尾部读取 Footer Length
          │               ├── 读取 Footer 数据
          │               ├── 反序列化 Thrift 结构
          │               └── 构建 FileMetaData 对象
          │                     └── init_schema() → 解析 Schema
          │
          └── 验证 _file_metadata != nullptr
```

### Footer 解析细节

Parquet 文件的 Footer 位于文件末尾，包含：
1. **Schema**：列的名称、类型、嵌套结构等。
2. **Row Group Metadata**：每个 Row Group 的元信息（行数、大小、各列的统计信息）。
3. **Column Metadata**：每列的编码方式、压缩方式、字典页偏移量等。

Schema 解析结果存储在 `FieldDescriptor` 中，包含：
- `FieldSchema`：每个字段的定义，包括名称、类型、嵌套层级等。
- `physical_column_index`：物理列在 Parquet 文件中的索引位置。
- `definition_level` / `repetition_level`：嵌套类型的层级定义。

---

## 6. Phase 3: Reader 初始化 (init_reader)

### `init_reader()` 流程

```cpp
Status ParquetReader::init_reader(
        const std::vector<std::string>& all_column_names,     // 查询需要的所有列名
        std::unordered_map<std::string, uint32_t>* col_name_to_block_idx,  // 列名→Block位置映射
        const VExprContextSPtrs& conjuncts,                   // 所有谓词（WHERE条件）
        phmap::flat_hash_map<...>& slot_id_to_predicates,     // Column Predicate
        const TupleDescriptor* tuple_descriptor,              // 表结构描述
        ...
        std::shared_ptr<TableSchemaChangeHelper::Node> table_info_node_ptr,  // Schema Change 信息
        bool filter_groups,                                   // 是否进行 Row Group 过滤
        const std::set<uint64_t>& column_ids,                 // 需要读取的列ID集合
        const std::set<uint64_t>& filter_column_ids           // 需要过滤的列ID集合
) {
```

### 核心步骤

```
init_reader()
    │
    ├── 1. _open_file()   → 打开文件 + 解析 Footer
    │
    ├── 2. 获取 Row Group 总数
    │     └── _total_groups = _t_metadata->row_groups.size()
    │
    ├── 3. 列映射（表列 ↔ 文件列）
    │     │
    │     ├── 遍历查询需要的 all_column_names
    │     │     ├── 在文件中存在 → required_file_columns
    │     │     └── 在文件中不存在 → _missing_cols
    │     │
    │     └── 遍历文件 Schema
    │           └── 匹配 required_file_columns
    │                 ├── _read_file_columns  (文件中的列名)
    │                 ├── _read_table_columns (表中的列名)
    │                 └── _read_table_columns_set (用于快速查找)
    │
    └── 4. 保存谓词信息
          ├── _lazy_read_ctx.conjuncts = conjuncts
          └── _lazy_read_ctx.slot_id_to_predicates = slot_id_to_predicates
```

### 列映射说明

由于 Schema Change（如列重命名）的存在，表列名和文件列名可能不一致。`TableSchemaChangeHelper::Node` 负责维护这种映射关系：

```
Table Column Name  ──(table_info_node_ptr)──>  File Column Name
     "user_id"     ──────────────────────>      "uid"
     "user_name"   ──────────────────────>      "user_name"
     "new_col"     ──────────────────────>      (不存在 → missing_col)
```

---

## 7. Phase 4: 列填充设置 (set_fill_columns)

### `set_fill_columns()` 流程

此方法设置分区列和缺失列的填充方式，并决定是否启用 Lazy Read 优化。

```
set_fill_columns()
    │
    ├── 1. 设置分区列和缺失列
    │     ├── _lazy_read_ctx.fill_partition_columns = partition_columns
    │     └── _lazy_read_ctx.fill_missing_columns = missing_columns
    │
    ├── 2. 收集谓词列 (predicate_columns)
    │     └── 遍历所有 conjuncts
    │           └── visit_slot() 递归收集 VSlotRef
    │                 → predicate_columns[col_name] = (col_id, slot_id)
    │
    ├── 3. 构建 Push Down Predicates (用于 Row Group 过滤)
    │     └── 遍历 slot_id_to_predicates
    │           ├── 检查列是否存在于文件中 (_exists_in_file)
    │           ├── 检查类型是否匹配 (_type_matches)
    │           └── 构建 AndBlockColumnPredicate → _push_down_predicates
    │
    ├── 4. 列分类（决定 Lazy Read 策略）
    │     │
    │     ├── 对 _read_table_columns 中的每一列:
    │     │     ├── 有谓词 → predicate_columns (先读)
    │     │     └── 无谓词 → lazy_read_columns  (后读)
    │     │
    │     ├── 对分区列:
    │     │     ├── 有谓词 → predicate_partition_columns
    │     │     └── 无谓词 → partition_columns
    │     │
    │     └── 对缺失列:
    │           ├── 有谓词 → predicate_missing_columns
    │           └── 无谓词 → missing_columns
    │
    └── 5. 确定是否可以 Lazy Read
          └── can_lazy_read = _enable_lazy_mat
                            && predicate_columns.size() > 0
                            && lazy_read_columns.size() > 0
```

### Lazy Read 列分类示意

```
SELECT a, b, c, d FROM table WHERE a > 10 AND b = 'hello';

┌──────────────────────────────────────────────┐
│  predicate_columns: [a, b]    ← 先读取+过滤  │
│  lazy_read_columns: [c, d]    ← 后读取       │
│  can_lazy_read: true                          │
└──────────────────────────────────────────────┘
```

---

## 8. Phase 5: 数据读取 (get_next_block)

### `get_next_block()` 主循环

```cpp
Status ParquetReader::get_next_block(Block* block, size_t* read_rows, bool* eof) {
    // 1. 如果没有当前 RowGroupReader 或已读完当前 Row Group
    if (_current_group_reader == nullptr || _row_group_eof) {
        // 获取下一个 Row Group 的 Reader
        Status st = _next_row_group_reader();
        // 如果没有更多 Row Group → EOF
    }

    // 2. COUNT 聚合优化
    if (_push_down_agg_type == TPushAggOp::type::COUNT) {
        // 直接返回行数，不读实际数据
        auto rows = std::min(remaining_rows, batch_size);
        // resize 列并返回
    }

    // 3. 读取数据
    _current_group_reader->next_batch(block, _batch_size, read_rows, &_row_group_eof);

    // 4. Row Group 读完后收集统计信息
    if (_row_group_eof) {
        _column_statistics.merge(column_st);
        // 累计 lazy_read_filtered_rows, predicate_filter_time 等
    }
}
```

---

## 9. Phase 6: Row Group 过滤

### `_process_min_max_bloom_filter()` 流程

这是 Row Group 级别的主过滤入口，按以下顺序执行过滤：

```
_process_min_max_bloom_filter()
    │
    ├── 不需要过滤? (_filter_groups == false)
    │     └── 直接返回整个 Row Group 的行范围
    │
    ├── 按行读取模式? (_read_by_rows)
    │     └── 根据 _row_ids 确定读取范围
    │
    └── 正常过滤模式
          │
          ├── Step 1: _process_column_stat_filter()
          │     │
          │     ├── Min/Max 统计过滤
          │     │     ├── 从 Column Metadata 中读取 min/max 值
          │     │     └── 用谓词评估是否可以跳过该 Row Group
          │     │
          │     └── Bloom Filter 过滤
          │           ├── 从文件中读取 Bloom Filter 数据
          │           └── 检查谓词值是否存在于 Bloom Filter 中
          │
          └── Step 2: 如果 Row Group 未被过滤
                └── _process_page_index_filter()
                      └── Page 级别精细过滤（见下一节）
```

### Min/Max 统计过滤细节

```
_process_column_stat_filter()
    │
    ├── 遍历每个 push_down_predicate:
    │     │
    │     ├── get_stat_func(stat, column_id):
    │     │     ├── 找到对应的文件列
    │     │     ├── 获取 Column Metadata 中的统计信息
    │     │     └── ParquetPredicate::read_column_stats()
    │     │           ├── 读取 min_value, max_value
    │     │           ├── 读取 null_count, num_values
    │     │           └── 处理 sort_order（有符号/无符号/未定义）
    │     │
    │     ├── get_bloom_filter_func(stat, column_id):
    │     │     ├── 检查 bloom_filter_offset 是否存在
    │     │     ├── 检查数据类型是否支持 Bloom Filter
    │     │     ├── 检查缓存（避免同一列多次读取）
    │     │     └── ParquetPredicate::read_bloom_filter()
    │     │           ├── 从文件 bloom_filter_offset 处读取数据
    │     │           └── 构建 ParquetBlockSplitBloomFilter
    │     │
    │     └── predicate->evaluate_and(stat):
    │           ├── 如果返回 false → filter_group = true
    │           └── 记录是 min_max 还是 bloom_filter 过滤的
    │
    └── 返回 filter_group 结果
```

---

## 10. Phase 7: Page Index 过滤

### `_process_page_index_filter()` 流程

Page Index 过滤是更细粒度的过滤，发生在 Row Group 通过了 Row Group 级别过滤之后。

```
_process_page_index_filter()
    │
    ├── 前置检查
    │     ├── config::enable_parquet_page_index == false? → 读整个 Row Group
    │     ├── _colname_to_slot_id == nullptr? → 读整个 Row Group
    │     └── 没有 Page Index 范围信息? → 读整个 Row Group
    │
    ├── 收集所有需要读取的物理列 ID (parquet_col_ids)
    │     └── 递归处理复杂类型（Array/Map/Struct）
    │
    ├── 解析 Offset Index（始终执行）
    │     │  ★ 从 PR #55795 开始，Offset Index 总是被解析
    │     ├── 从文件中读取 Offset Index 数据
    │     ├── 为每个列解析 tparquet::OffsetIndex
    │     └── 存入 _col_offsets[parquet_col_id]
    │
    ├── 检查是否需要 Min/Max 过滤
    │     └── !_enable_filter_by_min_max || push_down_pred.empty()?
    │           → 读整个 Row Group（但 Offset Index 已解析完毕）
    │
    ├── 读取 Column Index
    │     └── 从文件中批量读取 Column Index 数据
    │
    └── 构建 CachedPageIndexStat 并执行过滤
          │
          ├── 对每个谓词列构建 PageIndexStat:
          │     ├── 解析 tparquet::ColumnIndex
          │     ├── 获取每个 Page 的:
          │     │     ├── min_values / max_values
          │     │     ├── null_pages (是否全 null)
          │     │     ├── null_counts (null 值数量)
          │     │     └── 行范围 (first_row_index → next page first_row_index)
          │     └── 缓存结果避免重复计算
          │
          └── 对每个 push_down_pred:
                ├── predicate->evaluate_and(cached_page_index, &tmp_row_range)
                └── ranges_intersection(candidate, tmp, candidate)
                      → 最终得到需要读取的 Page 行范围
```

### Page Index 结构示意

```
Column Index:                    Offset Index:
┌──────────────────────┐         ┌──────────────────────────────┐
│ Page 0:              │         │ Page 0:                      │
│   min = 1, max = 100 │         │   offset = 1000              │
│   null_count = 0     │         │   compressed_size = 500      │
│   null_page = false  │         │   first_row_index = 0        │
├──────────────────────┤         ├──────────────────────────────┤
│ Page 1:              │         │ Page 1:                      │
│   min = 101, max=200 │         │   offset = 1500              │
│   null_count = 5     │         │   compressed_size = 480      │
│   null_page = false  │         │   first_row_index = 1000     │
├──────────────────────┤         ├──────────────────────────────┤
│ Page 2:              │         │ Page 2:                      │
│   min = N/A, max=N/A │         │   offset = 1980              │
│   null_count = 1000  │         │   compressed_size = 100      │
│   null_page = true   │         │   first_row_index = 2000     │
└──────────────────────┘         └──────────────────────────────┘

查询: WHERE col > 150
→ Page 0 (max=100 < 150): 跳过
→ Page 1 (max=200 > 150): 需要读取
→ Page 2 (null_page):     跳过
→ candidate_row_ranges = [{1000, 2000}]
```

---

## 11. Phase 8: RowGroupReader 数据读取

### `_next_row_group_reader()` - 创建 RowGroupReader

```
_next_row_group_reader()
    │
    ├── 1. 遍历 Row Groups
    │     │
    │     ├── 检查范围对齐 (_is_misaligned_range_group)
    │     │     └── 分布式扫描时，每个 Scanner 只处理特定范围的 Row Group
    │     │
    │     ├── 执行过滤 (_process_min_max_bloom_filter)
    │     │     → 得到 candidate_row_ranges
    │     │
    │     ├── 计算 group_size（需要读取的压缩大小）
    │     │
    │     └── 如果 candidate_row_ranges.count() > 0
    │           → 找到可读的 Row Group，break
    │
    ├── 2. IO 优化 - 创建文件读取器
    │     │
    │     ├── InMemoryFileReader? → 直接使用
    │     │
    │     └── 否 → _generate_random_access_ranges()
    │           ├── 计算每列的读取范围 (chunk_start → chunk_end)
    │           ├── 计算平均 IO 大小
    │           └── avg_io_size < SMALL_IO?
    │                 ├── 是 → MergeRangeFileReader（合并小IO）
    │                 └── 否 → 直接使用 _file_reader
    │
    └── 3. 创建 RowGroupReader 并初始化
          │
          ├── new RowGroupReader(file_reader, read_columns, row_group, ...)
          │
          └── _current_group_reader->init(schema, candidate_row_ranges,
          │     col_offsets, tuple_descriptor, ...)
          │
          └── init() 内部:
                ├── 为每个读取列创建 ParquetColumnReader
                ├── 检查字典过滤可行性
                └── 重写字典谓词 (_rewrite_dict_predicates)
```

### RowGroupReader::init() 细节

```
RowGroupReader::init()
    │
    ├── 1. 保存行范围
    │     ├── _read_ranges = row_ranges (来自 Page Index 过滤)
    │     └── _remaining_rows = row_ranges.count()
    │
    ├── 2. 创建列读取器
    │     │  缓冲区大小 = min(MAX_COLUMN_BUF, MAX_GROUP_BUF / 列数)
    │     │
    │     └── 对每个 read_table_col:
    │           └── ParquetColumnReader::create()
    │                 ├── 获取文件列名和 FieldSchema
    │                 ├── 根据类型创建对应 Reader:
    │                 │     ├── Scalar → ScalarColumnReader
    │                 │     ├── Array → ArrayColumnReader
    │                 │     ├── Map → MapColumnReader
    │                 │     └── Struct → StructColumnReader
    │                 └── 如果有 Offset Index → 传入 offset_index
    │
    ├── 3. 字典过滤初始化
    │     │
    │     ├── 检查每个谓词列是否可以字典过滤:
    │     │     ├── 列类型为 STRING/VARCHAR
    │     │     ├── Parquet 类型为 BYTE_ARRAY
    │     │     ├── 整个 Column Chunk 是字典编码
    │     │     └── 谓词类型为 IN_PRED 或 BINARY_PRED
    │     │
    │     └── _dict_filter_cols 记录可字典过滤的列
    │
    └── 4. 字典谓词重写 (_rewrite_dict_predicates)
          │
          ├── 读取字典值到临时列
          ├── 执行谓词得到匹配的字典码
          ├── 构建新的 IN 谓词（基于字典码）
          └── 如果没有匹配 → 标记 Row Group 整体跳过
```

---

## 12. Phase 9: Lazy Read（延迟读取）

### Lazy Read 原理

Lazy Read 是一种重要的优化技术。核心思想：先读取有谓词的列，执行过滤后，只对通过过滤的行读取其余列。

```
传统读取:
  读取 col_a (1000行) → 读取 col_b (1000行) → 读取 col_c (1000行) → 过滤 → 返回 10行

Lazy Read:
  读取 col_a (1000行，有谓词) → 过滤 → 10行通过
  读取 col_b (仅10行) → 读取 col_c (仅10行) → 返回 10行
```

### `_do_lazy_read()` 流程

```
_do_lazy_read()
    │
    ├── 循环 (直到有数据通过过滤或 EOF):
    │     │
    │     ├── Step 1: 读取谓词列
    │     │     └── _read_column_data(predicate_columns, batch_size, ...)
    │     │
    │     ├── Step 2: 填充分区列和缺失列（谓词相关的）
    │     │     ├── _fill_partition_columns(predicate_partition_columns)
    │     │     └── _fill_missing_columns(predicate_missing_columns)
    │     │
    │     ├── Step 3: 构建位置删除过滤器（Iceberg）
    │     │     └── _build_pos_delete_filter()
    │     │
    │     ├── Step 4: 执行谓词过滤
    │     │     ├── Resize first column (VExprContext 优化 trick)
    │     │     ├── VExprContext::execute_conjuncts() → result_filter
    │     │     └── 构建 FilterMap
    │     │
    │     └── Step 5: 检查过滤结果
    │           ├── filter_all == true:
    │           │     ├── 清空谓词列数据
    │           │     ├── _cached_filtered_rows += pre_read_rows
    │           │     │     (缓存连续跳过的行数，可跳过整个 Page)
    │           │     └── 继续循环
    │           └── 有数据通过 → break
    │
    ├── 处理缓存的过滤行
    │     └── _rebuild_filter_map() → 在 FilterMap 前面补零
    │
    ├── Step 6: 读取 Lazy 列（使用 FilterMap 跳过不需要的行）
    │     └── _read_column_data(lazy_read_columns, pre_read_rows, ..., filter_map)
    │           └── 列读取器根据 filter_map 跳过被过滤的行
    │
    ├── Step 7: 过滤谓词列数据
    │     └── Block::filter_block_internal(block, all_predicate_col_ids, result_filter)
    │
    └── Step 8: 填充剩余的分区列和缺失列
          ├── _fill_partition_columns(partition_columns, column_size)
          └── _fill_missing_columns(missing_columns, column_size)
```

### FilterMap 工作原理

```
FilterMap 示例 (batch_size=10):

谓词列数据:  [1, 5, 3, 8, 2, 9, 4, 7, 6, 0]
谓词: col > 5

result_filter: [0, 0, 0, 1, 0, 1, 0, 1, 1, 0]
                                ↑     ↑     ↑  ↑
                                8     9     7  6

Lazy 列读取时使用 FilterMap:
  - filter=0 的行: skip_values() → 不读数据
  - filter=1 的行: decode_values() → 读取数据

最终只读取了 4 行的 Lazy 列数据，而不是 10 行
```

---

## 13. Phase 10: 列数据读取链路

### `_read_column_data()` 流程

```
RowGroupReader::_read_column_data()
    │
    ├── 遍历每个需要读取的列:
    │     │
    │     ├── 字典过滤列特殊处理:
    │     │     └── 替换列类型为 Int32（存储字典码）
    │     │
    │     ├── reset_filter_map_index()
    │     │
    │     └── 循环读取直到 batch_size 或 EOF:
    │           └── _column_readers[col]->read_column_data(
    │                 column_ptr, type, table_info_node,
    │                 filter_map, batch_size, &loop_rows, &eof, is_dict_filter)
    │
    └── 验证所有列读取的行数一致
```

### ScalarColumnReader::read_column_data() 流程

```
ScalarColumnReader::read_column_data()
    │
    ├── 1. 确保当前 Page 数据已加载
    │     └── _chunk_reader->load_page_data_idempotent()
    │
    ├── 2. 读取 Definition Levels
    │     └── def_level_decoder().decode(batch_size) → _def_levels
    │
    ├── 3. 读取 Repetition Levels (嵌套类型)
    │     └── rep_level_decoder().decode(batch_size) → _rep_levels
    │
    ├── 4. 构建 ColumnSelectVector
    │     │  根据 Definition Level 确定每个值的状态:
    │     │  - CONTENT: 非空值，需要从 Decoder 读取
    │     │  - NULL_DATA: 空值
    │     │  - FILTERED_CONTENT: 被 FilterMap 过滤的非空值（跳过）
    │     │  - FILTERED_NULL: 被 FilterMap 过滤的空值（跳过）
    │     │
    │     └── 根据行范围 (_row_ranges) 裁剪
    │
    ├── 5. 跳过被过滤的值
    │     └── _chunk_reader->skip_values(filtered_content_count)
    │
    └── 6. 解码值到 Doris Column
          └── _chunk_reader->decode_values(doris_column, type, select_vector, is_dict_filter)
                │
                └── Decoder::decode_values()
                      ├── FixLengthPlainDecoder  (INT32/INT64/FLOAT/DOUBLE 等)
                      ├── ByteArrayPlainDecoder  (STRING/BINARY)
                      ├── ByteArrayDictDecoder   (字典编码的 STRING)
                      ├── BoolPlainDecoder       (BOOLEAN)
                      ├── DeltaBitPackDecoder     (INT32/INT64 Delta编码)
                      └── ByteStreamSplitDecoder  (FLOAT/DOUBLE)
```

### ColumnChunkReader 内部工作流

```
ColumnChunkReader 状态机:

     ┌──────────┐
     │  HEADER  │ ← 初始状态 / next_page() 后
     └────┬─────┘
          │ load_page_data()
          ▼
     ┌──────────┐
     │DATA_LOADED│ ← Page 数据已加载到内存
     └────┬─────┘
          │ decode_values() / skip_values()
          │ (remaining_num_values == 0 时)
          ▼
     ┌──────────┐
     │ PAGE_END │ → has_next_page()? → next_page() → 回到 HEADER
     └──────────┘

每个 Page 的处理:
  1. next_page()
     ├── PageReader 读取 Page Header (Thrift 反序列化)
     ├── 获取 compressed_page_size / uncompressed_page_size / num_values
     └── 检查 Page Cache
  
  2. load_page_data()
     ├── 读取压缩数据
     ├── 解压缩 (如果需要)
     │     └── BlockCompressionCodec::decompress()
     ├── 初始化 Level Decoder (Rep + Def)
     └── 初始化 Value Decoder
  
  3. decode_values() / skip_values()
     ├── 根据 ColumnSelectVector 决定读取/跳过
     └── 更新 remaining_num_values
```

### PageReader 与 Page Cache

```
PageReader::next_page()
    │
    ├── 有 Offset Index?
    │     ├── 是 → 根据 Offset Index 直接定位 Page
    │     │         └── 支持跳过不需要的 Page (skip_page)
    │     └── 否 → 顺序读取所有 Page Header
    │
    └── Page Cache 检查 (enable_parquet_file_page_cache)
          │
          ├── 检查是否缓存解压后数据
          │     └── should_cache_decompressed()
          │           └── 压缩比 <= parquet_page_cache_decompress_threshold?
          │                 ├── 是 → 缓存解压后数据
          │                 └── 否 → 缓存压缩数据
          │
          ├── 缓存命中 → 直接使用缓存数据
          └── 缓存未命中 → 从文件读取 + 写入缓存
```

---

## 14. 关键优化机制

### 14.1 多级过滤

```
┌───────────────────────────────────────────┐
│ Level 1: Row Group Min/Max 过滤           │  粗粒度，效率最高
│   ← 基于 Column Metadata 的统计信息       │
├───────────────────────────────────────────┤
│ Level 2: Row Group Bloom Filter 过滤      │  精确判断值是否存在
│   ← 从文件读取 Bloom Filter 数据          │
├───────────────────────────────────────────┤
│ Level 3: Page Index Min/Max 过滤          │  细粒度到 Page 级别
│   ← 基于 Column Index 的 Page 级别统计    │
├───────────────────────────────────────────┤
│ Level 4: Dict Filter 过滤                 │  字典编码列的高效过滤
│   ← 基于字典值重写谓词                    │
├───────────────────────────────────────────┤
│ Level 5: Lazy Read 过滤                   │  读取时的行级别过滤
│   ← 先读谓词列过滤，再读其余列            │
├───────────────────────────────────────────┤
│ Level 6: Position Delete (Iceberg/Paimon) │  行级别删除标记
│   ← 根据删除文件标记跳过特定行            │
└───────────────────────────────────────────┘
```

### 14.2 IO 优化

| 优化 | 说明 |
|------|------|
| **MergeRangeFileReader** | 当平均 IO 大小较小时，合并多个小 IO 请求为一个大请求 |
| **BufferedStreamReader** | 流式缓冲读取，减少系统调用次数 |
| **TracingFileReader** | IO 追踪统计，不影响性能 |
| **FileMetaCache** | Footer 元数据缓存，避免重复解析同一文件的 Footer |
| **Page Cache** | 数据页缓存，支持压缩/解压后两种缓存策略 |

### 14.3 Lazy Materialization

```
传统模式:
  IO: ████████████████████ (读取所有列的所有行)
  CPU: ████████ (解码所有数据后过滤)

Lazy Read 模式:
  IO: ████ (只读谓词列) + ██ (只读通过过滤的行的其余列)
  CPU: ██ (解码谓词列) + █ (解码少量通过的行)
  跳过: ░░░░░░░░░░░░░░ (被过滤掉的行不读取)
```

### 14.4 Dict Filter

```
原始数据:                字典:
  "apple"               0 → "apple"
  "banana"              1 → "banana"
  "cherry"              2 → "cherry"
  "apple"               3 → "date"
  "date"
  "banana"

存储为字典码: [0, 1, 2, 0, 3, 1]

查询: WHERE col = 'apple'
  1. 在字典中查找 'apple' → 字典码 0
  2. 重写谓词: WHERE dict_code = 0
  3. 整数比较比字符串比较快得多
  4. 如果字典中不存在 → 整个 Row Group 跳过
```

---

## 15. 调用流程图

### 完整调用时序图

```
Scanner                     ParquetReader              RowGroupReader         ColumnReader
  │                              │                          │                     │
  │── new ParquetReader() ──────>│                          │                     │
  │                              │                          │                     │
  │── init_reader() ────────────>│                          │                     │
  │                              │── _open_file() ─────────>│                     │
  │                              │   ├── create FileReader  │                     │
  │                              │   └── parse Footer       │                     │
  │                              │── map columns            │                     │
  │                              │── save predicates        │                     │
  │                              │<─────────────────────────│                     │
  │<─────────────────────────────│                          │                     │
  │                              │                          │                     │
  │── set_fill_columns() ──────>│                          │                     │
  │                              │── classify columns       │                     │
  │                              │── build push_down_pred   │                     │
  │                              │── determine lazy_read    │                     │
  │<─────────────────────────────│                          │                     │
  │                              │                          │                     │
  │══ LOOP ═════════════════════════════════════════════════════════════════════  │
  │                              │                          │                     │
  │── get_next_block() ────────>│                          │                     │
  │                              │                          │                     │
  │                              │── _next_row_group_reader()                     │
  │                              │   │                      │                     │
  │                              │   ├── check range align  │                     │
  │                              │   │                      │                     │
  │                              │   ├── _process_min_max_bloom_filter()          │
  │                              │   │   ├── min/max filter │                     │
  │                              │   │   ├── bloom filter   │                     │
  │                              │   │   └── page index filter                    │
  │                              │   │       ├── parse offset index               │
  │                              │   │       ├── parse column index               │
  │                              │   │       └── → candidate_row_ranges           │
  │                              │   │                      │                     │
  │                              │   ├── create MergeRangeFileReader              │
  │                              │   │                      │                     │
  │                              │   └── new RowGroupReader ────────────────────>  │
  │                              │       └── init() ───────>│                     │
  │                              │                          │── create ColumnReaders
  │                              │                          │── dict filter init  │
  │                              │                          │── rewrite dict pred │
  │                              │                          │                     │
  │                              │── next_batch() ─────────>│                     │
  │                              │                          │                     │
  │                              │   [Non-Lazy Read]        │                     │
  │                              │                          │── read_column_data()│
  │                              │                          │   (all columns) ───>│── decode levels
  │                              │                          │                     │── decode values
  │                              │                          │<───────────────────│
  │                              │                          │── fill partition   │
  │                              │                          │── fill missing     │
  │                              │                          │── execute filter   │
  │                              │                          │                     │
  │                              │   [Lazy Read]            │                     │
  │                              │                          │── read predicate cols
  │                              │                          │   ──────────────────>│── decode
  │                              │                          │<───────────────────│
  │                              │                          │── execute filter    │
  │                              │                          │── → FilterMap       │
  │                              │                          │── read lazy cols    │
  │                              │                          │   (with FilterMap) ─>│── skip/decode
  │                              │                          │<───────────────────│
  │                              │                          │── filter predicate  │
  │                              │                          │   columns           │
  │                              │                          │                     │
  │                              │<─────────────────────────│                     │
  │<─────────────────────────────│                          │                     │
  │                              │                          │                     │
  │══ END LOOP (EOF) ══════════════════════════════════════════════════════════  │
  │                              │                          │                     │
  │── close() ─────────────────>│                          │                     │
  │                              │── _collect_profile()     │                     │
  │<─────────────────────────────│                          │                     │
```

### 关键数据流向

```
File on Storage
    │
    ▼
FileReader (HDFS/S3/Local/...)
    │
    ▼
TracingFileReader (IO 统计包装)
    │
    ├───────────────────────┐
    │                       │
    ▼                       ▼
MergeRangeFileReader    直接读取
(合并小IO)              (大IO)
    │                       │
    ├───────────────────────┘
    │
    ▼
BufferedStreamReader (流式缓冲)
    │
    ▼
PageReader (Page 迭代器)
    │
    ├── Page Header (Thrift 反序列化)
    ├── Page Data (压缩数据)
    │     │
    │     ▼
    │   BlockCompressionCodec::decompress()
    │     │
    │     ▼
    │   解压后数据
    │     │
    │     ├── Level Data → LevelDecoder
    │     │     ├── Rep Levels
    │     │     └── Def Levels
    │     │
    │     └── Value Data → Decoder
    │           │
    │           ▼
    │     Doris Column (Block 中的列)
    │
    ▼
Page Cache (可选)
```

---

## 附录：相关源文件

| 文件 | 说明 |
|------|------|
| `vparquet_reader.h/cpp` | Parquet 文件级别读取器，负责整体流程控制 |
| `vparquet_group_reader.h/cpp` | Row Group 级别读取器，管理列读取和 Lazy Read |
| `vparquet_column_reader.h/cpp` | 列级别读取器，处理嵌套类型和 Level 解码 |
| `vparquet_column_chunk_reader.h/cpp` | Column Chunk 读取器，管理 Page 和 Decoder |
| `vparquet_page_reader.h/cpp` | Page 级别读取器，处理 Page Header 和 Page Cache |
| `vparquet_page_index.h/cpp` | Page Index 解析器（Column Index + Offset Index） |
| `vparquet_file_metadata.h/cpp` | 文件元数据封装 |
| `schema_desc.h/cpp` | Schema 描述和解析 |
| `parquet_predicate.h/cpp` | 谓词评估（Min/Max、Bloom Filter、Page Index） |
| `decoder.h` | 值解码器基类及各种编码实现 |
| `level_decoder.h` | Rep/Def Level 解码器 |
| `parquet_common.h` | 公共类型定义（RowRanges、FilterMap 等） |
| `parquet_column_convert.h` | Parquet 类型到 Doris 类型的转换 |
| `parquet_block_split_bloom_filter.h` | Parquet Split Block Bloom Filter 实现 |
