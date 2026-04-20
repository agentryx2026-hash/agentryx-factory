# docs/

Operational documentation for the factory itself — runbooks, troubleshooting guides, ops procedures.

This is **distinct from** `pmd/` (which is the project-management / vision / architecture documents) and from `Modules/Documentation_Module.md` (which is the meta-design for documentation **the factory generates** for projects it builds).

## Planned contents (populated as needed)

```
docs/
├── runbooks/
│   ├── service_restart.md
│   ├── postgres_backup_restore.md
│   ├── volume_recovery.md
│   └── llm_provider_outage.md
├── troubleshooting/
│   ├── claw_code_not_loading.md
│   ├── dev_hub_502.md
│   └── cognitive_engine_429.md
└── ops/
    ├── snapshot_schedule.md
    ├── secret_rotation.md
    └── new_vm_setup.md
```

These are written reactively — when an incident happens, the runbook for next time gets written before the phase closes.
