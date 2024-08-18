const stringify = require('csv-stringify');
const fs = require('fs');

async function exportCSV(filename, columns, data){
   //console.log ("Data is :", data)
   stringify.stringify(data, { header: true, columns: columns }, (err, output) => {
      if (err) throw err;
      filename = filename + '.csv'
      fs.writeFile(filename, output, (err) => {
         if (err) throw err;
         console.log('csv saved : ', filename);
      });
   });
}

exports.exportCSV = exportCSV