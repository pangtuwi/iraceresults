function deepCopy(obj1){
   const obj2 = JSON.parse(JSON.stringify(obj1));
   return obj2;
}

exports.deepCopy = deepCopy;