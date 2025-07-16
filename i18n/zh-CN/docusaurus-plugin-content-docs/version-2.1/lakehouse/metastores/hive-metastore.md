---
{
  "title": "Hive Metastore",
  "language": "zh-CN"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问 Hive Metastore 时所支持的参数。

## 参数总览

| 属性名称                                 | 曾用名 | 描述                                                                                                                                                                                                                                        | 默认值    | 是否必须 |
|--------------------------------------|---|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|------|
| `hive.metastore.uris`                | | Hive Metastore 的 URI 地址。支持指定多个 URI，使用逗号分隔。默认使用第一个 URI，当第一个 URI 不可用时，会尝试使用其他的。如：`thrift://172.0.0.1:9083` 或 `thrift://172.0.0.1:9083,thrift://172.0.0.2:9083`                                                                              | 无      | 是    |

## 启用 Kerberos 认证相关参数

```plaintext
"hadoop.authentication.type" = "kerberos",
"hive.metastore.service.principal" = "hive/_HOST@EXAMPLE.COM",
"hadoop.kerberos.principal" = "doris/_HOST@EXAMPLE.COM",
"hadoop.kerberos.keytab" = "etc/doris/conf/doris.keytab"
```

> 注意，当前版本中，hive 的 kerberos 认证参数和 hdfs 的 kerberos 认证参数共用。
