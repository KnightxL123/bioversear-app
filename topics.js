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
      { id: 1, title: 'Golgi Apparatus', position: '0.06126 -0.00108 0.16052', normal: '0.80999 -0.13181 0.57145',
        body: "The Golgi apparatus (also known as the Golgi body) packages proteins and lipids into vesicles, preparing them to be delivered throughout the cell." },
      { id: 2, title: 'Mitochondria', position: '-0.01625 0.00294 0.20321', normal: '-0.27104 0.69175 0.66934',
        body: "The mitochondria, or mitochondrion, is the only organelle that has its own genome and can reproduce by fission. It has two membranes and is responsible for making energy, storing calcium and controlling functions like cell growth and death." },
      { id: 3, title: 'Rough Endoplasmic Reticulum', position: '-0.02150 -0.02222 0.05267', normal: '0.02236 -0.04114 0.99890',
        body: "The Rough Endoplasmic Reticulum, or rough ER, differs from the smooth ER in that its surface is covered with bumpy ribosomes. These help the ER synthesize and target proteins. Since it's so close to the nucleus, it is able to communicate with it about protein synthesis." },
      { id: 4, title: 'Nucleus', position: '-0.04244 0.01079 -0.02709', normal: '0 1 0.00108',
        body: "The nucleus is the main control center of the cell. It has its own double membrane and contains a gel-like substance called nucleoplasm, which holds internal structures like the nucleolus. The nucleolus is made up of tightly coiled chromosomes that hold the cell's entire genetic code. The nucleus uses this information to communicate with the rough ER about protein synthesis." },
      { id: 5, title: 'Smooth Endoplasmic Reticulum', position: '-0.10418 0.00976 0.12139', normal: '-0.83528 0.17464 0.52136',
        body: "The smooth endoplasmic reticulum differs from the rough ER in that it has no ribosomes on its surface. It synthesizes lipids and hormones." }
    ]
  },
  // Topics 2-7: quiz content is live (real 30-question bank each). Their AR 3D models
  // aren't sourced yet, so `model` stays null -> the topic hub shows "3D model coming
  // soon" for AR while Pre/Post quizzes work. Drop in a model + flip nothing else:
  // ar.html and the hub read `model` directly. Set an `annotations` array when the
  // model has hotspots.
  { id: 'human-cells',  name: 'Human Cells', badge: 'DNA Decycler', phase: 2, ready: true, model: 'assets/models/human_cell.glb',
    // Pins placed via annotate.html (positions sampled on our mesh). Bodies are
    // drafts — teacher to review/replace.
    annotations: [
      { id: 1,  title: 'DNA',                         position: '-0.02519 0.01561 0.00371',  normal: '-0.12086 -0.05583 -0.99110', body: '' },
      { id: 2,  title: 'Nucleolus',                   position: '-0.03470 0.00327 0.00930',  normal: '0.82049 0.49034 -0.29387',   body: '' },
      { id: 3,  title: 'Nucleus',                     position: '-0.05508 0.02688 0.00426',  normal: '0.88263 0.08795 -0.46176',   body: '' },
      { id: 4,  title: 'Mitochondrion',               position: '-0.08844 -0.00913 -0.08768', normal: '-0.04586 -0.99716 -0.05982', body: '' },
      { id: 5,  title: 'Golgi Apparatus',             position: '0.01799 -0.00052 -0.08704',  normal: '-0.00749 0.99964 -0.02572',  body: '' },
      { id: 6,  title: 'Lysosome',                    position: '0.00001 -0.00969 -0.10184',  normal: '0.02847 0.99478 -0.09800',   body: '' },
      { id: 7,  title: 'Cytoplasm',                   position: '0.14366 -0.01405 -0.01633',  normal: '-0.04151 0.99839 -0.03873',  body: '' },
      { id: 8,  title: 'Rough Endoplasmic Reticulum', position: '-0.04369 -0.01287 0.07928',  normal: '-0.08968 0.98914 0.11649',   body: '' },
      { id: 9,  title: 'Centrosome',                  position: '0.03457 -0.01128 0.11908',   normal: '0.04447 -0.26579 0.96300',   body: '' },
      { id: 10, title: 'Ribosomes',                   position: '-0.00153 -0.00303 0.14287',  normal: '-0.51382 0.55702 0.65247',   body: '' }
    ] },
  { id: 'life-sciences',name: 'Life Sciences',          badge: 'Eco-Explorer',    phase: 2, ready: true, model: 'assets/models/plant_cell.glb' },
  { id: 'earth-space',  name: 'Earth & Space Sciences', badge: 'Starlight Scout', phase: 2, ready: true, model: 'assets/models/solar_system.glb', space: true },
  { id: 'matter',       name: 'Matter',                 badge: 'Particle Picker', phase: 2, ready: true, model: null },
  { id: 'force-motion', name: 'Force & Motion',         badge: 'Friction Fighter',phase: 2, ready: true, model: 'assets/models/pendulum.glb' },
  { id: 'energy',       name: 'Energy',                 badge: 'Spark Starter',   phase: 2, ready: true, model: null }
];
