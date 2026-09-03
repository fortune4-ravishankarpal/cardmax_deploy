import * as migration_20260902_111236_phase2_schema_2 from './20260902_111236_phase2_schema_2';
import * as migration_20260903_add_consent_audit_fields from './20260903_add_consent_audit_fields';

export const migrations = [
  {
    up: migration_20260902_111236_phase2_schema_2.up,
    down: migration_20260902_111236_phase2_schema_2.down,
    name: '20260902_111236_phase2_schema_2',
  },
  {
    up: migration_20260903_add_consent_audit_fields.up,
    down: migration_20260903_add_consent_audit_fields.down,
    name: '20260903_add_consent_audit_fields',
  },
];

