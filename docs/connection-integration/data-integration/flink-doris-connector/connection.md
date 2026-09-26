---
{
    "title": "Connection Options and TLS",
    "language": "en",
    "description": "General options for connecting Flink Doris Connector to Doris, and how to enable TLS for the HTTP, JDBC, Thrift, and Arrow Flight SQL connections."
}
---

# Connection Options and TLS

This page lists the general options Flink Doris Connector uses to connect to Doris and explains how to enable TLS. These options apply to the Source, the Sink, and Lookup Join alike.

## General Options {#common-options}

| Key                           | Default Value | Required | Comment                                                                               |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------- |
| fenodes                       | --            | Y        | Doris FE http address, supports multiple addresses separated by commas                 |
| benodes                       | --            | N        | Doris BE http address, supports multiple addresses separated by commas                 |
| jdbc-url                      | --            | N        | jdbc connection information, for example: `jdbc:mysql://127.0.0.1:9030`                |
| table.identifier              | --            | Y        | Doris table name, for example: `db.tbl`                                                |
| username                      | --            | Y        | Username for accessing Doris                                                           |
| password                      | --            | Y        | Password for accessing Doris                                                           |
| auto-redirect                 | TRUE          | N        | Whether to redirect Stream Load requests. When enabled, Stream Load writes through FE without explicitly fetching BE information |
| doris.request.retries         | 3             | N        | Number of retries for sending requests to Doris                                        |
| doris.request.connect.timeout | 30s           | N        | Connection timeout for sending requests to Doris                                       |
| doris.request.read.timeout    | 30s           | N        | Read timeout for sending requests to Doris                                             |
| doris.enable.tls              | FALSE         | N        | Whether to enable TLS for Doris HTTP, MySQL/JDBC, BE Thrift, and Arrow Flight SQL connections. |
| doris.tls.ca-certificate-path | --            | N        | Local path to a PEM CA certificate chain. When empty, the Connector does not load a custom CA and uses the corresponding client's default trust store. |
| doris.tls.skip-hostname-verification | FALSE | N        | Whether to skip server hostname verification while retaining CA validation. |
| doris.tls.excluded-protocols  | --            | N        | Comma-separated protocols that remain plaintext while TLS is enabled. Supported values: `http`, `mysql`, `thrift`, and `arrowflight`. |

## Enabling TLS {#tls}

The Connector can enable TLS for Doris HTTP and Stream Load, MySQL/JDBC, BE Thrift, and Arrow Flight SQL connections. TLS is disabled by default, and the Connector verifies the Doris server certificate.

Add the following options to a Doris Source, Sink, or Catalog configuration:

```sql
'doris.enable.tls' = 'true',
'doris.tls.ca-certificate-path' = '/etc/doris-tls/ca-chain.pem'
```

When specifying a CA file with `doris.tls.ca-certificate-path`, use a PEM certificate chain and ensure that every Flink process connecting to Doris can read it from the local filesystem. When this path is not configured, the Connector does not load a custom CA and uses the corresponding client's default trust store. Keep hostname verification enabled in production.

If a Doris protocol intentionally remains plaintext, exclude only that protocol. Supported values are `http`, `mysql`, `thrift`, and `arrowflight`:

```sql
'doris.tls.excluded-protocols' = 'arrowflight'
```

The Connector does not probe protocols or fall back to plaintext after a TLS failure.

When `doris.enable.tls` is enabled, the Connector passes TLS settings through JDBC connection properties without modifying `jdbc-url`. Therefore, specify only the connection address in `jdbc-url`; do not add TLS parameters such as `sslMode`, `useSSL`, or trust store settings.

Arrow Flight SQL supports TLS but does not support skipping hostname verification only. If `doris.tls.skip-hostname-verification` is set to `true`, exclude `arrowflight` through `doris.tls.excluded-protocols`.

Distribute the CA file according to the Flink deployment mode:

- **Standalone**: place the file at the same path on all JobManager, TaskManager, and SQL Gateway hosts that connect to Doris.
- **YARN**: localize the file with `yarn.ship-files: /local/path/ca.pem`, and set `doris.tls.ca-certificate-path` to the container-localized file name, such as `ca.pem`.
- **Kubernetes**: mount a ConfigMap or Secret at the same path in the relevant JobManager and TaskManager pods.
