# iraceresults
automatic simracing league scoring system

# General Info
- NodeJS application
- All config and data storage in .JSON files
- calls iRacing.com API to download results and processes them
- displays results in html : table.html
- web interface (partially completed) to allow editing of league config files (add drivers etc.)

# Basic File Structure
- main code in root.   primary app is <b>iraceresults.js</b>
- league setup file in <b>data</b> folder
- output results in <b>results</b> subfolder
- web interface driven by node using files in <b>html</b>, <b>img</b>, <b> css </b> and <b>script</b> folders

