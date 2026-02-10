---
{
    "title": "数据正确性问题",
    "language": "zh-CN",
    "description": "本文档主要用于记录 Doris 使用过程中关于数据正确性的常见问题。会不定期更新。"
}
---

# 数据正确性问题

本文档主要用于记录 Doris 使用过程中关于数据正确性的常见问题。会不定期更新。

表格中的“表出现重复 key 数据”均指在 merge-on-write Unique 表中出现重复 key 数据。merge-on-write Unique 表上的重复 key 问题都可以通过[触发 full compaction](../admin-manual/trouble-shooting/repairing-data)来进行修复，其他类型的正确性问题可能需要根据情况来确定修复方案，如有需要，请联系社区支持。

|问题现象 | 发生条件 | 影响版本|Fix 版本 | 影响范围|Fix PR|
|---|---|---|---|---|---|
|merge-on-write Unique 表上部分列更新导入将之前已经被删除的数据补齐上来 | 部分列更新时指定了`__DORIS_DELETE_SIGN__`列，且存量历史数据中有被`__DORIS_DELETE_SIGN__`列标记删除的数据|<2.1.8, <3.0.4|>=2.1.8, >=3.0.4|存算一体，存算分离，部分列更新|[#46194](https://github.com/apache/doris/pull/46194)|
|表出现重复 key 数据 | 存算分离模式下在 merge-on-write Unique 表上有并发导入|<3.0.4|>=3.0.4|存算分离|[#46039](https://github.com/apache/doris/pull/46039)|
|表出现重复 key 数据 | 存算分离模式下在 merge-on-write Unique 表上同时存在导入与导入之间的并发以及导入和 compaction 之间的并发|<3.0.4|>=3.0.4|存算分离|[#44975](https://github.com/apache/doris/pull/44975)|
|系统生成的自增列的值出现 0/出现重复值 | BE 和 FE 之间存在网络异常 |<2.1.8, <3.0.3|>=2.1.8, >=3.0.3|存算一体，存算分离，自增列|[#43774](https://github.com/apache/doris/pull/43774)|
|使用 Stream Load 向 merge-on-write Unique 导入数据时，对于满足`delete`参数所指定的删除条件的数据，导入后没有被删除掉 | 使用 Stream Load 导入数据时，设置了`merge_type: MERGE`, `partial_columns: true`和`delete`参数|<2.0.15, <2.17, <3.0.3|>=2.0.15, >=2.17, >=3.0.3|存算一体，存算分离，部分列更新|[#40730](https://github.com/apache/doris/pull/40730)|
|使用部分列更新导入后，部分自增列数据被非预期更新为新的系统生成的值 | 表中存在在 Value 列上的自增列，且部分列更新导入没有指定这个自增列上的值|<2.1.6, <3.0.2|>=2.1.6, >=3.0.2|存算一体，存算分离，自增列|[#39996](https://github.com/apache/doris/pull/39996)|
|表出现重复 key 数据 | 用户使用`ALTER TABLE tbl ENABLE FEATURE "SEQUENCE_LOAD" WITH ...`语句给一个不支持 sequence 列的 merge-on-write Unique 表添加了 sequence 列功能并且之后有新的导入|<2.0.15, <2.1.6, <3.0.2|>=2.0.15, >=2.1.6, >=3.0.2|存算一体，存算分离|[#39958](https://github.com/apache/doris/pull/39958)|
|表出现重复 key 数据 | 存算分离模式下在 merge-on-write Unique 表上存在导入与导入之间的并发或导入和 compaction 之间的并发|<3.0.1|>=3.0.1|存算分离|[#39018](https://github.com/apache/doris/pull/39018)|
|使用部分列更新导入后，merge-on-write Unique 表中部分数据错乱|merge-on-write Unique 表上有并发的部分列更新导入，并且导入过程中有 BE 重启|<2.0.15, <2.1.6, <3.0.2|>=2.0.15, >=2.1.6, >=3.0.2|存算一体，存算分离，部分列更新|[#38331](https://github.com/apache/doris/pull/38331)|
|表出现重复 key 数据 | 存算分离模式下在 merge-on-write Unique 表上存在导入和 compaction 之间的并发|<3.0.2|>=3.0.2|存算分离|[#37670](https://github.com/apache/doris/pull/37670), [#41309](https://github.com/apache/doris/pull/41309), [#39791](https://github.com/apache/doris/pull/39791)|
|表出现重复 key 数据|merge-on-write Unique 表上有 sequence 列，表上存在单次数据量很大的导入，且触发了 segment compaction|<2.0.15, <2.1.6, <3.0.2|>=2.0.15, >=2.1.6, >=3.0.2|存算一体，存算分离|[#38369](https://github.com/apache/doris/pull/38369)|
|表出现重复 key 数据 | 存算一体模式下 merge-on-write Unique 表上有失败的 full clone|<2.0.13, <2.1.5, <3.0.0|>=2.0.13, >=2.1.5, >=3.0.0|存算一体|[#37001](https://github.com/apache/doris/pull/37001)|
|表出现重复 key 数据 | 存算分离模式下在 merge-on-write Unique 表上有 Stream Load 的导入且导入内部存在失败重试过程|<3.0.0|>=3.0.0|存算分离|[#36670](https://github.com/apache/doris/pull/36670)|
|merge-on-write Unique 表上多副本数据不一致|merge-on-write Unique 表上有过指定了`__DORIS_DELETE_SIGN__`列的部分列更新导入，且在导入的时候不同副本上 Base Compaction 进度不一致|<2.0.15, <2.1.5, <3.0.0|>=2.0.15, >=2.1.5, >=3.0.0|存算一体，存算分离，部分列更新|[#36210](https://github.com/apache/doris/pull/36210)|
|表出现重复 key 数据|merge-on-write Unique 表上有并发的部分列更新导入，并且导入过程中有 BE 重启|<2.0.11, <2.1.4, <3.0.0|>=2.0.11, >=2.1.4, >=3.0.0|存算一体，存算分离，部分列更新|[#35739](https://github.com/apache/doris/pull/35739)|


