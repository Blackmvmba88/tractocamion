# Known limitations — v0.1.0 alpha

- PostgreSQL is required; there is no offline or embedded-database mode.
- NFC/RFID endpoints manage tag identifiers, but no physical reader adapter has been validated.
- Location updates are API requests, not GPS hardware telemetry.
- Dashboard refresh uses polling; WebSockets are not implemented.
- Payments are calculated records only; no payment provider is connected.
- Default seed credentials are for isolated local demonstrations only.
- User administration is available through the protected API; a dedicated admin UI is not implemented yet.
- Deployment, backup/restore, hardware and multi-platform behavior still require pilot validation.
- The remaining npm audit findings are two moderate transitive findings under Sequelize's `uuid` dependency. The proposed forced remediation downgrades Sequelize across major versions and is intentionally not applied.
