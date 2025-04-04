const modelJObject = (arrayObj) => {
  let data = {
    ip: new String(arrayObj.ip),
    portaria: parseInt(arrayObj.portaria),
    user: new String(arrayObj.userName),
    pass: new String(arrayObj.userPass),
    empresa: new String(arrayObj.empresa),
    empresaDir: new String(arrayObj.empresaDir),
    item: parseInt(arrayObj.item),
    ipFinal: parseInt(arrayObj.ipFinal)
  };

  return data;
};
