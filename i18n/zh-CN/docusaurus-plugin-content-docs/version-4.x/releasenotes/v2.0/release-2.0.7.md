---
{
    "title": "Release 2.0.7",
    "language": "zh-CN",
    "description": "924060929,airborne12,amorynan,ByteYue,dataroaring,deardeng,feiniaofeiafei,felixwluo,freemandealer,gavinchou,hello-stephen,HHoflittlefish777,jacktengg,"
}
---

## 1 行为变更

- `round` 函数行为跟 MySQL 保持一致，例如 `round(5/2)` 返回 3 而不是 2.

  - https://github.com/apache/doris/pull/31583


- 时间精度转换行为跟 MySQL 保持一致，例如 '2023-10-12 14:31:49.666' 四舍五人到 '2023-10-12 14:31:50' .
  
  - https://github.com/apache/doris/pull/27965 

## 2 新功能

- 在更多的情况下可以将 OUTER JOIN 转换成 ANTI JOIN 来加速查询
  
  - https://github.com/apache/doris/pull/31854

- 支持通过 Nginx, HAProxy 等代理连接的 IP 透传
  
  - https://github.com/apache/doris/pull/32338


## 3 改进和优化

- 通过在 `information_schema` 中增加 DEFAULT_ENCRYPTION 列、增加 `processlist` 表，提升 BI 工具的兼容性

- 创建 JDBC Catalog 时默认自动检测连通性

- 增强自动恢复提升 Kafka Routine Load 的稳定性

- 倒排索引中文分词对英文默认做小写转换

- Repeat 函数的重复次数超过限制时报错

- 自动跳过 Hive 外表中的隐藏文件和目录

- 在某些极端情况下减少 File Meta Cache 避免 OOM

- 减少 Broker Load 的 jvm 内存占用

- 加速带排序的 INSERT INTO SELECT 比如 `INSERT INTO t1 SELECT * FROM t2 ORDER BY k`


## 4 致谢

924060929,airborne12,amorynan,ByteYue,dataroaring,deardeng,feiniaofeiafei,felixwluo,freemandealer,gavinchou,hello-stephen,HHoflittlefish777,jacktengg,jackwener,jeffreys-cat,Jibing-Li,KassieZ,LiBinfeng-01,luwei16,morningman,mrhhsg,Mryange,nextdreamblue,platoneko,qidaye,rohitrs1983,seawinde,shuke987,starocean999,SWJTU-ZhangLei,w41ter,wsjz,wuwenchi,xiaokang,XieJiann,XuJianxu,yujun777,Yulei-Yang,zhangstar333,zhiqiang-hhhh,zy-kkk,zzzxl1993