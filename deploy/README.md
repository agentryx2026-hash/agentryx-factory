# deploy/

Runtime configuration that lives in `/etc/` on the VM but is **versioned here**. A `restore.sh` script symlinks these into the right system locations on a fresh VM, so migration #N is one command.

Will be populated in **Phase 1D — Repo the runtime config**.

## Planned contents

```
deploy/
├── restore.sh              # idempotent: symlinks all configs, daemon-reload, enable, start
├── nginx/
│   ├── claw-code.agentryx.dev.conf
│   └── dev-hub.agentryx.dev.conf
├── systemd/
│   ├── ttyd.service
│   ├── pixel-factory-ui.service
│   ├── pixel-factory-metrics.service
│   ├── pixel-factory-telemetry.service
│   ├── paperclip.service
│   ├── openclaw-gateway.service
│   └── cognitive-engine.service
├── ttyd/
│   └── default               # destined for /etc/default/ttyd
└── htpasswd/
    └── claw-code             # bcrypt'd, OK to commit (passwords are hashed)
```

## Why version `htpasswd` files

`htpasswd` files contain **bcrypt hashes**, not plaintext. Safe to commit. Plaintext credentials never live anywhere on disk in this repo.
