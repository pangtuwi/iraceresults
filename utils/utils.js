function deepCopy(obj1){
   const obj2 = JSON.parse(JSON.stringify(obj1));
   return obj2;
}

// Returns the display name to use for a driver
// Prefers custom_display_name if set, otherwise falls back to display_name from iRacing
function getDriverDisplayName(driver) {
   if (!driver) return '';
   return driver.custom_display_name && driver.custom_display_name.trim()
      ? driver.custom_display_name
      : driver.display_name;
}

exports.deepCopy = deepCopy;
exports.getDriverDisplayName = getDriverDisplayName;