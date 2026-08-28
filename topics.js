/* BioVerseAR — single source of truth for the 7 topics.
   Adding real content to a locked topic later = flip `ready` to true and set `model`.
   That's the only change needed; the dashboard and AR view are fully data-driven.
   Badge names are fixed per the project scope — do not rename. */
window.TOPICS = [
  {
    id: 'animal-cells',
    name: 'Animal Cells',
    badge: 'Cellular Architect',
    phase: 1,
    ready: true,
    model: 'assets/models/animal_cell.glb'
    // Real optimized asset: 795,812 bytes, Draco-required (KHR_draco_mesh_compression)
    // + WebP textures. Draco decoder is vendored locally, so it renders with no network.
  },
  { id: 'human-cells',  name: 'Human Cells',            badge: 'DNA Decycler',    phase: 2, ready: false, model: null },
  { id: 'life-sciences',name: 'Life Sciences',          badge: 'Eco-Explorer',    phase: 2, ready: false, model: null },
  { id: 'earth-space',  name: 'Earth & Space Sciences', badge: 'Starlight Scout', phase: 2, ready: false, model: null },
  { id: 'matter',       name: 'Matter',                 badge: 'Particle Picker', phase: 2, ready: false, model: null },
  { id: 'force-motion', name: 'Force & Motion',         badge: 'Friction Fighter',phase: 2, ready: false, model: null },
  { id: 'energy',       name: 'Energy',                 badge: 'Spark Starter',   phase: 2, ready: false, model: null }
];
