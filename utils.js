const subtractDates = function (date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  let diff = (d2 - d1) / 1000;
  diff = Math.abs(Math.floor(diff));
  const days = Math.floor(diff / (24 * 60 * 60));
  let leftSec = diff - days * 24 * 60 * 60;
  const hrs = Math.floor(leftSec / (60 * 60));
  leftSec = leftSec - hrs * 60 * 60;
  const min = Math.floor(leftSec / 60);
  leftSec = leftSec - min * 60;
  const minutes = isNaN(min) ? '--' : min;
  const seconds = isNaN(leftSec) ? '--' : leftSec;
  return `${minutes}m ${seconds}s`;
};

module.exports = {subtractDates}