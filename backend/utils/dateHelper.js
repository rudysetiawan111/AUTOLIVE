class DateHelper {
  constructor() {
    this.months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    this.days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday'
    ];
    
    this.shortMonths = this.months.map(m => m.substring(0, 3));
    this.shortDays = this.days.map(d => d.substring(0, 3));
  }

  // Format date
  format(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    
    const replacements = {
      'YYYY': d.getFullYear(),
      'YY': String(d.getFullYear()).slice(-2),
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'M': d.getMonth() + 1,
      'MMMM': this.months[d.getMonth()],
      'MMM': this.shortMonths[d.getMonth()],
      'DD': String(d.getDate()).padStart(2, '0'),
      'D': d.getDate(),
      'dddd': this.days[d.getDay()],
      'ddd': this.shortDays[d.getDay()],
      'HH': String(d.getHours()).padStart(2, '0'),
      'H': d.getHours(),
      'hh': String(d.getHours() % 12 || 12).padStart(2, '0'),
      'h': d.getHours() % 12 || 12,
      'mm': String(d.getMinutes()).padStart(2, '0'),
      'm': d.getMinutes(),
      'ss': String(d.getSeconds()).padStart(2, '0'),
      's': d.getSeconds(),
      'SSS': String(d.getMilliseconds()).padStart(3, '0'),
      'A': d.getHours() >= 12 ? 'PM' : 'AM',
      'a': d.getHours() >= 12 ? 'pm' : 'am'
    };
    
    return format.replace(/YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|SSS|A|a/g, 
      match => replacements[match] || match
    );
  }

  // Get relative time
  timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) {
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
    if (months > 0) {
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    if (weeks > 0) {
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    return 'just now';
  }

  // Get time remaining
  timeRemaining(date) {
    const now = new Date();
    const future = new Date(date);
    const diff = future - now;
    
    if (diff < 0) return 'expired';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) {
      return years === 1 ? '1 year remaining' : `${years} years remaining`;
    }
    if (months > 0) {
      return months === 1 ? '1 month remaining' : `${months} months remaining`;
    }
    if (weeks > 0) {
      return weeks === 1 ? '1 week remaining' : `${weeks} weeks remaining`;
    }
    if (days > 0) {
      return days === 1 ? '1 day remaining' : `${days} days remaining`;
    }
    if (hours > 0) {
      return hours === 1 ? '1 hour remaining' : `${hours} hours remaining`;
    }
    if (minutes > 0) {
      return minutes === 1 ? '1 minute remaining' : `${minutes} minutes remaining`;
    }
    return 'less than a minute remaining';
  }

  // Check if date is today
  isToday(date) {
    const d = new Date(date);
    const today = new Date();
    
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }

  // Check if date is yesterday
  isYesterday(date) {
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
  }

  // Check if date is tomorrow
  isTomorrow(date) {
    const d = new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();
  }

  // Check if date is in the future
  isFuture(date) {
    return new Date(date) > new Date();
  }

  // Check if date is in the past
  isPast(date) {
    return new Date(date) < new Date();
  }

  // Get start of day
  startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Get end of day
  endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // Get start of week (Sunday)
  startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return this.startOfDay(d);
  }

  // Get end of week (Saturday)
  endOfWeek(date) {
    const d = this.startOfWeek(date);
    d.setDate(d.getDate() + 6);
    return this.endOfDay(d);
  }

  // Get start of month
  startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    return this.startOfDay(d);
  }

  // Get end of month
  endOfMonth(date) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return this.endOfDay(d);
  }

  // Get start of year
  startOfYear(date) {
    const d = new Date(date);
    d.setMonth(0, 1);
    return this.startOfDay(d);
  }

  // Get end of year
  endOfYear(date) {
    const d = new Date(date);
    d.setMonth(11, 31);
    return this.endOfDay(d);
  }

  // Add days
  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // Add months
  addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // Add years
  addYears(date, years) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  // Add hours
  addHours(date, hours) {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
  }

  // Add minutes
  addMinutes(date, minutes) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
  }

  // Add seconds
  addSeconds(date, seconds) {
    const d = new Date(date);
    d.setSeconds(d.getSeconds() + seconds);
    return d;
  }

  // Get difference in days
  diffInDays(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d1 - d2;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Get difference in hours
  diffInHours(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d1 - d2;
    return Math.floor(diff / (1000 * 60 * 60));
  }

  // Get difference in minutes
  diffInMinutes(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d1 - d2;
    return Math.floor(diff / (1000 * 60));
  }

  // Get difference in seconds
  diffInSeconds(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d1 - d2;
    return Math.floor(diff / 1000);
  }

  // Get range of dates
  getDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  // Check if date is within range
  isWithinRange(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return d >= start && d <= end;
  }

  // Get day of year
  dayOfYear(date) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  // Get week of year
  weekOfYear(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  // Get quarter
  getQuarter(date) {
    const d = new Date(date);
    return Math.floor(d.getMonth() / 3) + 1;
  }

  // Get age from birthdate
  getAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Check if date is a weekend
  isWeekend(date) {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  // Check if date is a weekday
  isWeekday(date) {
    return !this.isWeekend(date);
  }

  // Get next occurrence of day
  nextDay(date, targetDay) {
    const d = new Date(date);
    const currentDay = d.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    
    if (daysToAdd === 0) return d;
    
    d.setDate(d.getDate() + daysToAdd);
    return d;
  }

  // Get previous occurrence of day
  previousDay(date, targetDay) {
    const d = new Date(date);
    const currentDay = d.getDay();
    const daysToSubtract = (currentDay - targetDay + 7) % 7;
    
    if (daysToSubtract === 0) return d;
    
    d.setDate(d.getDate() - daysToSubtract);
    return d;
  }

  // Get business days between dates
  businessDaysBetween(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isWeekday(currentDate)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  // Add business days
  addBusinessDays(date, days) {
    let result = new Date(date);
    let added = 0;
    
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (this.isWeekday(result)) {
        added++;
      }
    }
    
    return result;
  }

  // Get timezone offset in hours
  getTimezoneOffset(date = new Date()) {
    return -date.getTimezoneOffset() / 60;
  }

  // Convert to timezone
  toTimezone(date, timezone) {
    // This would require a library like moment-timezone
    // For now, return the date as is
    return new Date(date);
  }

  // Get calendar representation
  getCalendar(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    let week = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startOffset; i++) {
      week.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }
    
    // Add empty cells for remaining days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }
    
    return {
      year,
      month: this.months[month],
      days: calendar
    };
  }
}

module.exports = new DateHelper();
