---
{
    "title": "Overview | Open Api",
    "language": "en",
    "description": "As a supplement to Apache Doris operation and maintenance management,"
}
---

As a supplement to Apache Doris operation and maintenance management, OPEN API is mainly used by database administrators to perform some management operations.

:::note
The OPEN API is currently unstable and is only recommended for developers to test and use. We may change the interface behavior in subsequent versions.
In a production environment, it is recommended to use SQL commands to complete operations.
:::

## Security certification

The security authentication of FE BE API can be enabled through the following configuration:

| Configuration | Configuration File | Default Value | Description |
| --- | ---| --- | --- |
| `enable_all_http_auth` | `be.conf` | `false` | Enable authentication for BE HTTP port (default 8040). After enabling, access to BE's HTTP API requires ADMIN user login. |
| `enable_brpc_builtin_services` | `be.conf` | true | Whether to open brpc built-in service to the outside world (default is 8060). If disabled, HTTP port 8060 will be inaccessible. (Supported since version 2.1.7) |
| `enable_all_http_auth` | `fe.conf` | `false` | Enable authentication for the FE HTTP port (default 8030). After enabling, access to the FE HTTP API requires corresponding user permissions. |

:::info NOTE
The permission requirements for the HTTP API of FE and BE vary from version to version. Please refer to the corresponding API documentation for details.
:::


