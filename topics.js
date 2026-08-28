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

    // Attribution is required by the model's CC-BY license — render it in the AR view.
    credit: {
      title: 'Animal cell 2.0 — annotated in English',
      author: 'montanna',
      url: 'https://sketchfab.com/3d-models/animal-cell-20-annotated-in-english-0d9f7f4257224975b2ef83a283709b2f',
      license: 'CC BY 4.0'
    },
    // Annotation TEXT is verbatim from montanna's model (CC-BY, credited above).
    // NOTE: `position`/`normal` are PROVISIONAL spread points on our model — Sketchfab's
    // own annotation coordinates don't map onto our optimized/rescaled mesh, so the pins
    // must be re-placed on the real organelles via author mode (ar.html?author=1).
    annotations: [
      { id: 1, title: 'Nucleus', position: '-0.0164 -0.0050 0.2126', normal: '-0.099 0.961 0.257',
        body: "The nucleus is the main control center of the cell. It has its own double membrane and contains a gel-like substance called nucleoplasm, which holds internal structures like the nucleolus. The nucleolus is made up of tightly coiled chromosomes that hold the cell's entire genetic code. The nucleus uses this information to communicate with the rough ER about protein synthesis." },
      { id: 2, title: 'Mitochondria', position: '-0.0163 -0.1212 0.1814', normal: '-0.091 -0.546 0.833',
        body: "The mitochondria, or mitochondrion, is the only organelle that has its own genome and can reproduce by fission. It has two membranes and is responsible for making energy, storing calcium and controlling functions like cell growth and death." },
      { id: 3, title: 'Golgi Apparatus', position: '0.0668 -0.0071 0.2049', normal: '0.249 0.911 0.329',
        body: "The Golgi apparatus (also known as the Golgi body) packages proteins and lipids into vesicles, preparing them to be delivered throughout the cell." },
      { id: 4, title: 'Rough Endoplasmic Reticulum', position: '-0.0151 0.0562 -0.0601', normal: '-0.094 -0.941 0.324',
        body: "The Rough Endoplasmic Reticulum, or rough ER, differs from the smooth ER in that its surface is covered with bumpy ribosomes. These help the ER synthesize and target proteins. Since it's so close to the nucleus, it is able to communicate with it about protein synthesis." },
      { id: 5, title: 'Smooth Endoplasmic Reticulum', position: '-0.0998 -0.0169 0.2056', normal: '-0.761 -0.041 0.648',
        body: "The smooth endoplasmic reticulum differs from the rough ER in that it has no ribosomes on its surface. It synthesizes lipids and hormones." }
    ]
  },
  { id: 'human-cells',  name: 'Human Cells',            badge: 'DNA Decycler',    phase: 2, ready: false, model: null },
  { id: 'life-sciences',name: 'Life Sciences',          badge: 'Eco-Explorer',    phase: 2, ready: false, model: null },
  { id: 'earth-space',  name: 'Earth & Space Sciences', badge: 'Starlight Scout', phase: 2, ready: false, model: null },
  { id: 'matter',       name: 'Matter',                 badge: 'Particle Picker', phase: 2, ready: false, model: null },
  { id: 'force-motion', name: 'Force & Motion',         badge: 'Friction Fighter',phase: 2, ready: false, model: null },
  { id: 'energy',       name: 'Energy',                 badge: 'Spark Starter',   phase: 2, ready: false, model: null }
];
