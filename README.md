# munin-insight

```
npm i -g munin-insight
```

# test

```
BASE_URL="https://localhost/insight-api" /usr/lib/node_modules/munin-insight/bin/insight_monitor.js
```

# munin plugin setup

```
ln -s /usr/bin/munin_insight /etc/munin/plugins/insight
```

## /etc/munin/plugin-conf.d/insight

```
[insight*]
env.BASE_URL https://localhost/insight-api
```
