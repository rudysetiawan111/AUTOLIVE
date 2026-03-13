function categorizeVideo(title) {
  if (title.toLowerCase().includes('dance')) return 'Dance';
  if (title.toLowerCase().includes('cat')) return 'Animal';
  if (title.toLowerCase().includes('tech')) return 'Tech';
  return 'Other';
}

module.exports = { categorizeVideo };
