#!/usr/bin/env node
var didUpdate = false;
const fs = require("fs");
const Path = require("path");
const cp = require("child_process");
const rnug = require("./");
const curdir = process.cwd();
const androidPath = Path.join(curdir, "android");
const targetGradleURI =
  "https://services.gradle.org/distributions/gradle-4.10-all.zip";
const androidGradlePluginVersion = "3.3.2";
if (!fs.existsSync(androidPath)) {
  console.log(
    "This needs to be run from the root of a react-native project that has android code in ./android"
  );
  process.exit();
}
//Update gradle-wrapper.properties
const propPath = Path.join(
  androidPath,
  "gradle",
  "wrapper",
  "gradle-wrapper.properties"
);
if (!fs.existsSync(propPath)) {
  console.log("I cannot find gradle wrapper configuration at", propPath);
  process.exit();
}
const text = fs.readFileSync(propPath, { encoding: "UTF8" });
const newText = text
  .split("\n")
  .map(line => {
    if (line.startsWith("distributionUrl")) {
      const parts = line.split("=");
      const uri = parts[1];
      if (uri != targetGradleURI) {
        return [parts[0], targetGradleURI].join("=");
      } else {
        return line;
      }
    } else {
      return line;
    }
  })
  .join("\n");
if (text != newText) {
  console.log("Writing to ", propPath);
  fs.writeFileSync(propPath, newText);
  didUpdate = true;
}
//Update android gradle plugin
const bgpath = Path.join(androidPath, "build.gradle");

if (!fs.existsSync(bgpath)) {
  console.log("I cannot find build.gradle at", bgpath);
  process.exit();
}
const bgText = fs.readFileSync(bgpath, { encoding: "UTF8" });
var bgLines = bgText.split("\n");
//Go looking for the google indicator
if (
  bgLines.filter(line => {
    return line.indexOf("google()") > -1;
  }).length === 0
) {
  //Iterate until we find repositories

  //Did not find my google directive, implying we are on old stuff
  //iterate through
  var buildScript;
  var repositories;
  var done = false;
  bgLines.forEach((line, index) => {
    if (done) return;
    if (!buildScript) {
      buildScript = line.startsWith("buildscript {");
    } else if (!repositories) {
      repositories = line.trim().startsWith("repositories {");
      if (repositories) {
        bgLines.splice(index + 1, 0, ["google()"]);
        done = true;
      }
    }
  });
  //Fix android plugin
  const bgOutText = bgLines
    .map(line => {
      if (line.indexOf("com.android.tools.build:gradle") > -1) {
        return (
          "classpath 'com.android.tools.build:gradle:" +
          androidGradlePluginVersion +
          "'"
        );
      } else return line;
    })
    .join("\n");
  fs.writeFileSync(bgpath, bgOutText);
  console.log("Updated ", bgpath);
  didUpdate = true;
}
rnug.activateADB();
process.chdir(Path.join(process.cwd(), "android"));
var lptext = "";
const lp = Path.join(process.cwd(), "local.properties");
if (fs.existsSync(lp)) {
  lptext = fs.readFileSync(lp, { encoding: "UTF8" });
}
if (lptext.indexOf(rnug.getSDKPath()) === -1) {
  lptext = lptext + "\n" + "sdk.dir=" + rnug.getSDKPath();
  fs.writeFileSync(lp, lptext);
}
//process.env["ANDROID_HOME"] = rnug.getSDKPath();
//console.log(process.env);
cp.spawnSync("./gradlew", ["init"], { stdio: "inherit" });
