---
{
    "title": "CHECK ALL TABLET SEGMENT LOST",
    "language": "en"
}
---

# CHECK ALL TABLET SEGMENT LOST
   
There may be some exceptions that cause segment to be lost on BE node. However, the metadata shows that the tablet is normal. This abnormal replica is not detected by FE and cannot be automatically repaired.
When query comes, exception information is thrown that `failed to initialize storage reader`. The function of this interface is to check all tablets on the current BE node that have lost segment.

```
curl -X POST http://be_host:webserver_port/api/check_tablet_segment_lost?repair=xxx
```

When parameter `repair` is set to `true`, tablets with lost segment will be set to `SHUTDOWN` status and treated as bad replica, which can be detected and repaired by FE. Otherwise, all tablets with missing segment are returned and nothing is done.

The return is all tablets on the current BE node that have lost segment:

```
{
    status: "Success",
    msg: "Succeed to check all tablet segment",
    num: 3,
    bad_tablets: [
        11190,
        11210,
        11216
    ],
    set_bad: true,
    host: "172.3.0.101"
}
```