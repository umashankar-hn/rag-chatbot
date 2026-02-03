export type Intent = {
  id: string;
  name: string;
  examples: string[];
  keywords: string[];
};

// Configurable list of intents. Edit this file to add/remove intents without changing code logic.
export const intents: Intent[] = [
  {
    id: 'list_candidates',
    name: 'ListCandidates',
    examples: [
      'list all candidates',
      'show me the candidates',
      'list of applicants',
      'who are the candidates',
      'show names',
    ],
    keywords: ['candidate', 'candidates', 'applicant', 'applicants', 'name'],
  },
  {
    id: 'certifications',
    name: 'Certifications',
    examples: [
      'what certifications',
      'list certifications',
      'certifications of umashankar',
      'certified in',
    ],
    keywords: ['certif', 'certification', 'full stack', 'certified'],
  },
  {
    id: 'education',
    name: 'Education',
    examples: [
      'education details',
      'degree',
      'where did x study',
      'm.tech',
      'college',
      'university',
    ],
    keywords: ['education', 'm.tech', 'degree', 'college', 'university'],
  },
];
