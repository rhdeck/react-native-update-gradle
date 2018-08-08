const Path = require("path");
const activateADB = () => {
  const oldEnv = process.env["PATH"];
  if (oldEnv.indexOf("Android/sdk/platform-tools") === -1) {
    process.env["PATH"] = oldEnv + ":" + getPTPath();
  }
};

const getSDKPath = () => {
  //RIght now hardcoded for the mac
  return process.env["ANDROID_HOME"] !== undefined
    ? process.env["ANDROID_HOME"]
    : Path.join(process.env["HOME"], "Library", "Android", "sdk");
};
const getPTPath = () => {
  //RIght now hardcoded for the mac
  return Path.join(getSDKPath(), "platform-tools");
};
module.exports = { activateADB, getSDKPath, getPTPath };
