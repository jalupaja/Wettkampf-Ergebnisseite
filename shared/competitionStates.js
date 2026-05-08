// Shared enumeration for competition states used by both backend and frontend
export const CompetitionStates = Object.freeze({
  SETUP: 'setup',
  QUALIFICATION: 'qualification',
  FINALE: 'finale',
  FINISHED: 'finished'
});

export const CompetitionStateValues = Object.values(CompetitionStates);

export default CompetitionStates;
