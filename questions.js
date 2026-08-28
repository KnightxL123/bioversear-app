/* BioVerseAR — quiz question bank, per topic (data-driven, mirrors TOPICS ids).
 *
 * IMPORTANT: these Animal Cells questions are PLACEHOLDERS to build/test the engine.
 * The real question bank is written/approved by the research team + Ma'am Leah — swap
 * the `questions` array below for the final items; the engine needs no other change.
 *
 * Difficulty drives points: easy = 5, medium = 15, hard = 30 (additive, no penalty).
 * Same set is used for both pre-test and post-test (no randomization required).
 */
window.QUIZ_POINTS = { easy: 5, medium: 15, hard: 30 };

// Shown on a wrong answer (from the requirements questionnaire, Q5.3).
window.QUIZ_WRONG_FEEDBACK = [
  'Lacks focus', 'Too cautious', 'Too hasty',
  'Highly distracted', 'Unfocused pitch', 'Overly dependent'
];

window.QUIZZES = {
  'animal-cells': {
    // placeholder set — final wording from Ma'am Leah / research team
    questions: [
      { id: 'ac1', difficulty: 'easy',
        q: '(Sample) Which organelle is the control centre of the cell?',
        options: ['Nucleus', 'Mitochondrion', 'Golgi apparatus', 'Ribosome'], correct: 0 },
      { id: 'ac2', difficulty: 'easy',
        q: '(Sample) Which organelle is known as the “powerhouse of the cell”?',
        options: ['Golgi apparatus', 'Mitochondrion', 'Nucleus', 'Vacuole'], correct: 1 },
      { id: 'ac3', difficulty: 'medium',
        q: '(Sample) What is the main job of the Golgi apparatus?',
        options: ['Storing DNA', 'Making energy', 'Packaging and shipping proteins', 'Breaking down water'], correct: 2 },
      { id: 'ac4', difficulty: 'medium',
        q: '(Sample) The rough endoplasmic reticulum is studded with which structures?',
        options: ['Ribosomes', 'Mitochondria', 'Chromosomes', 'Vacuoles'], correct: 0 },
      { id: 'ac5', difficulty: 'hard',
        q: '(Sample) Which structure has NO ribosomes and helps make lipids?',
        options: ['Rough ER', 'Nucleolus', 'Smooth ER', 'Cell membrane'], correct: 2 }
    ]
  }
};
