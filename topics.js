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
    model: 'assets/models/animal_cell.glb',
    // Real optimized asset: 795,812 bytes, Draco-required (KHR_draco_mesh_compression)
    // + WebP textures. Draco decoder is vendored locally, so it renders with no network.

    // POC hotspot annotations. These show in the on-page 3D viewer only (NOT in Scene
    // Viewer AR). position/normal are real surface points sampled from this model.
    // Labels + text are SAMPLE placeholders for the demo — final wording and exact
    // placement to be set with the research team (tap the model to get new coordinates).
    annotations: [
      { id: 1, title: 'Nucleus',         position: '-0.274 -0.083 3.544', normal: '-0.099 0.961 0.257',
        body: 'The control centre of the cell. It stores the DNA and directs the cell’s activities. (Sample text — placeholder for the demo.)' },
      { id: 2, title: 'Mitochondrion',   position: '-1.663 -0.281 3.427', normal: '-0.761 -0.041 0.648',
        body: 'The cell’s “powerhouse” — it releases energy the cell can use. (Sample text — placeholder for the demo.)' },
      { id: 3, title: 'Golgi apparatus', position: '1.113 -0.119 3.415',  normal: '0.249 0.911 0.329',
        body: 'Packages and ships proteins to where they are needed. (Sample text — placeholder for the demo.)' },
      { id: 4, title: 'Cytoplasm',       position: '-0.271 -2.020 3.024', normal: '-0.091 -0.546 0.833',
        body: 'The jelly-like fluid that fills the cell and holds the organelles in place. (Sample text — placeholder for the demo.)' }
    ]
  },
  { id: 'human-cells',  name: 'Human Cells',            badge: 'DNA Decycler',    phase: 2, ready: false, model: null },
  { id: 'life-sciences',name: 'Life Sciences',          badge: 'Eco-Explorer',    phase: 2, ready: false, model: null },
  { id: 'earth-space',  name: 'Earth & Space Sciences', badge: 'Starlight Scout', phase: 2, ready: false, model: null },
  { id: 'matter',       name: 'Matter',                 badge: 'Particle Picker', phase: 2, ready: false, model: null },
  { id: 'force-motion', name: 'Force & Motion',         badge: 'Friction Fighter',phase: 2, ready: false, model: null },
  { id: 'energy',       name: 'Energy',                 badge: 'Spark Starter',   phase: 2, ready: false, model: null }
];
