---
{
    "title": "CHECK/RESET Stub Cache",
    "language": "en"
}
---

# CHECK/RESET Stub Cache
## description
   
### Check Stub Cache
    Check whether the connection cache is available

    Description: Check whether the connection cache is available, the maximum load is 10M
    METHOD: GET
    URI: http://be_host:be_http_port/api/check_rpc_channel/{host_to_check}/{remot_brpc_port}/{payload_size}
   
### Reset Stub Cache
    This api is used to reset the connection cache of brpc. Endpoints can be in the form of `all` to clear all caches, `host1:port1,host2:port2,...`: clear to the cache of the specified target

    Description: Reset connection cache
    METHOD: GET
    URI: http://be_host:be_http_port/api/reset_rpc_channel/{endpoints}
## example

    curl -X GET "http://host:port/api/check_rpc_channel/host2/8060/1024000"
    curl -X GET "http://host:port/api/reset_rpc_channel/all"

