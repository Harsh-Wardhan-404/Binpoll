// Date utility functions

const isDateValid = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const isDateInFuture = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

const isDateInPast = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

const formatDate = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString();
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const getDaysDifference = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  return Math.round((secondDate - firstDate) / oneDay);
};

const isPollActive = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return now >= start && now <= end;
};

const isPollExpired = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  
  return now > end;
};

const isPollUpcoming = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  
  return now < start;
};

module.exports = {
  isDateValid,
  isDateInFuture,
  isDateInPast,
  formatDate,
  addDays,
  addHours,
  getDaysDifference,
  isPollActive,
  isPollExpired,
  isPollUpcoming
};
