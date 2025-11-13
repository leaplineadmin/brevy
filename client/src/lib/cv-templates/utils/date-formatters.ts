// Utility functions for date formatting in CV templates

// Format date for education and certifications (year only)
export const formatEducationDate = (dateStr?: string): string => {
  if (!dateStr) return "";

  // If it's already just a year (4 digits), return it
  if (/^\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle old formats: "MM/YYYY" or "YYYY-MM"
  let month, year;

  if (dateStr.includes("/")) {
    [month, year] = dateStr.split("/");
  } else if (dateStr.includes("-")) {
    [year, month] = dateStr.split("-");
  } else {
    return dateStr;
  }

  // Return only the year
  return year || "";
};

// Format date for experience (month/year)
export const formatExperienceDate = (dateStr?: string): string => {
  if (!dateStr) return "";

  // Handle formats: "MM/YYYY" or "YYYY-MM"
  let month, year;

  if (dateStr.includes("/")) {
    [month, year] = dateStr.split("/");
  } else if (dateStr.includes("-")) {
    [year, month] = dateStr.split("-");
  } else {
    return dateStr;
  }

  if (!month || !year) return dateStr;

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthIndex = parseInt(month) - 1;
  const monthName = monthNames[monthIndex] || month;

  return `${monthName} ${year}`;
};
