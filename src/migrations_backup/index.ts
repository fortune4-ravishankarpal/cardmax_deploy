import * as migration_20260902_085058 from './20260902_085058';
import * as migration_20260902_091850 from './20260902_091850';
import * as migration_20260902_094226_phase2_schema from './20260902_094226_phase2_schema';

export const migrations = [
  {
    up: migration_20260902_085058.up,
    down: migration_20260902_085058.down,
    name: '20260902_085058',
  },
  {
    up: migration_20260902_091850.up,
    down: migration_20260902_091850.down,
    name: '20260902_091850',
  },
  {
    up: migration_20260902_094226_phase2_schema.up,
    down: migration_20260902_094226_phase2_schema.down,
    name: '20260902_094226_phase2_schema'
  },
];
