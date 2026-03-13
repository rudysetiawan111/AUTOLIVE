const { calculateEngagement } = require('../../backend/analyzers/engagementAnalyzer');

function predictVirality(video) {
  const engagement = parseFloat(calculateEngagement(video));
  if (engagement > 5) return 'High';
  if (engagement > 2) return 'Medium';
  return 'Low';
}

module.exports = { predictVirality };
