# DML 计划调优

DML 计划调优首先需要定位是导入引起的性能瓶颈，还是查询部分引起的性能瓶颈 。查询部分的性能瓶颈的排查和调优详见计划调优章节其他小节。

Doris 支持从多种数据源导入数据，灵活运用 Doris 提供的多种导入功能，可以高效地将各种来源的数据导入到 Doris 中进行分析。最佳实践详情请参考[导入概览](https://doris.apache.org/zh-CN/docs/dev/data-operate/import/load-manual/)。
