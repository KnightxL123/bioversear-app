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
    // Numbering matches the original model (1 Golgi … 5 Smooth ER). Positions were
    // sampled on OUR mesh at each organelle's location (from the user's screenshot),
    // so they sit on the right parts; fine-tune any pin via author mode (?author=1).
    annotations: [
      { id: 1, title: 'Golgi Apparatus', position: '0.0601 -0.0171 0.2050', normal: '0.5834 -0.4136 0.6990',
        body: "The Golgi apparatus (also known as the Golgi body) packages proteins and lipids into vesicles, preparing them to be delivered throughout the cell." },
      { id: 2, title: 'Mitochondria', position: '-0.0233 -0.0532 0.2193', normal: '-0.1879 -0.4451 0.8755',
        body: "The mitochondria, or mitochondrion, is the only organelle that has its own genome and can reproduce by fission. It has two membranes and is responsible for making energy, storing calcium and controlling functions like cell growth and death." },
      { id: 3, title: 'Rough Endoplasmic Reticulum', position: '-0.0502 0.0042 0.0976', normal: '-0.0094 0.9442 0.3294',
        body: "The Rough Endoplasmic Reticulum, or rough ER, differs from the smooth ER in that its surface is covered with bumpy ribosomes. These help the ER synthesize and target proteins. Since it's so close to the nucleus, it is able to communicate with it about protein synthesis." },
      { id: 4, title: 'Nucleus', position: '-0.0256 0.0559 -0.0620', normal: '0.0958 -0.8707 0.4823',
        body: "The nucleus is the main control center of the cell. It has its own double membrane and contains a gel-like substance called nucleoplasm, which holds internal structures like the nucleolus. The nucleolus is made up of tightly coiled chromosomes that hold the cell's entire genetic code. The nucleus uses this information to communicate with the rough ER about protein synthesis." },
      { id: 5, title: 'Smooth Endoplasmic Reticulum', position: '-0.0827 -0.0037 0.2175', normal: '-0.0018 0.9960 0.0898',
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
